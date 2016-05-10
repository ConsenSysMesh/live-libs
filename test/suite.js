var testHelper = require('./helper');
var assert = require("chai").assert;

testHelper.deployAndRun(function(liveLibs) {
  describe('Registry', function() {
    it('gets what it sets', function(done) {
      var libName = 'foo';
      var address = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826';
      liveLibs.register(libName, '0.1.2', address, '[]').then(function() {

        var libInfo = liveLibs.get(libName);
        assert.equal(libInfo.address, address);
        assert.equal(libInfo.version, '0.1.2');

      }).then(done).catch(done);
    });

    it('gets specific versions', function(done) {
      var libName = 'bar';
      var address = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826';
      liveLibs.register(libName, '0.1.3', address, '[]').then(function() {
        return liveLibs.register(libName, '0.1.2', address, '[]')
      }).then(function() {

        var libInfo = liveLibs.get(libName, '0.1.2');
        assert.equal(libInfo.version, '0.1.2');

        libInfo = liveLibs.get(libName, '0.1.3');
        assert.equal(libInfo.version, '0.1.3');

      }).then(done).catch(done);
    });
  });
});
