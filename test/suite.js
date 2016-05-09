var testHelper = require('./helper');
var assert = require("chai").assert;

testHelper.deployAndRun(function(liveLibs) {
  describe('Registering lib info', function() {
    it('set foo', function(done) {
      var libName = 'foo';
      var address = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826';
      var registerPromise = liveLibs.register(libName, address, '[]');
      registerPromise.then(function() {
        var libInfo = liveLibs.get(libName);
        assert.equal(libInfo.address, address);
      }).then(done).catch(done);
    });
  });
});
