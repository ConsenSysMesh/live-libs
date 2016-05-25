var ethUtils = require('./eth-utils');

function latest(libName, contract, callback) {
  contract.getVersions(libName, function(err, rawVersions) {
    if (err) return callback(err);
    if (rawVersions.length == 0) return callback();

    var ints = rawVersions.map(function(raw) { return parseInt(raw); });
    var sortedInts = ints.sort(function(a, b) { return a-b; });
    findLatestUnlockedVersion(sortedInts, 0, libName, contract, callback)
  });
}

function findLatestUnlockedVersion(sortedInts, index, libName, contract, callback) {
  if (sortedInts.length == 0) return callback();
  if (sortedInts.length == index) return callback();

  var versionNum = sortedInts[index];
  var version = calc(versionNum);

  contract.get(libName, version.num, function(err, rawLibData) {
    if (err) return callback(err);

    if (rawLibData || !ethUtils.blankAddress(rawLibData[0])) {
      // TODO: need a more elegant approach, we're returning version, only to re-call get() with it
      callback(null, version);
    } else {
      findLatestUnlockedVersion(sortedInts, index+1, libName, contract, callback);
    }
  });
}

function calc(versionNum) {
  var major = Math.floor(versionNum / 1000000);
  var minor = Math.floor((versionNum % 1000000) / 1000);
  var patch = versionNum % 1000;
  return new Version(major, minor, patch);
}

function parse(string) {
  var parts = string.split('.');
  return new Version(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
}

function Version(major, minor, patch) {
  this.major = major;
  this.minor = minor;
  this.patch = patch;
  this.string = major+'.'+minor+'.'+patch;
  this.num = 1000000*major + 1000*minor + patch;
  this.equals = function(other) {
    return this.num == other.num;
  }
}

module.exports = {
  latest: latest,
  calc: calc,
  parse: parse
};
