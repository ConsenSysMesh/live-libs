#!/usr/bin/env node

var argv = require('yargs').argv;
var env = argv.e || argv.env;

var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

var LiveLibs = require('./lib/live-libs');
var liveLibs = new LiveLibs(web3, env);

var cmd = argv._[0];

if (cmd == "get") {
  var libName = argv._[1];
  var libData = liveLibs.get(libName);

  console.log(libName+' address:');
  console.log(libData.address);
  console.log(libName+' ABI:');
  console.log(libData.abi);
}

if (cmd == "gen") {
  var libName = argv._[1];
  var source = liveLibs.gen(libName);

  console.log(libName+' abstract interface:');
  console.log(source);
}
