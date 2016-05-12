var fs = require('fs');

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

// TODO: Incorporate LibFund data
function extractRegistryData(contractInstance, web3) {
  var dataToStore = {};
  unique(contractInstance.allNames()).forEach(function(rawName) {
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

function deploy(register, web3, onTestrpc) {
  web3.eth.defaultAccount = web3.eth.coinbase;

  return deployLiveLibsContracts(web3, onTestrpc).then(function() {
    if (!fs.existsSync(fileUtils.dataFilePath))
      return Promise.resolve();
    
    var data = fs.readFileSync(fileUtils.dataFilePath, 'utf8');
    var jsonData = JSON.parse(data);
    var promises = [];

    Object.keys(jsonData).forEach(function(libName) {
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

function deployLiveLibsContracts(web3, onTestrpc) {
  var output = compiler.compile('./contracts');

  return new Promise(function(resolve, reject) {
    deployer.deploy(web3, 'LiveLibsUtils', output.LiveLibsUtils.abi, output.LiveLibsUtils.code, function(err, contract) {
      if (err) {
        console.log(err);
        return reject(err);
      }

      resolve(contract.address);
    });
  }).then(function(liveLibsUtilsAddress) {

    // Link the bytecodes of LibFund and LiveLibs to the deployed Utils' address
    var binAddress = liveLibsUtilsAddress.replace("0x", "");
    ['LiveLibs', 'LibFund'].forEach(function(libName) {
      var re = new RegExp("__LiveLibsUtils_*", "g");
      output[libName].code = output[libName].code.replace(re, binAddress);
    });

    return Promise.resolve();
  }).then(function() {
    return new Promise(function(resolve, reject) {
      deployer.deploy(web3, 'LibFund', output.LibFund.abi, output.LibFund.code, function(err, contract) {
        if (err) {
          console.log(err);
          return reject(err);
        }

        resolve(contract);
      });
    });
  }).then(function(libFundContract) {
    return new Promise(function(resolve, reject) {
      deployer.deployWithArg(web3, 'LiveLibs', libFundContract.address, output.LiveLibs.abi, output.LiveLibs.code, function(err, contract) {
        if (err) {
          console.log(err);
          return reject(err);
        }

        if (onTestrpc) {
          ensureHiddenDirectory();
          fs.writeFileSync(fileUtils.testRpcAddress, contract.address);
          console.log('Stored contract address.');
        }

        resolve({libFundContract: libFundContract, liveLibsAddress: contract.address});
      });
    });
  }).then(function(data) {
    return new Promise(function(resolve, reject) {
      data.libFundContract.setOwner(
        data.liveLibsAddress,
        {value: 0, gas: 2000000}, // TODO: need to estimate this
        function(err, txHash) {
          if (err) {
            reject(err);
          } else {
            resolve(txHash);
          }
        }
      );
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
            console.log('Set owner of LibFund!');
            resolve();
            clearInterval(interval);
          }
        });
      }, 500);
    });
  });
}

module.exports = {
  downloadData: downloadData,
  deploy: deploy
};