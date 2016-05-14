#!/usr/bin/env node

var argv = require('yargs').option('address', {type: 'string'}).argv;

var Web3 = require('web3');
var web3 = new Web3();

var rpcURL = argv.rpcurl || 'http://0.0.0.0:8545';
web3.setProvider(new web3.providers.HttpProvider(rpcURL));

var LiveLibs = require('./index');
var liveLibs = new LiveLibs(web3, true);

var cmd = argv._[0];

if (cmd == "get") {
  var libName = argv._[1];
  var version = argv.v || argv.version;
  var libInfo = liveLibs.get(libName, version);
  if (libInfo) {
    console.log('Version:');
    console.log(libInfo.version);
    console.log('\nAddress:');
    console.log(libInfo.address);
    console.log('\nABI:');
    console.log(libInfo.abi);
    console.log('\nAbstract source:');
    console.log(libInfo.abstractSource());
    if (libInfo.thresholdWei > 0) {
      console.log('\nUnlocked at (wei):');
      console.log(libInfo.thresholdWei);
    }
    console.log('\nContributions (wei):');
    console.log(libInfo.totalValue);
  } else {
    var vString = '';
    if (version) vString = ' '+version;
    console.log(libName+vString+' is not registered on the '+liveLibs.env+' live-libs instance.');
  }
}

if (cmd == "register") {
  var libName = argv._[1];
  console.log('Attempting to register '+libName+', please wait for mining.');
  liveLibs.register(libName, argv.version, argv.address, argv.abi, argv.unlockat).catch(function(err) {
    console.log(err);
  });
}

if (cmd == "contribute") {
  var libName = argv._[1];
  console.log('Attempting to contribute to '+libName+', please wait for mining.');
  liveLibs.contributeTo(libName, argv.version, argv.wei).catch(function(err) {
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
