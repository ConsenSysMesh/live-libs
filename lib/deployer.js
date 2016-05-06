function deploy(web3, name, abi, code, callback) {
  var contract = web3.eth.contract(abi);
  var contractData = contract.getData({data: code});
  var gasEstimate = web3.eth.estimateGas({data: contractData});

  contract.new({data: code, gas: gasEstimate}, function (err, contract) {
    if (err) {
      console.error('While attempting to deploy '+name+': '+err);
      return;
    } else if(contract.address) {
      console.log(name+' address: '+contract.address);
      callback(name, contract);
    } else {
      console.log(name+' transmitted, waiting for mining...');
    }
  });
}

function deployLibCode(web3, libName, contractInfo, callback) {
  var contract = web3.eth.contract(contractInfo.abi);
  //via @chriseth: https://gitter.im/ethereum/solidity?at=57278b37944fc7ba04cc53a3
  var constructorByteCode = "606060405260138038038082600039806000f3";
  var code = '0x' + constructorByteCode + contractInfo.code.replace(/^0x/, '');

  // TODO: don't deploy LiveLibs contract if it's already out there, just register it?
  deploy(web3, libName, contractInfo.abi, code, callback);
}

module.exports = {
  deploy: deploy,
  deployLibCode: deployLibCode
};
