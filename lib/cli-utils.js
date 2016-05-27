function libInfoMessage(libInfo) {
  var message = 'Version:\n';
  message += libInfo.version+'\n';
  message += '\nAddress:\n';
  message += libInfo.address+'\n';
  message += '\nABI:\n';
  message += libInfo.abi+'\n';
  message += '\nAbstract source:\n';
  message += libInfo.abstractSource()+'\n';

  var resourceKeys = Object.keys(libInfo.resources);
  if (resourceKeys.length > 0)
    message += '\nResources:\n';
  resourceKeys.forEach(function(key) {
    message += key+': '+libInfo.resources[key]+'\n';
  });

  if (libInfo.thresholdWei > 0) {
    message += '\nUnlocked at (wei):\n';
    message += libInfo.thresholdWei+'\n';
  }
  message += '\nContributions (wei):\n';
  message += libInfo.totalValue+'\n';
  return message;
}

function eventMessage(log) {
  var func = EventMessage[log.type];

  var message;
  if (func) {
    message = func(log);
  } else {
    message = 'not yet implemented.';
  }

  return toDateTimeString(log.time)+' '+log.type+'! '+message;
}

var EventMessage = {
  NewLib: function(log) {
    return 'Registered by owner: '+log.args.owner;
  },
  NewVersion: function(log) {
    var message = log.args.version;
    if (log.args.thresholdWei > 0) {
      message += ', threshold: '+log.args.thresholdWei.toString();
    }
    return message;
  },
  NewResource: function(log) {
    return log.args.version+' has '+log.args.key+': '+log.args.resourceURI;
  }
};

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

function parseResourceURIs(resourceuriARGV) {
  var resources = {};
  if (resourceuriARGV) {
    if (typeof resourceuriARGV === 'string') {
      merge(resources, resourceuriARGV);
    } else {
      resourceuriARGV.forEach(function(stringPair) {
        merge(resources, stringPair);
      });
    }
  }
  return resources;
}

function merge(resources, string) {
  var pair = string.split('=');
  resources[pair[0]] = pair[1];
}

module.exports = {
  libInfoMessage: libInfoMessage,
  eventMessage: eventMessage,
  parseResourceURIs: parseResourceURIs
};
