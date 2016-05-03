var Web3 = require('web3');
var web3 = new Web3();

var liveLibs = require('./lib/live-libs');

var environment = process.argv[2];

console.log('All the '+environment+' live libs (in order of registration):');
liveLibs.contractFor(environment).list().forEach(function(name) {
  console.log(web3.toAscii(name));
});
