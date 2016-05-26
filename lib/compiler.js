var fs = require('fs');

function compile(sourceDir, contractName) {
  var compiledContracts = compileAll(sourceDir);

  var output = {};
  Object.keys(compiledContracts).forEach(function(contractName) {
    var compiled = compiledContracts[contractName];
    var abi = JSON.parse(compiled.interface);
    var code = '0x'+compiled.bytecode;
    output[contractName] = {abi: abi, code: code};
  });

  return output;
}

function compileAll(sourceDir) {
  // Requiring this just-in-time because it's heavy
  var solc = require('solc');
  // TODO: Investigate this https://github.com/chriseth/browser-solidity/issues/167
  process.removeAllListeners("uncaughtException");

  var input = {};
  fs.readdirSync(sourceDir).forEach(function(fileName) {
    if (!fileName.match(/\.sol$/)) return;
    var source = fs.readFileSync(sourceDir+'/'+fileName, 'utf8');
    input[fileName] = source;
  });

  var result = solc.compile({sources: input}, 1);
  if (result.errors) throw(new Error(result.errors));
  return result.contracts;
}

module.exports = { compile: compile };
