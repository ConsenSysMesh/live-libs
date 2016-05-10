var VERSION = require('./package.json').version;

var fs = require('fs');

var compiler = require('./lib/compiler');
var generateAbstractLib = require('./lib/generate');
var deployer = require('./lib/deployer');

var dataDirPath = process.env.HOME+'/.live-libs/';
var dataFilePath = dataDirPath+'download-data.json';
var testRpcAddress = dataDirPath+'testrpc-address.txt';

function LiveLibs(web3, environment) {

  function _contract() {
    return contractFor(web3, environment);
  }
  // To provide direct access to the contract
  this._contract = _contract;

  this.get = function(libName, version) {
    var contract = _contract();

    if (version) {
      version = parseVersion(version);
    } else {
      var rawVersions = contract.getVersions(libName);
      if (rawVersions.length == 0) return;
      var latestRaw = Math.max.apply(null, rawVersions);
      version = calcVersion(latestRaw);
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
        parsedVersion = parseVersion(version);
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
    ensureHiddenDirectory();
    var dataToStore = extractRegistryData(_contract(), web3);
    if (fs.existsSync(dataFilePath))
      fs.unlinkSync(dataFilePath);
    console.log("Writing data");
    fs.writeFileSync(dataFilePath, JSON.stringify(dataToStore));
  }

  this.deploy = function() {
    web3.eth.defaultAccount = web3.eth.coinbase;

    return deployLiveLibContract(web3).then(function() {
      if (!fs.existsSync(dataFilePath))
        return Promise.resolve();
      
      var data = fs.readFileSync(dataFilePath);
      var jsonData = JSON.parse(data);
      var promises = [];

      Object.keys(jsonData).forEach(function(libName) {
        // Skip LiveLibs, since we already deployed and registered it
        if (libName == 'LiveLibs') return;
        console.log("Deploying "+libName);
        promises.push(
          new Promise(function(resolve, reject) {
            deployer.deployLibCode(web3, libName, jsonData[libName], function(error, contract) {
              if (error) {
                console.error('Problem deploying '+libName+': '+error);
                reject(error);
              } else {
                resolve(contract);
              }
            });
          }).then(function(contract) {
            return register(libName, jsonData[libName].version, contract.address, JSON.stringify(jsonData[libName].abi));
          })
        );
      });

      return Promise.all(promises);
    });
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
    if (fs.existsSync(testRpcAddress)) {
      var address = fs.readFileSync(testRpcAddress, 'utf8');
      var contractCode = web3.eth.getCode(address);
      if (contractCode != '0x0')
        return contract.at(address);
    }
  }

  function deployLiveLibContract(web3) {
    var source = fs.readFileSync('./contracts.sol', 'utf8');
    var output = compiler.compile(source, 'LiveLibs');

    return new Promise(function(resolve, reject) {
      deployer.deploy(web3, 'LiveLibs', output.abi, output.code, function(err, contract) {
        if (err) {
          console.log(err);
          reject(err);
        }

        if (environment == "testrpc") {
          ensureHiddenDirectory();
          fs.writeFileSync(testRpcAddress, contract.address);
          console.log('Stored contract address.');
        }

        resolve(contract);
      });
    }).then(function(contract) {
      return register('LiveLibs', VERSION, contract.address, JSON.stringify(contract.abi));
    });
  }

  function extractRegistryData(contractInstance, web3) {
    var dataToStore = {};
    contractInstance.list().forEach(function(rawName) {
      var plainName = web3.toAscii(rawName).replace(/\0/g, '');
      console.log("Pulling " + plainName);
      contractInstance.getVersions(plainName).forEach(function(rawVersion) {
        var v = calcVersion(rawVersion);
        var libData = contractInstance.get(plainName, v.major, v.minor, v.patch);

        dataToStore[plainName] = {
          version: v.string,
          address: libData[0],
          abi: JSON.parse(libData[1]),
          code: web3.eth.getCode(libData[0])
        };
      });
    });
    return dataToStore;
  }

  function calcVersion(number) {
    var major = Math.floor(number / 1000000);
    var minor = Math.floor((number % 1000000) / 1000);
    var patch = number % 1000;
    return {major: major, minor: minor, patch: patch, string: major+'.'+minor+'.'+patch};
  }

  function parseVersion(string) {
    var parts = string.split('.');
    return {major: parts[0], minor: parts[1], patch: parts[2], string: string};
  }

  function ensureHiddenDirectory() {
    if (!fs.existsSync(dataDirPath))
      fs.mkdirSync(dataDirPath);
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