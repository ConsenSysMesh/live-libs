var fs = require('fs');
var path = require('path');

var dataDirPath = process.env.HOME+'/.live-libs/';
var testRpcAddressPath = dataDirPath+'testrpc-address.txt';
var dataFilePath = dataDirPath+'download-data.json';

function readSync(fullPath) {
  return fs.readFileSync(fullPath, 'utf8');
}

function testRpcAddressExists() {
  return fs.existsSync(testRpcAddressPath);
}

function getTestRpcAddress() {
  return readSync(testRpcAddressPath);
}

function resolvePath(relativePath) {
  return path.resolve(path.join(__dirname, relativePath));
}

function config(o) {
  o.liveLibsABIString = readSync(resolvePath('../abis/LiveLibs.json'));
  o.libFundABIString = readSync(resolvePath('../abis/LibFund.json'));
  o.networksJSONString = readSync(resolvePath('../networks.json'));

  if (testRpcAddressExists())
    o.testRpcAddress = getTestRpcAddress();

  return o;
}

module.exports = {
  config: config,
  dataDirPath: dataDirPath,
  dataFilePath: dataFilePath,
  testRpcAddressPath: testRpcAddressPath,
};
