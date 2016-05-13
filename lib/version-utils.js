var ethUtils = require('./eth-utils');

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
  var rawLibData = contract.get(libName, version.major, version.minor, version.patch);

  if (ethUtils.blankAddress(rawLibData[0])) {
    return findLatestUnlockedVersion(sortedInts, libName, contract);
  } else {
    // TODO: need a more elegant approach, we're returning version, only to re-call get() with it
    return version;
  }
}

function calc(number) {
  var major = Math.floor(number / 1000000);
  var minor = Math.floor((number % 1000000) / 1000);
  var patch = number % 1000;
  return {major: major, minor: minor, patch: patch, string: major+'.'+minor+'.'+patch};
}

function parse(string) {
  var parts = string.split('.');
  return {major: parseInt(parts[0]), minor: parseInt(parts[1]), patch: parseInt(parts[2]), string: string};
}

module.exports = {
  latest: latest,
  calc: calc,
  parse: parse
};
