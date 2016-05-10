var fs = require('fs');

var generateAbstractLib = require('./lib/generate');
var migration = require('./lib/migration');
var versionUtils = require('./lib/version-utils');
var fileUtils = require('./lib/file-utils');

function LiveLibs(web3) {

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
      abstractSource: function() { return generateAbstractLib(libName, rawLibData[1]); }
    };
  };

  this.register = function(libName, version, address, abiString) {
    web3.eth.defaultAccount = web3.eth.coinbase;

    return new Promise(function(resolve, reject) {
      var parsedVersion;
      if (version) {
        parsedVersion = versionUtils.parse(version);
      } else {
        reject('No version specified for '+libName);
      }

      findContract().register(
        libName,
        parsedVersion.major,
        parsedVersion.minor,
        parsedVersion.patch,
        address,
        abiString,
        {value: 0, gas: 2000000}, // TODO: need to estimate this
        function(err, txHash) {
        if (err) {
          reject(err);
        } else {
          resolve(txHash);
        }
      });
    }).then(function(txHash) {
      return new Promise(function(resolve, reject) {
        var interval = setInterval(function() {
          web3.eth.getTransactionReceipt(txHash, function(err, receipt) {
            if (err != null) {
              clearInterval(interval);
              reject(err);
            }
            if (receipt != null) {
              console.log('Registered '+libName+' '+version+'!');
              resolve();
              clearInterval(interval);
            }
          });
        }, 500);
      });
    });
  };

  this.downloadData = function() {
    migration.downloadData(findContract(), web3);
  };

  this.deploy = function(onTestrpc) {
    return migration.deploy(this.register, web3, onTestrpc);
  };

  function findContract() {
    if (_contract) return _contract;

    // TODO: maybe just provide a minimal abi, and then pull the abi from the network? (if it registers itself)
    var abi = [{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"}],"name":"versionMap","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"list","outputs":[{"name":"","type":"bytes32[]"}],"type":"function"},{"constant":false,"inputs":[{"name":"name","type":"bytes32"},{"name":"major","type":"uint8"},{"name":"minor","type":"uint8"},{"name":"patch","type":"uint8"},{"name":"a","type":"address"},{"name":"abi","type":"string"}],"name":"register","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"names","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint8"},{"name":"","type":"uint8"},{"name":"","type":"uint8"}],"name":"versions","outputs":[{"name":"a","type":"address"},{"name":"abi","type":"string"},{"name":"sender","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"name","type":"bytes32"}],"name":"getVersions","outputs":[{"name":"","type":"uint256[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"name","type":"bytes32"},{"name":"major","type":"uint8"},{"name":"minor","type":"uint8"},{"name":"patch","type":"uint8"}],"name":"get","outputs":[{"name":"","type":"address"},{"name":"","type":"string"}],"type":"function"}];
    var contract = web3.eth.contract(abi);

    var instance;

    var config = parseNetworkConfig();
    Object.keys(config).forEach(function(networkName) {
      var address = config[networkName];
      if (liveAddress(address)) {
        instance = contract.at(address);
        instance.env = networkName;
      }
    });

    if (!instance) {
      var address;
      if (fs.existsSync(fileUtils.testRpcAddress))
        address = fs.readFileSync(fileUtils.testRpcAddress, 'utf8');
      if (!address)
        return console.error('Contract address not found for testrpc!');
      instance = contract.at(address);
      if (!liveAddress(address))
        return console.error('Contract not found for testrpc!');
      instance.env = 'testrpc';
    }

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
}
module.exports = LiveLibs;