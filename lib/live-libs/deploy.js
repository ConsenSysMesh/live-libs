var Web3 = require('web3');
var web3 = new Web3();

module.exports = function(name, abi, code, callback) {
  web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));
  web3.eth.defaultAccount = web3.eth.coinbase;

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
