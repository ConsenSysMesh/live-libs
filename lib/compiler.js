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

module.exports = { compile: compile };