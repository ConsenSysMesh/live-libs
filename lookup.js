var liveLibsContract = require('./lib/live-libs');

var liveLibsName = process.argv[2];

console.log(liveLibsName+' address,abi:');
console.log(liveLibsContract().data(liveLibsName));
