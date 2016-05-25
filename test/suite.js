var Web3 = require('web3');
var web3 = new Web3();

var TestRPC = require('ethereumjs-testrpc');
web3.setProvider(TestRPC.provider());

var fileUtils = require('../lib/file-utils');
var LiveLibs = require('../index.js');
var liveLibs; // we need to define this after deployment

var migration = require('../lib/migration');

var assert = require('chai').assert;

describe('Live Libs', function() {

  before(function(done) {
    setAccount().then(function() {
      return migration.deploy(web3, true); // TODO: maybe silence these logs?
    }).then(function() {
      liveLibs = new LiveLibs(web3, fileUtils.config({testing:true}));
    }).then(done).catch(done);
  });

  var fakeAddress = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826';
  var fakeAbi = '[]';

  it('gracefully handles a get miss', function() {
    return liveLibs.get('baz').then(function() {
      assert.fail('Should have rejected missing libName');
    }).catch(function(e) {
      assert.equal(e, 'No versions of baz found');
    });
  });

  it('gets what it sets', function() {
    var libName = 'foo';
    var fakeDocs = 'http://example.com/docs';
    return liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi, fakeDocs, '', 0).then(function() {

      return liveLibs.get(libName).then(function(libInfo) {
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.version, '0.1.2');
        assert.equal(libInfo.abi, fakeAbi);
        assert.equal(libInfo.docURL, fakeDocs);
        assert.equal(libInfo.thresholdWei, 0);
        assert.equal(libInfo.totalValue, 0);
      });

    });
  });

  it('locks unfunded libraries', function() {
    var libName = 'abc';
    return liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi, '', '', 1000).then(function() {

      return liveLibs.get(libName).then(function() {
        assert.fail('Should have rejected locked libName');
      }).catch(function(e) {
        assert.equal(e, 'abc 0.1.2 is locked');
      });

    });
  });

  it('unlocks funded libraries', function() {

    var libName = 'xyz';
    var version = '30.1.2';
    return liveLibs.register(libName, version, fakeAddress, fakeAbi, '', '', 1000).then(function() {
      return liveLibs.contributeTo(libName, version, 250);
    }).then(function() {
      return liveLibs.contributeTo(libName, version, 750);
    }).then(function() {
      return liveLibs.get(libName).then(function(libInfo) {
        assert.isDefined(libInfo);
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.totalValue, 1000);
      });
    });
  });

  it('detects when name is too long', function() {
    // names can only be 32 bytes
    var longName  = 'abcdefghijklmnopqrstuvwxyz1234567';
    var truncName = 'abcdefghijklmnopqrstuvwxyz123456';

    return liveLibs.register(longName, '0.1.2', fakeAddress, fakeAbi).catch(function(error) {
      assert.isDefined(error, 'should have detected name was too long');
      liveLibs.allNames(function(err, allNames) {
        assert.isNull(err);
        assert.notInclude(allNames, truncName);
      });
    });
  });

  it('gets specific versions', function() {
    var libName = 'bar';
    return liveLibs.register(libName, '0.1.3', fakeAddress, fakeAbi).then(function() {
      return liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi);
    }).then(function() {

      return liveLibs.get(libName, '0.1.2').then(function(libInfo) {
        assert.equal(libInfo.version, '0.1.2');
      });

    }).then(function() {

      return liveLibs.get(libName, '0.1.3').then(function(libInfo) {
        assert.equal(libInfo.version, '0.1.3');
      });

    });
  });
});

function setAccount() {
  return new Promise(function(resolve, reject) {
    web3.eth.getCoinbase(function(err, coinbase) {
      if (err) {
        reject(err);
      } else {
        web3.eth.defaultAccount = coinbase;
        resolve();
      }
    });
  });
}
