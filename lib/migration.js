var fs = require('fs');

var VERSION = require('../package.json').version;

var compiler = require('./compiler');
var deployer = require('./deployer');
var versionUtils = require('./version-utils');
var fileUtils = require('./file-utils');

function downloadData(contractInstance, web3) {
  ensureHiddenDirectory();
  var dataToStore = extractRegistryData(contractInstance, web3);
  if (fs.existsSync(fileUtils.dataFilePath))
    fs.unlinkSync(fileUtils.dataFilePath);
  console.log("Writing data");
  fs.writeFileSync(fileUtils.dataFilePath, JSON.stringify(dataToStore));
}

function ensureHiddenDirectory() {
  if (!fs.existsSync(fileUtils.dataDirPath))
    fs.mkdirSync(fileUtils.dataDirPath);
}

function extractRegistryData(contractInstance, web3) {
  var dataToStore = {};
  unique(contractInstance.list()).forEach(function(rawName) {
    var plainName = web3.toAscii(rawName).replace(/\0/g, '');
    contractInstance.getVersions(plainName).forEach(function(rawVersion) {
      var v = versionUtils.calc(rawVersion);
      console.log("Pulling " + plainName + " " + v.string);
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

function unique(names) {
  return Array.from(new Set(names));
}

function deploy(register, web3, environment) {
  web3.eth.defaultAccount = web3.eth.coinbase;

  return deployLiveLibContract(register, web3, environment).then(function() {
    if (!fs.existsSync(fileUtils.dataFilePath))
      return Promise.resolve();
    
    var data = fs.readFileSync(fileUtils.dataFilePath);
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
}

function deployLiveLibContract(register, web3, environment) {
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
        fs.writeFileSync(fileUtils.testRpcAddress, contract.address);
        console.log('Stored contract address.');
      }

      resolve(contract);
    });
  }).then(function(contract) {
    return register('LiveLibs', VERSION, contract.address, JSON.stringify(contract.abi));
  });
}

module.exports = {
  downloadData: downloadData,
  deploy: deploy
};