var liveLibsContract = require('./lib/live-libs');
var generateAbstractLib = require('./lib/live-libs/abstract');

var liveLibsName = process.argv[2];

var libData = liveLibsContract().data(liveLibsName);
// check for missing data
var abi = libData[1];
console.log(generateAbstractLib(liveLibsName, abi));
// write lib to file system
// generate config file to store addresses?