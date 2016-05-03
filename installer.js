var fs = require('fs');

var liveLibs = require('./lib/live-libs');
var generateAbstractLib = require('./lib/live-libs/abstract');

var liveLibsName = process.argv[2];
var targetDir = process.argv[3];
var environment = process.argv[4];
// check that all of these args are here

var libData = liveLibs.contractFor(environment).data(liveLibsName);
// check for missing data

var abi = libData[1];
var source = generateAbstractLib(liveLibsName, abi);

var filePath = targetDir+'/'+liveLibsName+'.sol';
fs.writeFileSync(filePath, source);

console.log('Successfully generated abstract '+liveLibsName+' library at '+filePath);
