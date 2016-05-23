"use strict";

var path = require('path');

var generateAbstractLib = require('./lib/generate');
var migration = require('./lib/migration');
var versionUtils = require('./lib/version-utils');
var fileUtils = require('./lib/file-utils');
var ethUtils = require('./lib/eth-utils');

function LiveLibs(web3, verbose) {
  var logger = getLogger(verbose);

  var _contract = findContract();
  if (_contract) {
    this.env = _contract.env;
  } else {
    this.env = 'testrpc';
  }

  this.get = function(libName, version) {
    var v;
    if (version) {
      v = versionUtils.parse(version);
    } else {
      v = versionUtils.latest(libName, findContract());
    }

    if (!v) throw(Error('No versions of '+libName+' found'));

    var rawLibData = findContract().get(libName, v.num);

    if (ethUtils.blankAddress(rawLibData[0])) {
      if (version && versionUtils.exists(libName, version, findContract())) {
        // If they went to the trouble of specifying a version, let's see if it's locked
        throw(Error(libName+' is locked'));
      }
      throw(Error(libName+' '+version+' is not registered'));
    }

    return {
      version: v.string,
      address: rawLibData[0],
      abi: rawLibData[1],
      docURL: rawLibData[2],
      sourceURL: rawLibData[3],
      thresholdWei: rawLibData[4].toString(),
      totalValue: rawLibData[5].toString(),
      abstractSource: function() { return generateAbstractLib(libName, rawLibData[1]); }
    };
  };

  this.log = function(libName) {
    return new Promise(function(resolve, reject) {
      filterEventsBy(libName, function(error, results) {
        if (error) return reject(error);
        return resolve(results);
      });
    }).then(function(rawEvents) {
      var events = [];
      rawEvents.forEach(function(raw) {
        delete raw.args.name; // since we're already filtering by name
        var block = web3.eth.getBlock(raw.blockNumber);
        events.push({time: block.timestamp, type: raw.event, args: raw.args});
      });
      return Promise.resolve(events);
    });
  };

  this.register = function(libName, version, address, abiString, docUrl, sourceUrl, thresholdWei) {
    return new Promise(function(resolve, reject) {
      if (!libName || libName.length > 32)
        return reject('Library names must be between 1-32 characters.');

      var parsedVersion;
      if (version) {
        parsedVersion = versionUtils.parse(version);
      } else {
        return reject('No version specified for '+libName);
      }

      findContract().register(
        libName,
        parsedVersion.num,
        address,
        abiString,
        (docUrl || ''),
        (sourceUrl || ''),
        (thresholdWei || 0),
        {value: 0, gas: 2000000}, // TODO: need to estimate this
        function(err, txHash) {
          if (err) {
            reject(err);
          } else {
            resolve(txHash);
          }
        }
      );
    }).then(function(txHash) {
      var message = 'Registered '+libName+' '+version+'!';
      if (thresholdWei > 0)
        message += ' Locked until '+thresholdWei+' wei contributed.';
      return txHandler(txHash, message);
    });
  };

  this.contributeTo = function(libName, version, wei) {
    var abi = JSON.parse(fileUtils.readSync(resolve('./abis/LibFund.json')));
    var contract = web3.eth.contract(abi);

    return new Promise(function(resolve, reject) {
      if (!wei)
        return reject('No wei amount specified');

      var libFundAddress = findContract().libFund();
      if (!liveAddress(libFundAddress))
        return reject('LibFund instance not found!');

      var instance = contract.at(libFundAddress);
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
    }).then(function(txHash) {
      return txHandler(txHash, 'Contributed '+wei+' wei to '+libName+' '+version+'!');
    });
  };

  this.allNames = function() {
    var names = [];
    findContract().allNames().forEach(function(rawName) {
      var plainName = ethUtils.toAscii(web3, rawName);
      names.push(plainName);
    });
    return names;
  };

  this.downloadData = function() {
    migration.downloadData(findContract(), web3);
  };

  this.deploy = function(onTestrpc) {
    return migration.deploy(this.register, web3, onTestrpc);
  };

  function liveLibsABI() {
    // NOTE: before updating this file, download the latest registry from networks
    return JSON.parse(fileUtils.readSync(resolve('./abis/LiveLibs.json')));
  }

  function findContract() {
    var contract = web3.eth.contract(liveLibsABI());
    return detectLiveLibsInstance(contract) || findTestRPCInstance(contract);
  }

  function detectLiveLibsInstance(contract) {
    var instance;
    var config = parseNetworkConfig();
    Object.keys(config).forEach(function(networkName) {
      if (instance) return;

      var address = config[networkName];
      if (liveAddress(address)) {
        instance = contract.at(address);
        instance.env = networkName;
      }
    });
    return instance;
  }

  function findTestRPCInstance(contract) {
    var address;

    if (fileUtils.testRpcAddressExists())
      address = fileUtils.getTestRpcAddress();
    if (!address)
      return logger.error('Contract address not found for testrpc!');
    if (!liveAddress(address))
      return logger.error('Contract not found for testrpc!');

    var instance = contract.at(address);
    instance.env = 'testrpc';
    return instance;
  }

  function parseNetworkConfig() {
    var jsonString = fileUtils.readSync(resolve('./networks.json'));
    return JSON.parse(jsonString);
  }

  function liveAddress(address) {
    var contractCode = web3.eth.getCode(address);
                        //geth                  //testrpc
    return contractCode != '0x' && contractCode != '0x0';
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
    var contract = findContract();

    var searchString = web3.toHex(libName);

    // TODO: Isn't there a better way to ensure the string is zero-padded?
    // If it's not zero-padded, the topic doesn't work correctly
    while (searchString.length < 66) {
      searchString += "0";
    }

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

  function resolve(relativePath) {
    return path.resolve(path.join(__dirname, relativePath));
  }
}

module.exports = LiveLibs;
