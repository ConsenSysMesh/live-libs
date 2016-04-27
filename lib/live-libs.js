var Web3 = require('web3');
var web3 = new Web3();

module.exports = function liveLibsContract() {
    web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

    // maybe just provide a minimal abi, and then pull the abi from 
    var abi = [{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"data","outputs":[{"name":"a","type":"address"},{"name":"abi","type":"string"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"names","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"name","type":"bytes32"}],"name":"get","outputs":[{"name":"","type":"address"},{"name":"","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"name","type":"bytes32"},{"name":"a","type":"address"},{"name":"abi","type":"string"}],"name":"register","outputs":[],"type":"function"}];
    var contract = web3.eth.contract(abi);
    // testnet
    return contract.at("0xe19a45d3f3b15257234e66a7d4cf0147672bd5d6");
}
