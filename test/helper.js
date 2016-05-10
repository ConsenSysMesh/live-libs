var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

//TODO: when TestRPC can handle synchronous requests, use this
//var TestRPC = require("ethereumjs-testrpc");
//web3.setProvider(TestRPC.provider());

var LiveLibs = require('../index.js');
var liveLibs = new LiveLibs(web3);

function deployToTestRPC() {
  var deploy;

  try {
    deploy = liveLibs.deploy(true);
  } catch(e) {
    console.error('Error while setting up deploy: '+e);
    console.error('Make sure you have testrpc running!')
    process.exit(1);
  }

  return deploy;
}

function deployAndRun(runTests) {
  deployToTestRPC().then(function() {
    runTests(liveLibs);

    run(); // this is exposed because we're running mocha --delay
    // we are runnning mocha --delay because we have to deploy before we run tests
    // we have to deploy because TestRPC can't handle synchronous requests
  }).catch(function(err) {
    console.error('Problem while deploying to testrpc: ' + err);
  });
}

module.exports = {
  deployAndRun: deployAndRun
};