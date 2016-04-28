module.exports = function(libName, abiString) {
  var abi = JSON.parse(abiString);
  var libSource = 'library '+libName+' { ';
  abi.forEach(function(func) {
    if (func.type != 'function') return
    var inputs = [];
    func.inputs.forEach(function(input) {
      inputs.push(input.type+' '+input.name);
    });

    // TODO: force constant?
    var constant = '';
    if (func.constant) constant = ' constant';

    var returns = '';
    if (func.outputs.length > 0) {
      var outputs = [];
      func.outputs.forEach(function(output) {
        outputs.push(output.type+' '+output.name);
      });
      returns = ' returns ('+outputs.join(',')+')';
    }
    libSource += 'function '+func.name+'('+inputs.join(',')+')'+constant+returns+';';
  });
  return libSource + ' }';
}
