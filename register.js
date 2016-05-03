var fs = require('fs');

var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));
web3.eth.defaultAccount = web3.eth.coinbase;

var liveLibs = require('./lib/live-libs');
var deploy = require('./lib/live-libs/deploy');

var sourcePath = process.argv[2];
var contractName = process.argv[3];
var environment = process.argv[4];

console.log("Registering "+contractName+" from "+sourcePath+"...");

// TODO: It doesn't seem like this step should require compilation or deployment, just the name, ABI, and address
var source = fs.readFileSync(sourcePath, 'utf8');
var output = liveLibs.compile(source, contractName);

deploy(contractName, output.abi, output.code, registerMyself);

function registerMyself(contractName, contract) {
    var txHash = liveLibs.contractFor(environment).register(contractName, contract.address, JSON.stringify(contract.abi), {value: 0, gas: 1000000});

    setInterval(function() {
      console.log('Waiting for '+contractName+' to be registered...');

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
