var liveLibs = require('./lib/live-libs');

var liveLibsName = process.argv[2];
var contract = liveLibs.contractFor(process.argv[3]);

console.log(liveLibsName+' address,abi:');
console.log(contract.data(liveLibsName));
