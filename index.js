var fs = require('fs');

var generateAbstractLib = require('./lib/generate');
var migration = require('./lib/migration');
var versionUtils = require('./lib/version-utils');
var fileUtils = require('./lib/file-utils');

function LiveLibs(web3, verbose) {
  var logger = getLogger(verbose);

  var _contract = findContract();
  if (_contract) {
    this.env = _contract.env;
  } else {
    this.env = 'testrpc';
  }

  this.get = function(libName, version) {
    if (version) {
      version = versionUtils.parse(version);
    } else {
      version = versionUtils.latest(findContract(), libName);
      if (!version) return;
    }

    var rawLibData = findContract().get(libName, version.major, version.minor, version.patch);

    if (blankAddress(rawLibData[0])) return;

    return {
      version: version.string,
      address: rawLibData[0],
      abi: rawLibData[1],
      thresholdWei: rawLibData[2],
      totalValue: rawLibData[3],
      abstractSource: function() { return generateAbstractLib(libName, rawLibData[1]); }
    };
  };

  this.register = function(libName, version, address, abiString, thresholdWei) {
    web3.eth.defaultAccount = web3.eth.coinbase;

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
        parsedVersion.major,
        parsedVersion.minor,
        parsedVersion.patch,
        address,
        abiString,
        thresholdWei || 0,
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
      return txHandler(txHash, 'Registered '+libName+' '+version+'!');
    });
  };

  this.contributeTo = function(libName, version, wei) {
    var abi = JSON.parse(fs.readFileSync('./abis/LibFund.json', 'utf8'));
    var contract = web3.eth.contract(abi);

    return new Promise(function(resolve, reject) {
      var libFundAddress = findContract().libFund();
      if (!liveAddress(libFundAddress))
        return reject('LibFund instance not found!');

      var instance = contract.at(libFundAddress);
      var v = versionUtils.parse(version);

      instance.addTo(
        libName,
        v.major, v.minor, v.patch,
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
      var plainName = web3.toAscii(rawName).replace(/\0/g, '');
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

  function findContract() {

    // NOTE: before updating this file, download the latest registry from networks
    var abi = JSON.parse(fs.readFileSync('./abis/LiveLibs.json', 'utf8'));
    var contract = web3.eth.contract(abi);

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

    if (fs.existsSync(fileUtils.testRpcAddress))
      address = fs.readFileSync(fileUtils.testRpcAddress, 'utf8');
    if (!address)
      return logger.error('Contract address not found for testrpc!');
    if (!liveAddress(address))
      return logger.error('Contract not found for testrpc!');

    var instance = contract.at(address);
    instance.env = 'testrpc';
    return instance;
  }

  function parseNetworkConfig() {
    var jsonString = fs.readFileSync('./networks.json', 'utf8');
    return JSON.parse(jsonString);
  }

  function liveAddress(address) {
    var contractCode = web3.eth.getCode(address);
    return contractCode != '0x0';
  }

  function blankAddress(address) {
    return address == '0x0000000000000000000000000000000000000000';
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
}

module.exports = LiveLibs;
