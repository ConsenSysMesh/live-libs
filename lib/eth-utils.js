module.exports = {
  blankAddress: function(address) {
    return address == '0x0000000000000000000000000000000000000000';
  },
  toAscii: function(web3, string) {
    return web3.toAscii(string).replace(/\0/g, '');
  }
};