var fs = require('fs');

var liveLibsContract = require('./lib/live-libs');
var generateAbstractLib = require('./lib/live-libs/abstract');

var liveLibsName = process.argv[2];
var targetDir = process.argv[3];
// check that both of these args are here

var libData = liveLibsContract().data(liveLibsName);
// check for missing data

var abi = libData[1];
var source = generateAbstractLib(liveLibsName, abi);

var filePath = targetDir+'/'+liveLibsName+'.sol';
fs.writeFileSync(filePath, source);

console.log('Successfully generated abstract '+liveLibsName+' library at '+filePath);