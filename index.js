var fs = require('fs');

var generateAbstractLib = require('./lib/generate');
var migration = require('./lib/migration');
var versionUtils = require('./lib/version-utils');
var fileUtils = require('./lib/file-utils');

function LiveLibs(web3, environment) {

  function _contract() {
    return contractFor(web3, environment);
  }
  // To provide direct access to the contract
  this._contract = _contract;

  this.get = function(libName, version) {
    var contract = _contract();

    if (version) {
      version = versionUtils.parse(version);
    } else {
      version = versionUtils.latest(contract, libName);
      if (!version) return;
    }

    var rawLibData = contract.get(libName, version.major, version.minor, version.patch);

    if (blankAddress(rawLibData[0])) return;

    return {
      version: version.string,
      address: rawLibData[0],
      abi: rawLibData[1],
      abstractSource: function() { return generateAbstractLib(libName, rawLibData[1]); }
    };
  };

  function register(libName, version, address, abiString) {
    web3.eth.defaultAccount = web3.eth.coinbase;

    return new Promise(function(resolve, reject) {
      var parsedVersion;
      if (version) {
        parsedVersion = versionUtils.parse(version);
      } else {
        reject('No version specified for '+libName);
      }

      _contract().register(
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
              console.log("Registered " + libName + "!");
              resolve();
              clearInterval(interval);
            }
          });
        }, 500);
      });
    });
  };
  // Defined as a named function so that it can be called privately
  this.register = register; 

  this.downloadData = function() {
    migration.downloadData(_contract(), web3);
  }

  this.deploy = function() {
    return migration.deploy(register, web3, environment);
  };

  function contractFor(web3, environment) {
    var config = parseNetworkConfig();
    // TODO: maybe just provide a minimal abi, and then pull the abi from the network? (if it registers itself)
    var abi = [{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"}],"name":"versionMap","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"list","outputs":[{"name":"","type":"bytes32[]"}],"type":"function"},{"constant":false,"inputs":[{"name":"name","type":"bytes32"},{"name":"major","type":"uint8"},{"name":"minor","type":"uint8"},{"name":"patch","type":"uint8"},{"name":"a","type":"address"},{"name":"abi","type":"string"}],"name":"register","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"names","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint8"},{"name":"","type":"uint8"},{"name":"","type":"uint8"}],"name":"versions","outputs":[{"name":"a","type":"address"},{"name":"abi","type":"string"},{"name":"sender","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"name","type":"bytes32"}],"name":"getVersions","outputs":[{"name":"","type":"uint256[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"name","type":"bytes32"},{"name":"major","type":"uint8"},{"name":"minor","type":"uint8"},{"name":"patch","type":"uint8"}],"name":"get","outputs":[{"name":"","type":"address"},{"name":"","type":"string"}],"type":"function"}];
    var contract = web3.eth.contract(abi);
    var instance;
    if (environment == "testrpc") {
      instance = findTestRPC(web3, contract);
      if (!instance) throw(Error('Contract instance not found for testrpc!'));
    } else if (config[environment]) {
      instance = contract.at(config[environment]);
    } else {
      throw(environment + ' is not a recognized Ethereum environment.');
    }
    // TODO: Detect missing contract via web3.eth.getCode
    return instance;
  }

  function findTestRPC(web3, contract) {
    if (fs.existsSync(fileUtils.testRpcAddress)) {
      var address = fs.readFileSync(fileUtils.testRpcAddress, 'utf8');
      var contractCode = web3.eth.getCode(address);
      if (contractCode != '0x0')
        return contract.at(address);
    }
  }

  function parseNetworkConfig() {
    var jsonString = fs.readFileSync('./networks.json');
    return JSON.parse(jsonString);
  }

  function blankAddress(address) {
    return address == '0x0000000000000000000000000000000000000000'
  }
}
module.exports = LiveLibs;