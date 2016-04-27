var fs = require('fs');

var Web3 = require('web3');
var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));
web3.eth.defaultAccount = web3.eth.coinbase;

var source = fs.readFileSync('./contracts.sol', 'utf8');

var compiled = web3.eth.compile.solidity(source);
var code = compiled.LiveLibs.code;
var abi = compiled.LiveLibs.info.abiDefinition;

var contract = web3.eth.contract(abi);

var contractData = contract.new.getData({data: code});
var gasEstimate = web3.eth.estimateGas({data: contractData});

web3.eth.contract(abi).new({data: code, gas: gasEstimate}, function (err, contract) {
    if (err) {
        console.error(err);
        return;
    } else if(contract.address){
        console.log('LiveLibs abi: \n' + JSON.stringify(contract.abi));
        console.log('LiveLibs address: \n' + contract.address);

        registerMyself(contract);
    } else {
        console.log('LiveLibs transmitted, waiting for mining...');
    }
});

function registerMyself(contract) {
    var txHash = contract.register("LiveLibs", contract.address, JSON.stringify(contract.abi), {value: 0, gas: 1000000});

    setInterval(function() {
      console.log("Waiting for tx ("+txHash+") to clear...");

      web3.eth.getTransactionReceipt(txHash, function(err, result) {
        if (err) {
          console.log(err);
          process.exit();
        }

        if (result) {
          console.log(result);
          var res = contract.data("live-libs");
          console.log(res.toString());
          process.exit();
        }
      });

    }, 2000);
}