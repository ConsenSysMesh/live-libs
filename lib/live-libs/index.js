var fs = require('fs');
var solc = require('solc');
var Web3 = require('web3');
var web3 = new Web3();

var generateAbstractLib = require('./abstract');

var testRpcAddressCache = '/tmp/bar.txt';

// public

function contractFor(environment) {
  web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

  // maybe just provide a minimal abi, and then pull the abi from the network? (if it registers itself)
  var abi = [{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"data","outputs":[{"name":"a","type":"address"},{"name":"abi","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"list","outputs":[{"name":"","type":"bytes32[]"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"names","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"name","type":"bytes32"}],"name":"get","outputs":[{"name":"","type":"address"},{"name":"","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"name","type":"bytes32"},{"name":"a","type":"address"},{"name":"abi","type":"string"}],"name":"register","outputs":[],"type":"function"}];
  var contract = web3.eth.contract(abi);
  var instance;
  if (environment == "live") {
    // TODO
    throw('Live Ethereum network is not yet supported');
  } else if (environment == "testnet") { // or /morden/i
    instance = contract.at("0x2a8adffaccdf25c8f8e75a73fc69a700689e5cb4");
  } else if (environment == "testrpc") {
    instance = findTestRPC(contract);
  } else {
    throw(environment + ' is not a recognized environment');
  }
  // TODO: How to detect missing contract? When the contract is missing, it returns the "eth" object...
  return instance;
}

function compile(source, contractName) {
  var output = compileAll(source)[contractName];
  var abi = JSON.parse(output.interface);
  var code = '0x'+output.bytecode;
  return {abi: abi, code: code};
}

function compileAndLink(source, environment) {
  var libData = parseLiveLibData(source, environment);
  var abstractLibSource = generateAbstractLibs(libData);
  var compiled = compileAll(source + abstractLibSource);
  linkBytecodeToLibs(compiled, libData);
  return compiled;
}

// private


function findTestRPC(contract) {
  var instance;

  if (fs.existsSync(testRpcAddressCache)) {
    var address = fs.readFileSync(testRpcAddressCache);
    // TODO: Need to find a way to determine whether there's actually a contract at an address.
    //     : You'd think this approach would work, but it doesn't seem to on testrpc.
    // var contractCode = web3.eth.getCode(address);
    // console.log('debug: '+contractCode);
    // if (contractCode != '0x0')
      instance = contract.at(address);
  }

  if (instance) {
    return instance;
  } else {
    throw('testrpc environment not bootstrapped. Run bootstrapper.');
  }
}

function compileAll(source) {
  return solc.compile(source, 1).contracts;
}

function parseLiveLibData(source, environment) {
  var libData = {};

  // read lib dependencies from comments in the source
  var matchData = /\/\/\s*live\-libs\:\s*(.*)\s*/.exec(source);

  if (matchData) {
    var liveLibsString = matchData[1];
    var liveLibsNames = liveLibsString.split(/[ ,]+/);

    liveLibsNames.forEach(function(liveLibsName) {
      // grab the addresses and ABIs of lib dependencies
      var data = contractFor(environment).data(liveLibsName);
      var address = data[0];
      var abi = data[1];
      if (address == '0x0000000000000000000000000000000000000000') {
        console.error('There is no live-lib registered as "'+liveLibsName+'"');
        process.exit(1);
      }
      libData[liveLibsName] = {address: address, abi: abi};
    });
  }
  return libData;
}

function generateAbstractLibs(libData) {
  var source = "";
  Object.keys(libData).forEach(function(libName) {
    source += generateAbstractLib(libName, libData[libName].abi);
  });
  return source;
}

function linkBytecodeToLibs(compiled, libData) {
  Object.keys(compiled).forEach(function(contractName) {
    if (compiled[contractName].bytecode == "0x") return;
    Object.keys(libData).forEach(function(libName) {
      var binAddress = libData[libName].address.replace("0x", "");
      var re = new RegExp("__" + libName + "_*", "g");
      compiled[contractName].bytecode = compiled[contractName].bytecode.replace(re, binAddress);
    });
  });
}

module.exports = {
  testRpcAddressCache: testRpcAddressCache,
  compile: compile,
  compileAndLink: compileAndLink,
  contractFor: contractFor
};