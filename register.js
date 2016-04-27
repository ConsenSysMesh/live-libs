var liveLibsContract = require('./lib/live-libs');

var fs = require('fs');

var Web3 = require('web3');
var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));
web3.eth.defaultAccount = web3.eth.coinbase;

var sourcePath = process.argv[2];
var contractName = process.argv[3];
var liveLibsName = process.argv[4];

console.log("Registering "+contractName+" as "+liveLibsName+" from "+sourcePath+"...");

var source = fs.readFileSync(sourcePath, 'utf8');
var compiled = web3.eth.compile.solidity(source);
var code = compiled[contractName].code;
var abi = compiled[contractName].info.abiDefinition;

var contract = web3.eth.contract(abi);

var contractData = contract.new.getData({data: code});
var gasEstimate = web3.eth.estimateGas({data: contractData});

contract.new({data: code, gas: gasEstimate}, function (err, contract) {
    if (err) {
        console.error(err);
        return;
    } else if(contract.address){
        console.log(liveLibsName+' abi: \n' + JSON.stringify(contract.abi));
        console.log(liveLibsName+' address: \n' + contract.address);

        registerMyself(liveLibsName, contract);
    } else {
        console.log(contractName+' transmitted, waiting for mining...');
    }
});

function registerMyself(liveLibsName, contract) {
    var txHash = liveLibsContract().register(liveLibsName, contract.address, JSON.stringify(contract.abi), {value: 0, gas: 1000000});

    setInterval(function() {
      console.log('Waiting for '+liveLibsName+' to be registered...');

      web3.eth.getTransactionReceipt(txHash, function(err, result) {
        if (err) {
          console.log(err);
          process.exit();
        }

        if (result) {
          console.log(result);
          process.exit();
        }
      });

    }, 2000);
}
