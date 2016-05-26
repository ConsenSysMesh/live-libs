#!/usr/bin/env node

var fs = require('fs');
var argv = require('yargs').option('address', {type: 'string'}).argv;

var Web3 = require('web3');
var web3 = new Web3();

var rpcURL = argv.rpcurl || 'http://0.0.0.0:8545';
web3.setProvider(new web3.providers.HttpProvider(rpcURL));

var migration = require('./lib/migration');
var versionUtils = require('./lib/version-utils');
var fileUtils = require('./lib/file-utils');
var cliUtils = require('./lib/cli-utils');

var LiveLibs = require('./index');

var liveLibs = new LiveLibs(web3, fileUtils.config({verbose:true}));

var cmd = argv._[0];
var libName = argv._[1];
var version = argv.v || argv.version;

if (cmd == "get") {
  liveLibs.get(libName, version).then(function(libInfo) {
    console.log('Version:');
    console.log(libInfo.version);
    console.log('\nAddress:');
    console.log(libInfo.address);
    console.log('\nABI:');
    console.log(libInfo.abi);
    console.log('\nAbstract source:');
    console.log(libInfo.abstractSource());
    if (libInfo.docURL) {
      console.log('\nDocumentation URL:');
      console.log(libInfo.docURL);
    }
    if (libInfo.sourceURL) {
      console.log('\nSource URL:');
      console.log(libInfo.sourceURL);
    }
    if (libInfo.thresholdWei > 0) {
      console.log('\nUnlocked at (wei):');
      console.log(libInfo.thresholdWei);
    }
    console.log('\nContributions (wei):');
    console.log(libInfo.totalValue);
  }).catch(function(err) {
    console.error(err);
  });
}

if (cmd == "log") {
  liveLibs.log(libName).then(function(logs) {
    console.log('Event log for '+libName+'...');
    logs.forEach(function(log) {
      var message = cliUtils.toDateTimeString(log.time)+' '+log.type+'! ';
      if (log.type == 'NewLib') {
        message += 'Registered by owner: '+log.args.owner;
      } else if (log.type == 'NewVersion') {
        message += log.args.version;
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
  web3.eth.defaultAccount = argv.account || web3.eth.coinbase;
  console.log('Attempting to register '+libName+', please wait for mining.');
  var resources = cliUtils.parseResourceURIs(argv.resourceuri);
  liveLibs.register(libName, argv.version, argv.address, argv.abi, resources, argv.unlockat).catch(function(err) {
    console.log(err);
  });
}

if (cmd == "contribute") {
  web3.eth.defaultAccount = argv.account || web3.eth.coinbase;
  console.log('Attempting to contribute to '+libName+', please wait for mining.');
  liveLibs.contributeTo(libName, version, argv.wei).catch(function(err) {
    console.log(err);
  });
}

if (cmd == "env") {
  liveLibs.env(function(err, env) {
    if (err) throw(err);
    console.log(env);
  });
}


if (cmd == "download") {
  liveLibs.findContract(function(err, contract) {
    if (err) return console.error(err);
    migration.downloadData(contract, web3);
  });
}

if (cmd == "deploy") {
  web3.eth.defaultAccount = argv.account || web3.eth.coinbase;
  liveLibs.env(function(err, env) {
    // We either failed to find an instance
    // or we detected our instance
    var onTestrpc = !!err || env == 'testrpc';

    if (onTestrpc) {
      liveLibs.setTesting(); // TODO: Is this really necessary?
      migration.deploy(web3, true).then(function() {
        return migration.registerAll(web3, liveLibs);
      }).catch(function(err) {
        console.log(err);
      });
    } else {
      console.log('Deploy not available for '+env);
    }
  });
}

if (cmd == "build-browser") {
  var inlineConfig = JSON.stringify(fileUtils.config());
  var source = 'var LiveLibs = require("../index.js");\n'+
  'LiveLibs.config = '+inlineConfig+'\n'+
  'module.exports = LiveLibs;\n';
  fs.writeFileSync('./browser/index.js', source);
}

// TODO: Handle case where cmd matches nothing
// TODO: Handle case where extra/ignored stuff is passed in (such as when a flag is forgotten)
