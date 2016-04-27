var liveLibsContract = require('./lib/live-libs');

var fs = require('fs');

function parseLiveLibData(source) {
  var libData = {};

  // read lib dependencies from comments in the source
  var matchData = /\/\/\s*live\-libs\:\s*(.*)\s*/.exec(source);

  if (matchData) {
    var liveLibsString = matchData[1];
    var liveLibsNames = liveLibsString.split(/[ ,]+/);

    liveLibsNames.forEach(function(liveLibsName) {
      // grab the addresses and ABIs of lib dependencies
      var data = liveLibsContract().data(liveLibsName);
      var address = data[0];
      var abi = data[1];
      if (address == '0x0000000000000000000000000000000000000000') {
        console.error('There is no live-lib registered as "'+liveLibsName+'"');
        process.exit(1);
      }
      libData[liveLibsName] = {address: address, abi: abi};
    });
  }
  return libData;
}

var solFile = process.argv[2];
var source = fs.readFileSync(solFile, 'utf8');

var libData = parseLiveLibData(source);
console.log(libData);
// generate abstract libs from ABIs
// compile the source code
// link the binaries