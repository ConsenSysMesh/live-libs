#!/usr/bin/env node

var argv = require('yargs').option('address', {type: 'string'}).argv;

var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

var LiveLibs = require('./index');
var liveLibs = new LiveLibs(web3);

var cmd = argv._[0];

if (cmd == "get") {
  var libName = argv._[1];
  var version = argv.v || argv.version;
  var libInfo = liveLibs.get(libName, version);
  if (libInfo) {
    console.log('Version:');
    console.log(libInfo.version);
    console.log('Address:');
    console.log(libInfo.address);
    console.log('ABI:');
    console.log(libInfo.abi);
    console.log('Abstract source:');
    console.log(libInfo.abstractSource());
  } else {
    var vString = '';
    if (version) vString = ' '+version;
    console.log(libName+vString+' is not registered on the '+liveLibs.env+' live-libs instance.');
  }
}

if (cmd == "register") {
  var libName = argv._[1];
  liveLibs.register(libName, argv.version, argv.address, argv.abi).catch(function(err) {
    console.log(err);
  });
}

if (cmd == "download") {
  liveLibs.downloadData();
}

var onTestrpc = liveLibs.env == "testrpc";
if (cmd == "deploy" && onTestrpc) {
  liveLibs.deploy(onTestrpc).catch(function(err) {
    console.log(err);
  });
}

// TODO: Handle case where cmd matches nothing
