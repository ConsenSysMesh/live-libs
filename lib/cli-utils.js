function toDateTimeString(time){
  function pad(n){return n<10 ? '0'+n : n;}
  var d = new Date(time*1000);
  return d.getUTCFullYear()+'-'
  + pad(d.getUTCMonth()+1)+'-'
  + pad(d.getUTCDate())+'T'
  + pad(d.getUTCHours())+':'
  + pad(d.getUTCMinutes())+':'
  + pad(d.getUTCSeconds())+'Z';
}

function merge(resources, string) {
  var pair = string.split('=');
  resources[pair[0]] = pair[1];
}

function parseResourceURIs(resourceuriARGV) {
  var resources = {};
  if (resourceuriARGV) {
    if (typeof resourceuri === 'string') {
      merge(resources, resourceuriARGV);
    } else {
      resourceuriARGV.forEach(function(stringPair) {
        merge(resources, stringPair);
      });
    }
  }
  return resources;
}

module.exports = {
  toDateTimeString: toDateTimeString,
  parseResourceURIs: parseResourceURIs
};
