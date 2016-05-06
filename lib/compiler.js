function compile(source, contractName) {
  var output = compileAll(source)[contractName];
  var abi = JSON.parse(output.interface);
  var code = '0x'+output.bytecode;
  return {abi: abi, code: code};
}

function compileAll(source) {
  // Requiring this just-in-time because it's heavy
  var solc = require('solc');
  // see: https://github.com/chriseth/browser-solidity/issues/167
  process.removeAllListeners("uncaughtException");
  return solc.compile(source, 1).contracts;
}

// TODO: This is currently unused. Determine whether we want to provide this function.
function compileAndLink(source, environment) {
  var parseData = parseLibNames(source);
  var libData = queryLibData(parseData.libNames, environment);
  var abstractLibSource = generateAbstractLibs(libData);
  var compiled = compileAll(parseData.source + abstractLibSource);
  linkBytecodeToLibs(compiled, libData);
  return compiled;
}


function parseLibNames(source) {
  var libNames = [];

  var findImports = /(import ["']([^"']+)\.live["'];)/g;
  var processed = source.replace(findImports, function(match, importString, libName) {
    libNames.push(libName);
    return ''; // strip them out
  });

  return {source: processed, libNames: libNames};
}

function queryLibData(liveLibsNames, environment) {
  var libData = {};
  liveLibsNames.forEach(function(liveLibsName) {
    // grab the addresses and ABIs of lib dependencies
    var data = contractFor(environment).data(liveLibsName);
    var address = data[0];
    var abi = data[1];
    if (address == '0x0000000000000000000000000000000000000000') {
      throw(Error('There is no live-lib registered as "'+liveLibsName+'"'));
    }
    libData[liveLibsName] = {address: address, abi: abi};
  });
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

module.exports = { compile: compile };