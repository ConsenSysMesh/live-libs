var fs = require('fs');

var compiler = require('./lib/compiler');
var generateAbstractLib = require('./lib/generate');
var deployer = require('./lib/deployer');

var dataFilePath = '/tmp/foo.json';
var testRpcAddressCache = '/tmp/bar.txt';

function LiveLibs(web3, environment) {

  this.get = function(libName) {
    var contractInstance = contractFor(web3, environment);
    var rawLibData = contractInstance.data(libName);
    return {address: rawLibData[0], abi: rawLibData[1]};
  };

  this.gen = function(libName) {
    var libData = this.get(libName);
    return generateAbstractLib(libName, libData.abi);
  };

  function register(libName, address, abiString) {
    web3.eth.defaultAccount = web3.eth.coinbase;

    var contractInstance = contractFor(web3, environment);
    contractInstance.register(libName, address, abiString, {value: 0, gas: 1000000}, function(err, txHash) {
      var interval = setInterval(function() {
        web3.eth.getTransactionReceipt(txHash, function(err, receipt) {
          if (err != null) {
            clearInterval(interval);
            throw(Error(err)); // TODO: test this
          }
          if (receipt != null) {
            console.log("Registered " + libName + "!");
            clearInterval(interval);
          }
        });
      }, 500);
    });
  };
  // Defined as a named function so that it can be called privately
  this.register = register; 

  this.downloadData = function() {
    var contractInstance = contractFor(web3, environment);
    var dataToStore = extractRegistryData(contractInstance, web3);
    if (fs.existsSync(dataFilePath))
      fs.unlinkSync(dataFilePath);
    console.log("Writing data");
    fs.writeFileSync(dataFilePath, JSON.stringify(dataToStore));
  }

  this.deployTestRPC = function() {
    web3.eth.defaultAccount = web3.eth.coinbase;

    // TODO: This swallows exceptions (need promise reject)
    deployLiveLibContract(web3).then(function(contractInstance) {
      var data = fs.readFileSync(dataFilePath);
      var jsonData = JSON.parse(data);
      Object.keys(jsonData).forEach(function(libName) {
        // Skip LiveLibs, since we already deployed and registered it
        if (libName == 'LiveLibs') return;
        console.log("Deploying "+libName);
        // TODO: This swallows exceptions
        deployer.deployLibCode(web3, libName, jsonData[libName], function(_, contract) {
          register(libName, contract.address, JSON.stringify(jsonData[libName].abi));
        });
      });
    });
  };

  function contractFor(web3, environment) {
    // TODO: maybe just provide a minimal abi, and then pull the abi from the network? (if it registers itself)
    var abi = [{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"data","outputs":[{"name":"a","type":"address"},{"name":"abi","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"list","outputs":[{"name":"","type":"bytes32[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"names","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"name","type":"bytes32"}],"name":"get","outputs":[{"name":"","type":"address"},{"name":"","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"name","type":"bytes32"},{"name":"a","type":"address"},{"name":"abi","type":"string"}],"name":"register","outputs":[],"type":"function"}];
    var contract = web3.eth.contract(abi);
    var instance;
    if (environment == "live") {
      // TODO
      throw('Live Ethereum network is not yet supported');
    } else if (environment.match(/morden/i)) {
      instance = contract.at("0x2a8adffaccdf25c8f8e75a73fc69a700689e5cb4");
    } else if (environment == "testrpc") {
      instance = findTestRPC(web3, contract);
      if (!instance) throw(Error('Contract instance not found for testrpc!'));
    } else {
      throw(environment + ' is not a recognized environment');
    }
    // TODO: Detect missing contract via web3.eth.getCode
    return instance;
  }

  function findTestRPC(web3, contract) {
    if (fs.existsSync(testRpcAddressCache)) {
      var address = fs.readFileSync(testRpcAddressCache, 'utf8');
      var contractCode = web3.eth.getCode(address);
      if (contractCode != '0x0')
        return contract.at(address);
    }
  }

  function deployLiveLibContract(web3, resolve, reject) {
    var source = fs.readFileSync('./contracts.sol', 'utf8');
    var output = compiler.compile(source, 'LiveLibs');

    return new Promise(function(resolve, reject) {
      deployer.deploy(web3, 'LiveLibs', output.abi, output.code, function(_, contract) {
        console.log('Caching contract at '+contract.address);
        fs.writeFileSync(testRpcAddressCache, contract.address);
        resolve(contract);
      });
    }).then(function(contract) {
      register('LiveLibs', contract.address, JSON.stringify(contract.abi));      
    });
  }

  function extractRegistryData(contractInstance, web3) {
    var dataToStore = {};
    contractInstance.list().forEach(function(rawName) {
      var plainName = web3.toAscii(rawName).replace(/\0/g, '');
      console.log("Pulling " + plainName);
      var libData = contractInstance.data(plainName);
      dataToStore[plainName] = {
        address: libData[0],
        abi: JSON.parse(libData[1]),
        code: web3.eth.getCode(libData[0])
      };
    });
    return dataToStore;
  }
}
module.exports = LiveLibs;