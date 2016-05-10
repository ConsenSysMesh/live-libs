function latest(contract, libName) {
  var rawVersions = contract.getVersions(libName);
  if (rawVersions.length == 0) return;
  var latestRaw = Math.max.apply(null, rawVersions);
  return calc(latestRaw);
}

function calc(number) {
  var major = Math.floor(number / 1000000);
  var minor = Math.floor((number % 1000000) / 1000);
  var patch = number % 1000;
  return {major: major, minor: minor, patch: patch, string: major+'.'+minor+'.'+patch};
}

function parse(string) {
  var parts = string.split('.');
  return {major: parts[0], minor: parts[1], patch: parts[2], string: string};
}

module.exports = {
  latest: latest,
  calc: calc,
  parse: parse
};
