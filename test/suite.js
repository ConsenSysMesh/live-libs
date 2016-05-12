var testHelper = require('./helper');
var assert = require("chai").assert;

testHelper.deployAndRun(function(liveLibs) {
  describe('Registry', function() {
    var fakeAddress = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826';

    it('gracefully handles a get miss', function() {
      var libName = 'baz';
      var libInfo = liveLibs.get(libName);
      assert.equal(libInfo, undefined);
    });

    it('gets what it sets', function(done) {
      var libName = 'foo';
      liveLibs.register(libName, '0.1.2', fakeAddress, '[]').then(function() {

        var libInfo = liveLibs.get(libName);
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.version, '0.1.2');

      }).then(done).catch(done);
    });

    it('locks unfunded libraries', function(done) {
      var libName = 'abc';
      liveLibs.register(libName, '0.1.2', fakeAddress, '[]', 1000).then(function() {

        var libInfo = liveLibs.get(libName);
        assert.equal(libInfo, undefined);

      }).then(done).catch(done);
    });

    it('unlocks funded libraries', function(done) {
      var doneOverride = function() {done();};

      var libName = 'xyz';
      liveLibs.register(libName, '0.1.2', fakeAddress, '[]', 1000).then(function() {
        return liveLibs.contributeTo(libName, '0.1.2', 1000);
      }).then(function() {

        var libInfo = liveLibs.get(libName);
        assert.isDefined(libInfo);
        assert.equal(libInfo.address, fakeAddress);
        assert.equal(libInfo.version, '0.1.2');

      }).then(doneOverride).catch(doneOverride);
    });

    it('detects when name is too long', function(done) {
      var longName = 'abcdefghijklmnopqrstuvwxyz1234567';

      var detectedError;

      liveLibs.register(longName, '0.1.2', fakeAddress, '[]').catch(function(error) {
        assert.isDefined(error, 'should have detected name was too long');
      }).then(done).catch(done);
    });

    it('gets specific versions', function(done) {
      var libName = 'bar';
      liveLibs.register(libName, '0.1.3', fakeAddress, '[]').then(function() {
        return liveLibs.register(libName, '0.1.2', fakeAddress, '[]')
      }).then(function() {

        var libInfo = liveLibs.get(libName, '0.1.2');
        assert.equal(libInfo.version, '0.1.2');

        libInfo = liveLibs.get(libName, '0.1.3');
        assert.equal(libInfo.version, '0.1.3');

      }).then(done).catch(done);
    });
  });
});
