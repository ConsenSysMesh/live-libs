var fs = require('fs');

var solc = require('solc');
var Web3 = require('web3');
var web3 = new Web3();

var liveLibs = require('./lib/live-libs');
var deploy = require('./lib/live-libs/deploy');

var environment = process.argv[2];

web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));
web3.eth.defaultAccount = web3.eth.coinbase;

var source = fs.readFileSync('./contracts.sol', 'utf8');
var output = liveLibs.compile(source, 'LiveLibs');

deploy('LiveLibs', output.abi, output.code, registerMyself);

function registerMyself(contractName, contract) {
    if (environment == 'testrpc') {
      console.log('Caching contract at '+contract.address);
      fs.writeFileSync(liveLibs.testRpcAddressCache, contract.address);
    }

    var txHash = contract.register(contractName, contract.address, JSON.stringify(contract.abi), {value: 0, gas: 1000000});

    var interval = setInterval(function() {
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
          clearInterval(interval);
        }
      });

    }, 2000);
}