#!/usr/bin/env node

var argv = require('yargs').option('address', {type: 'string'}).argv;

var Web3 = require('web3');
var web3 = new Web3();

var rpcURL = argv.rpcurl || 'http://0.0.0.0:8545';
web3.setProvider(new web3.providers.HttpProvider(rpcURL));

var LiveLibs = require('./index');
var liveLibs = new LiveLibs(web3, true);

var cmd = argv._[0];
var libName = argv._[1];
var version = argv.v || argv.version;

function toDateTimeString(time) {
  var date = new Date(time*1000);
  var y = date.getUTCFullYear();
  var m = date.getUTCMonth();
  var d = date.getUTCDate();
  var h = date.getUTCHours();
  var m = date.getUTCMinutes();
  var s = date.getUTCSeconds();
  return y+'-'+m+'-'+d+' '+h+':'+m+':'+s+' UTC';
}

if (cmd == "get") {
  try {
    var libInfo = liveLibs.get(libName, version);
  } catch (err) {
    console.error(err.toString());
    return;
  }

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
}

if (cmd == "log") {
  liveLibs.log(libName).then(function(logs) {
    console.log('Event log for '+libName+'...');
    logs.forEach(function(log) {
      var message = toDateTimeString(log.time)+' '+log.type+'! ';
      if (log.type == 'NewLib') {
        message += 'Registered by owner: '+log.args.owner;
      } else if (log.type == 'NewVersion') {
        message += log.args.major.toString()+'.'+log.args.minor.toString()+'.'+log.args.patch.toString();
        if (log.args.thresholdWei > 0) {
          message += ', threshold: '+log.args.thresholdWei.toString();
        }
      } else {
        message += ' not yet implemented.'
      }
      console.log(message);
    });
  }).catch(function(err) {
    console.error(err);
  });
}

if (cmd == "register") {
  console.log('Attempting to register '+libName+', please wait for mining.');
  liveLibs.register(libName, argv.version, argv.address, argv.abi, argv.unlockat).catch(function(err) {
    console.log(err);
  });
}

if (cmd == "contribute") {
  console.log('Attempting to contribute to '+libName+', please wait for mining.');
  liveLibs.contributeTo(libName, version, argv.wei).catch(function(err) {
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
// TODO: Handle case where extra/ignored stuff is passed in (such as when a flag is forgotten)
