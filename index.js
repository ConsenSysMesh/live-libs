"use strict";

var generateAbstractLib = require('./lib/generate');
var versionUtils = require('./lib/version-utils');
var ethUtils = require('./lib/eth-utils');

function LiveLibs(web3, config) {
  config = buildConfig(config);

  var testing = config.testing;
  var logger = getLogger(config.verbose);

  this.env = function(callback) {
    findContract(function(err, contract) {
      if (err) return callback(err);
      if (contract) {
        callback(null, contract.env);
      } else {
        callback(Error('Unable to detect environment!'));
      }
    });
  }

  this.get = function(libName, version) {
    return new Promise(function(resolve, reject) {
      if (version) {
        resolve(versionUtils.parse(version));
      } else {
        findContract(function(error, contract) {
          if (error) return reject(error);
          versionUtils.latest(libName, contract, function(err, v) {
            if (err) return reject(err);
            if (!v) return reject('No versions of '+libName+' found');
            resolve(v);
          });
        });
      }
    }).then(function(v) {
      return new Promise(function(resolve, reject) {
        findContract(function(error, contract) {
          if (error) return reject(error);
          contract.get(libName, v.num, function(err, rawLibData) {
            if (err) return reject(err);
            if (ethUtils.blankAddress(rawLibData[0])) {
              reject(libName+' '+v.string+' is locked');
            } else {
              resolve({
                v: v,
                address: rawLibData[0],
                abi: rawLibData[1],
                rawResourceKeys: rawLibData[2],
                thresholdWei: rawLibData[3].toString(),
                totalValue: rawLibData[4].toString(),
                abstractSource: function() { return generateAbstractLib(libName, rawLibData[1]); }
              });
            }
          });
        });
      });
    }).then(function(libInfo) {
      return new Promise(function(resolve, reject) {
        var promises = [];
        var resources = {};
        libInfo.rawResourceKeys.forEach(function(rawKey) {
          var promise = new Promise(function(resolve, reject) {
            var key = ethUtils.toAscii(web3, rawKey);
            findContract(function(error, contract) {
              if (error) return reject(error);
              contract.getResource(libName, libInfo.v.num, key, function(err, uri) {
                if (err) return reject(err);
                resources[key] = uri;
                resolve();
              });
            });
          });
          promises.push(promise);
        });
        return Promise.all(promises).then(function() {
          libInfo.version = libInfo.v.string;
          delete libInfo.v;
          delete libInfo.rawResourceKeys;
          libInfo.resources = resources;
          resolve(libInfo);
        });
      });
    });
  };

  this.log = function(libName) {
    return new Promise(function(resolve, reject) {
      filterEventsBy(libName, function(error, results) {
        if (error) return reject(error);
        return resolve(results);
      });
    }).then(function(rawEvents) {
      var events = [];
      var promises = [];
      rawEvents.forEach(function(raw) {
        delete raw.args.libName; // since we're already filtering by name
        if (raw.args.versionNum) {
          raw.args.version = versionUtils.calc(raw.args.versionNum).string;
          delete raw.args.versionNum;
        }
        if (raw.args.key) {
          raw.args.key = ethUtils.toAscii(web3, raw.args.key);
        }

        var event = {type: raw.event, args: raw.args};
        events.push(event);

        var promise = new Promise(function(resolve, reject) {
          web3.eth.getBlock(raw.blockNumber, function(err, block) {
            if (err) return reject(err);
            event.time = block.timestamp;
            resolve();
          });
        });
        promises.push(promise);
      });
      return Promise.all(promises).then(function() { return events; });
    });
  };

  this.register = function(libName, version, address, abiString, resources, thresholdWei) {
    var parsedVersion;
    if (version) {
      parsedVersion = versionUtils.parse(version);
    }

    return new Promise(function(resolve, reject) {
      if (!libName || libName.length > 32)
        return reject('Library names must be between 1-32 characters.');

      if (resources) {
        Object.keys(resources).forEach(function(key) {
          if (!key || key.length > 32)
            return reject('Resource keys must be between 1-32 characters.');
        });
      } else {
        resources = {};
      }

      if (!parsedVersion)
        return reject('No version specified for '+libName);

      findContract(function(error, contract) {
        if (error) return reject(error);
        contract.register(
          libName,
          parsedVersion.num,
          address,
          abiString,
          (thresholdWei || 0),
          {value: 0, gas: 2000000}, // TODO: need to estimate this
          promiseHandler(resolve, reject)
        );
      });
    }).then(function(txHash) {
      var message = 'Registered '+libName+' '+version+'!';
      if (thresholdWei > 0)
        message += ' Locked until '+thresholdWei+' wei contributed.';
      return txHandler(txHash, message);
    }).then(function() {
      var promises = []
      Object.keys(resources).forEach(function(key) {
        var promise = new Promise(function(resolve, reject) {
          findContract(function(err, contract) {
            if (err) return reject(err);
            contract.registerResource(
              libName,
              parsedVersion.num,
              key,
              resources[key],
              {value: 0, gas: 2000000}, // TODO: need to estimate this
              promiseHandler(resolve, reject)
            );
          });
        }).then(function(txHash) {
          var message = 'Registered resource for '+libName+' '+version+'!';
          return txHandler(txHash, message);
        });
        promises.push(promise);
      });
      return Promise.all(promises);
    });
  };

  this.contributeTo = function(libName, version, wei) {
    return new Promise(function(resolve, reject) {
      if (!wei)
        return reject('No wei amount specified');

      findContract(function(err, liveLibsContract) {
        if (err) return reject(err);
        liveLibsContract.libFund(function(error, libFundAddress) {
          if (error) return reject(error);
          liveAddress(libFundAddress, function(err, isLive) {
            if (err) return reject(err);
            if (!isLive) return reject('LibFund instance not found!');

            var abi = JSON.parse(config.libFundABIString);
            var libFundContract = web3.eth.contract(abi);
            var instance = libFundContract.at(libFundAddress);
            var v = versionUtils.parse(version);

            instance.addTo(
              libName,
              v.num,
              {value: wei, gas: 2000000}, // TODO: need to estimate this
              function(err, txHash) {
                if (err) {
                  reject(err);
                } else {
                  resolve(txHash);
                }
              }
            );
          });
        });
      });
    }).then(function(txHash) {
      return txHandler(txHash, 'Contributed '+wei+' wei to '+libName+' '+version+'!');
    });
  };

  this.allNames = function(callback) {
    findContract(function(err, contract) {
      if (err) return callback(err);
      contract.allNames(function(error, rawNames) {
        if (error) return callback(error);
        var names = [];
        rawNames.forEach(function(rawName) {
          var plainName = ethUtils.toAscii(web3, rawName);
          names.push(plainName);
        });
        callback(null, names);
      });
    });
  };

  this.allVersionsFor = function(libName) {
    var versionStrings = [];
    findContract(function(err, contract) {
      if (err) return callback(err);
      contract.getVersions(libName, function(error, rawVersions) {
        if (error) return callback(error);
        rawVersions.forEach(function(rawVersion) {
          var version = versionUtils.calc(rawVersion);
          versionStrings.push(version.string);
        });
        callback(null, versionStrings);
      });
    });
  };

  function findContract(callback) {
    var contract = web3.eth.contract(liveLibsABI());

    if (testing) // short-curcuit if we know we're testing
      return findTestRPCInstance(contract, callback);

    detectLiveLibsInstance(contract, function(err, instance) {
      if (err) return callback(err);
      if (instance) {
        callback(null, instance);
      } else {
        findTestRPCInstance(contract, function(err, instance) {
          if (err) {
            callback(err);
          } else if (instance) {
            callback(null, instance);
          } else {
            callback(Error('No Live Libs instance found'));
          }
        });
      }
    });
  }
  this.findContract = findContract; // exposing it for the CLI

  function liveLibsABI() {
    // NOTE: before updating this file, download the latest registry from networks
    return JSON.parse(config.liveLibsABIString);
  }

  function detectLiveLibsInstance(contract, callback) {
    var config = parseNetworkConfig();
    var promises = [];
    Object.keys(config).forEach(function(networkName) {
      var address = config[networkName];
      promises.push(new Promise(function(resolve, reject) {
        liveAddress(address, function(err, isLive) {
          if (err) return reject(err);
          var instance;
          if (isLive) {
            instance = contract.at(address);
            instance.env = networkName;
          }
          resolve(instance);
        });
      }));
    });
    return Promise.all(promises).then(function(possibilities) {
      var instance = possibilities.find(function(instance) {
        return instance;
      });
      callback(null, instance);
    }).catch(function(err) {
      callback(err);
    });
  }

  function findTestRPCInstance(contract, callback) {
    var address = config.reload().testRpcAddress;

    if (!address)
      return callback(Error('Contract address not found for testrpc!'));

    liveAddress(address, function(err, isLive) {
      if (err) return callback(err);
      if (isLive) {
        var instance = contract.at(address);
        instance.env = 'testrpc';
        callback(null, instance);
      } else {
        callback(Error('Contract not found for testrpc!'));
      }
    });
  }

  function parseNetworkConfig() {
    return JSON.parse(config.networksJSONString);
  }

  function liveAddress(address, callback) {
    web3.eth.getCode(address, function(err, contractCode) {
      if (err) return callback(err);
                                  //geth                  //testrpc
      var isLive = contractCode != '0x' && contractCode != '0x0';
      callback(null, isLive);
    });
  }

  function promiseHandler(resolve, reject) {
    return function(err, txHash) {
      if (err) {
        reject(err);
      } else {
        resolve(txHash);
      }
    };
  }

  function txHandler(txHash, successMessage) {
    return new Promise(function(resolve, reject) {
      var interval = setInterval(function() {
        web3.eth.getTransactionReceipt(txHash, function(err, receipt) {
          if (err != null) {
            clearInterval(interval);
            reject(err);
          }
          if (receipt != null) {
            logger.log(successMessage);
            clearInterval(interval);
            resolve();
          }
        });
      }, 500);
    });
  }

  function getLogger(verbose) {
    if (verbose) {
      return console;
    } else {
      var noop = function() {};
      return { log: noop, error: noop };
    }
  }

  function filterEventsBy(libName, callback) {
    var searchString = web3.toHex(libName);

    // TODO: Isn't there a better way to ensure the string is zero-padded?
    // If it's not zero-padded, the topic doesn't work correctly
    while (searchString.length < 66) {
      searchString += "0";
    }

    findContract(function(err, contract) {
      if (err) return callback(err);

      var filter = web3.eth.filter({
        address: contract.address,
        fromBlock: 0,
        topics: [null, searchString]
      });

      filter.get(function(error, results) {
        if (error) return callback(error);
        var abi = liveLibsABI();
        var decodedResults = results.map(function(log) { return decode(log, abi) });
        callback(null, decodedResults);
      });
    });
  }

  function decode(log, abi) {
    var SolidityEvent = require('web3/lib/web3/event');

    var decoders = abi.filter(function (json) {
        return json.type === 'event';
    }).map(function(json) {
        return new SolidityEvent(null, json, null);
    });

    var decoder = decoders.find(function(decoder) {
      return decoder.signature() == log.topics[0].replace("0x","");
    });

    return decoder.decode(log);
  }

  function buildConfig(config) {
    if (!config) config = {};
    if (!LiveLibs.config) return config; // set in ./browser
    for (var attrname in LiveLibs.config) {
      if (config[attrname] == undefined)
        config[attrname] = LiveLibs.config[attrname];
    }
    return config;
  }
}

module.exports = LiveLibs;
