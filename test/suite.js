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
  });
});
