
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://0.0.0.0:8545'));

//TODO: when TestRPC can handle synchronous requests, use this
//var TestRPC = require("ethereumjs-testrpc");
//web3.setProvider(TestRPC.provider());

var LiveLibs = require('../index.js');
var liveLibs = new LiveLibs(web3, 'testrpc');

liveLibs.deploy().then(function() {

  describe('Retrieving lib info', function() {
    it('foo', function() {
      var libName = 'foo';
      var libInfo = liveLibs.get(libName);
    });
  });

  run(); // this is exposed because we're running mocha --delay
  // we are runnning mocha --delay because we have to deploy before we run tests
  // we have to deploy because TestRPC can't handle synchronous requests
}).catch(function(err) {
  console.error('Problem while deploying to testrpc: ' + err);
});
