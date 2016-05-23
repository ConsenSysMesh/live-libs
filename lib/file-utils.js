var fs = require('fs');

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

module.exports = {
  readSync: readSync,
  dataDirPath: dataDirPath,
  dataFilePath: dataFilePath,
  testRpcAddressPath: testRpcAddressPath,
  testRpcAddressExists: testRpcAddressExists,
  getTestRpcAddress: getTestRpcAddress
};
