var testHelper = require('./helper');
var assert = require("chai").assert;

testHelper.deployAndRun(function(liveLibs) {
  describe('Registry', function() {
    var fakeAddress = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826';
    var fakeAbi = '[]';

    it('gracefully handles a get miss', function() {
      assert.throws(function() { liveLibs.get('baz'); });
    });

    it('gets what it sets', function(done) {
      var libName = 'foo';
      var fakeDocs = 'http://example.com/docs';
      liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi, fakeDocs, '', 0).then(function() {

        var libInfo = liveLibs.get(libName);
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.version, '0.1.2');
        assert.equal(libInfo.abi, fakeAbi);
        assert.equal(libInfo.docURL, fakeDocs);
        assert.equal(libInfo.thresholdWei, 0);
        assert.equal(libInfo.totalValue, 0);

      }).then(done).catch(done);
    });

    it('locks unfunded libraries', function(done) {
      var libName = 'abc';
      liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi, '', '', 1000).then(function() {

        assert.throws(function() { liveLibs.get(libName); });

      }).then(done).catch(done);
    });

    it('unlocks funded libraries', function(done) {

      var libName = 'xyz';
      var version = '30.1.2';
      liveLibs.register(libName, version, fakeAddress, fakeAbi, '', '', 1000).then(function() {
        return liveLibs.contributeTo(libName, version, 250);
      }).then(function() {
        return liveLibs.contributeTo(libName, version, 750);
      }).then(function() {
        var libInfo = liveLibs.get(libName);
        assert.isDefined(libInfo);
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.totalValue, 1000);

      }).then(done).catch(done);
    });

    it('detects when name is too long', function(done) {
      // names can only be 32 bytes
      var longName  = 'abcdefghijklmnopqrstuvwxyz1234567';
      var truncName = 'abcdefghijklmnopqrstuvwxyz123456';

      liveLibs.register(longName, '0.1.2', fakeAddress, fakeAbi).catch(function(error) {
        assert.isDefined(error, 'should have detected name was too long');
        assert.throws(function() { liveLibs.get(truncName); });
        assert.notInclude(liveLibs.allNames(), truncName);
      }).then(done).catch(done);
    });

    it('gets specific versions', function(done) {
      var libName = 'bar';
      liveLibs.register(libName, '0.1.3', fakeAddress, fakeAbi).then(function() {
        return liveLibs.register(libName, '0.1.2', fakeAddress, fakeAbi);
      }).then(function() {

        var libInfo = liveLibs.get(libName, '0.1.2');
        assert.equal(libInfo.version, '0.1.2');

        libInfo = liveLibs.get(libName, '0.1.3');
        assert.equal(libInfo.version, '0.1.3');

      }).then(done).catch(done);
    });
  });
});
