var liveLibsContract = require('./lib/live-libs');

var Web3 = require('web3');
var web3 = new Web3();

console.log('All the live libs (in order of registration):');
liveLibsContract().list().forEach(function(name) {
  console.log(web3.toAscii(name));
});
