var fs = require('fs');

var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

var liveLibs = require('./lib/live-libs');
var dataFilePath = '/tmp/foo.json';

function download() {
  var dataToStore = extractRegistryData();
  if (fs.existsSync(dataFilePath))
    fs.unlinkSync(dataFilePath);
  console.log("Writing data");
  fs.writeFileSync(dataFilePath, JSON.stringify(dataToStore));
}

function extractRegistryData() {
  var dataToStore = {};
  liveLibsContract.list().forEach(function(rawName) {
    var plainName = web3.toAscii(rawName).replace(/\0/g, '');
    console.log("Pulling " + plainName);
    var libData = liveLibsContract.data(plainName);
    dataToStore[plainName] = {
      address: libData[0],
      abi: JSON.parse(libData[1]),
      code: web3.eth.getCode(libData[0])
    };
  });
  return dataToStore;
}

function upload() {
  web3.eth.defaultAccount = web3.eth.coinbase;

  var data = fs.readFileSync(dataFilePath);
  var jsonData = JSON.parse(data);
  Object.keys(jsonData).forEach(function(libName) {
    console.log("Deploying "+libName);
    deployLibCode(libName, jsonData[libName]);
  });
}

function deployLibCode(libName, contractInfo) {
  var contract = web3.eth.contract(contractInfo.abi);
  //via @chriseth: https://gitter.im/ethereum/solidity?at=57278b37944fc7ba04cc53a3
  var constructorByteCode = "606060405260138038038082600039806000f3";
  var code = '0x' + constructorByteCode + contractInfo.code.replace(/^0x/, '');

  contract.new({data: code, gas: 2000000}, function (err, contract) {
    if (err) {
      console.error(libName+' error: '+err);
      return;
    } else if(contract.address) {
      console.log(libName+' deployed to '+contract.address);
      registerLib(libName, contract);
    } else {
      console.log(libName+' transmitted, waiting for mining...');
    }
  });  
}

function registerLib(libName, contract) {
  var txHash = liveLibsContract.register(libName, contract.address, JSON.stringify(contract.abi), {value: 0, gas: 1000000});
  var x = setInterval(function() {
    console.log('Waiting for '+libName+' to be registered...');

    web3.eth.getTransactionReceipt(txHash, function(err, result) {
      if (err) {
        console.log(err);
        process.exit();
      }

      if (result) {
        console.log(result);
        clearInterval(x);
      }
    });
  }, 4000);
}

var cmd = process.argv[2];
var environment = process.argv[3];
var liveLibsContract = liveLibs.contractFor(environment);

if (cmd == "down") {
  download();
}

if (cmd == "up") {
  // TODO: bootstrap registry?
  upload();
}
