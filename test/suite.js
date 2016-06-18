var Web3 = require('web3');
var web3 = new Web3();

var TestRPC = require('ethereumjs-testrpc');
var fileUtils = require('../lib/file-utils');
var LiveLibs = require('../index.js');
var liveLibs; // we need to define this after deployment

var migration = require('../lib/migration');

var assert = require('chai').assert;

var accountConfig = [
  {balance: 20000000},
  {balance: 20000000}
];
web3.setProvider(TestRPC.provider({accounts: accountConfig}));

var accounts;

describe('Live Libs', function() {
  before(function(done) {
    setAccounts().then(function() {
      return migration.deploy(web3, true); // TODO: maybe silence these logs?
    }).then(function() {
      liveLibs = new LiveLibs(web3, fileUtils.config({testing:true}));
    }).then(done).catch(done);
  });

  var fakeAddress = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826';
  var fakeAbi = '[]';

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
    return liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi, {docs: fakeDocs}, 0).then(function() {

      return liveLibs.get(libName).then(function(libInfo) {
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.version, '0.1.2');
        assert.equal(libInfo.abi, fakeAbi);
        assert.equal(libInfo.resources.docs, fakeDocs);
        assert.equal(libInfo.thresholdWei, 0);
        assert.equal(libInfo.totalValue, 0);
      });

    });
  });

  it('gets specific and latest versions', function() {
    var libName = 'bar';
    return liveLibs.register(libName, '0.1.3', fakeAddress, fakeAbi).then(function() {
      return liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi);
    }).then(function() {
      return liveLibs.get(libName, '0.1.2').then(function(libInfo) {
        assert.equal(libInfo.version, '0.1.2');
      });
    }).then(function() {
      return liveLibs.get(libName).then(function(libInfo) {
        assert.equal(libInfo.version, '0.1.3');
      });
    });
  });

  it('does not allow version data to change', function() {
    var libName = 'dhh';
    var updatedAbi = '[foo]';
    return liveLibs.register(libName, '7.7.7', fakeAddress, fakeAbi).then(function() {
      return liveLibs.register(libName, '7.7.7', fakeAddress, updatedAbi);
    }).then(function() {
      return liveLibs.get(libName, '7.7.7').then(function(libInfo) {
        assert.equal(libInfo.abi, fakeAbi);
      });
    });
  });

  it('locks unfunded libraries', function() {
    var libName = 'abc';
    return liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi, {}, 1000).then(function() {
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
    var startingBalance;
    web3.eth.defaultAccount = accounts[1];

    return liveLibs.register(libName, version, fakeAddress, fakeAbi, {}, 1000).then(function() {
      return getBalanceFor(accounts[1]);
    }).then(function(balance) {
      startingBalance = balance;
      web3.eth.defaultAccount = accounts[0];
      return liveLibs.contributeTo(libName, version, 250);
    }).then(function() {
      return liveLibs.contributeTo(libName, version, 750);
    }).then(function() {
      return liveLibs.get(libName).then(function(libInfo) {
        assert.isDefined(libInfo);
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.totalValue, 1000);
      });
    }).then(function() {
      return getBalanceFor(accounts[1]);
    }).then(function(balance) {
      assert.equal(balance - startingBalance, 1000);
    });
  });
});

function setAccounts() {
  return new Promise(function(resolve, reject) {
    web3.eth.getAccounts(function(err, _accounts) {
      if (err) {
        reject(err);
      } else {
        accounts = _accounts;
        web3.eth.defaultAccount = accounts[0];
        resolve();
      }
    });
  });
}

function getBalanceFor(account) {
  return new Promise(function(resolve, reject) {
    web3.eth.getBalance(account, function(err, balance) {
      if (err) return reject(err);
      resolve(balance);
    });
  });
}
