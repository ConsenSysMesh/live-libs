var liveLibsContract = require('./lib/live-libs');
var generateAbstractLib = require('./lib/live-libs/abstract');

var fs = require('fs');

var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

function parseLiveLibData(source) {
  var libData = {};

  // read lib dependencies from comments in the source
  var matchData = /\/\/\s*live\-libs\:\s*(.*)\s*/.exec(source);

  if (matchData) {
    var liveLibsString = matchData[1];
    var liveLibsNames = liveLibsString.split(/[ ,]+/);

    liveLibsNames.forEach(function(liveLibsName) {
      // grab the addresses and ABIs of lib dependencies
      var data = liveLibsContract().data(liveLibsName);
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
    if (compiled[contractName].code == "0x") return;
    Object.keys(libData).forEach(function(libName) {
      var binAddress = libData[libName].address.replace("0x", "");
      var re = new RegExp("__" + libName + "_*", "g");
      compiled[contractName].code = compiled[contractName].code.replace(re, binAddress);
    });
  });
}

var solFile = process.argv[2];
var source = fs.readFileSync(solFile, 'utf8');

var libData = parseLiveLibData(source);
var abstractLibSource = generateAbstractLibs(libData);

var compiled = web3.eth.compile.solidity(source + abstractLibSource);
linkBytecodeToLibs(compiled, libData);

console.log(compiled);
