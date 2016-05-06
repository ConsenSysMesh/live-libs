#!/usr/bin/env node

var argv = require('yargs').option('address', {type: 'string'}).argv;
var env = argv.e || argv.env;

// TODO: how to handle this via yargs?
if (!env) {
  console.log("You must specify an enviroment with -e or --env");
  process.exit(1);
}

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

if (cmd == "register") {
  var libName = argv._[1];
  liveLibs.register(libName, argv.address, argv.abi);
}

if (cmd == "download") {
  liveLibs.downloadData();
}

if (cmd == "deploy" && env == "testrpc") {
  liveLibs.deployTestRPC();
}

// TODO: Handle case where cmd matches nothing