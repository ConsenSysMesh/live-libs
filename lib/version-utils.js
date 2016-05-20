var ethUtils = require('./eth-utils');

function exists(libName, version, contract) {
  var userV = parse(version);
  var found = false;
  contract.getVersions(libName).forEach(function(rawVersion) {
    if (found) return;
    var calcV = calc(rawVersion);
    found = calcV.equals(userV);
  });
  return found;
}

function latest(libName, contract) {
  var rawVersions = contract.getVersions(libName);
  if (rawVersions.length == 0) return;
  var ints = rawVersions.map(function(raw) { return parseInt(raw); });
  var sortedInts = ints.sort(function(a, b) { return a-b; });
  return findLatestUnlockedVersion(sortedInts, libName, contract);
}

function findLatestUnlockedVersion(sortedInts, libName, contract) {
  if (sortedInts.length == 0) return;

  var version = calc(sortedInts.pop());

  // We have to look them up, because the "latest" one could be locked.
  var rawLibData = contract.get(libName, version.num);

  if (ethUtils.blankAddress(rawLibData[0])) {
    return findLatestUnlockedVersion(sortedInts, libName, contract);
  } else {
    // TODO: need a more elegant approach, we're returning version, only to re-call get() with it
    return version;
  }
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
  exists: exists,
  latest: latest,
  calc: calc,
  parse: parse
};
