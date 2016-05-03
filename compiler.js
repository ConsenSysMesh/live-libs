var fs = require('fs');

var liveLibs = require('./lib/live-libs');

var solFile = process.argv[2];
var environment = process.argv[3];

var source = fs.readFileSync(solFile, 'utf8');
var compiled = liveLibs.compileAndLink(source, environment);
console.log(compiled);
