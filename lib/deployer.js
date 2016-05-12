function deploy(web3, name, abi, code, callback) {
  var d = deploySetup(web3, abi, code);

  // TODO: figure out a better gasEstimate
  d.contract.new({data: code, gas: d.gasEstimate*2}, deployCallback(name, callback));
}

// TODO: need to figure out how to DRY this up more elegantly
function deployWithArg(web3, name, arg, abi, code, callback) {
  var d = deploySetup(web3, abi, code);
  d.contract.new(arg, {data: code, gas: d.gasEstimate*2}, deployCallback(name, callback));
}

function deploySetup(web3, abi, code) {
  var contract = web3.eth.contract(abi);
  var contractData = contract.getData({data: code});
  var gasEstimate = web3.eth.estimateGas({data: contractData});
  return { contract: contract, gasEstimate: gasEstimate };
}

function deployCallback(name, callback) {
  return function(err, contract) {
    if (err) {
      console.error('While attempting to deploy '+name+': '+err);
      callback(err, null);
    } else if(contract.address) {
      console.log(name+' address: '+contract.address);
      callback(null, contract);
    } else {
      console.log(name+' transmitted, waiting for mining...');
    }
  };
}

function deployLibCode(web3, libName, contractInfo, callback) {
  var contract = web3.eth.contract(contractInfo.abi);
  //via @chriseth: https://gitter.im/ethereum/solidity?at=57278b37944fc7ba04cc53a3
  var constructorByteCode = "606060405260138038038082600039806000f3";
  var code = '0x' + constructorByteCode + contractInfo.code.replace(/^0x/, '');

  deploy(web3, libName, contractInfo.abi, code, callback);
}

module.exports = {
  deploy: deploy,
  deployWithArg: deployWithArg,
  deployLibCode: deployLibCode
};
