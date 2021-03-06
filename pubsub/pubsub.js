"use strict";

/**
 * Created by chris on 09/12/2015.
 */

const fs = require('fs');
const jsonspace = require('jsonspace');
var os = require('os');

function getAddresses() {
  var interfaces = os.networkInterfaces();
  var addresses = [];
  for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
      var address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  return addresses;
}

// FIXME: manually requiring modules and passing them to the blackboard is horrible.
// http://stackoverflow.com/questions/34835822/can-a-npm-dependency-require-a-module-from-its-parent-package
const blackboard = new jsonspace.Blackboard(getAddresses()[0], () => new Date().toISOString(), {
  localUnsubscribedOnReplicateDisconnected: require('./lib/rule/localUnsubscribedOnReplicateDisconnected'),
  dnsResponse: require('./lib/rule/dnsResponse'),
  heartbeat: require('./lib/rule/heartbeat'),
  httpDebug: require('./lib/rule/httpDebug'),
  httpStatic: require('./lib/rule/httpStatic'),
  publishedToApn: require('./lib/rule/publishedToApn'),
  publishedToGcm: require('./lib/rule/publishedToGcm'),
  notifiedToApn: require('./lib/rule/notifiedToApn'),
  notifiedToGcm: require('./lib/rule/notifiedToGcm'),
  echo: require('./lib/rule/echo'),
  publish: require('./lib/rule/publish'),
  notify: require('./lib/rule/notify'),
  publishedToSubscribers: require('./lib/rule/publishedToSubscribers'),
  notifiedToSubscribers: require('./lib/rule/notifiedToSubscribers'),
  rawToObj: require('./lib/rule/rawToObj'),
  replicateConnectedToEmail: require('./lib/rule/replicateConnectedToEmail'),
  replicateDisconnectedToEmail: require('./lib/rule/replicateDisconnectedToEmail'),
  replicateErrorToEmail: require('./lib/rule/replicateErrorToEmail'),
  replicationClientConnectedToEmail: require('./lib/rule/replicationClientConnectedToEmail'),
  replicationClientDisconnectedToEmail: require('./lib/rule/replicationClientDisconnectedToEmail'),
  replicationClientErrorToEmail: require('./lib/rule/replicationClientErrorToEmail'),
  requestedPublishedsToRequester: require('./lib/rule/requestedPublishedsToRequester'),
  requestedSubscribersToRequester: require('./lib/rule/requestedSubscribersToRequester'),
  subscribe: require('./lib/rule/subscribe'),
  subscribedToSubscribers: require('./lib/rule/subscribedToSubscribers'),
  unsubscribe: require('./lib/rule/unsubscribe'),
  unsubscribeMe: require('./lib/rule/unsubscribeMe'),
  unwatchAndUnsubscribe: require('./lib/rule/unwatchAndUnsubscribe'),
  unsubscribedOnDisconnect: require('./lib/rule/unsubscribedOnDisconnect'),
  unsubscribedOnDisconnectDelayed: require('./lib/rule/unsubscribedOnDisconnectDelayed'),
  unsubscribedOnWebsocketTimeout: require('./lib/rule/unsubscribedOnWebsocketTimeout'),
  unsubscribedToSubscribers: require('./lib/rule/unsubscribedToSubscribers'),
  unwatch: require('./lib/rule/unwatch'),
  unwatchedOnDisconnect: require('./lib/rule/unwatchedOnDisconnect'),
  updatedExtraToSubscribers: require('./lib/rule/updatedExtraToSubscribers'),
  watch: require('./lib/rule/watch')
});

// read the config
let configRead = false;
const filenames = ['/etc/pubsub.json', './etc/pubsub.json'];
blackboard.put({server_start:{}});
for (const filename of filenames) {
  try {
    const configText = fs.readFileSync(filename);
    blackboard.put({server_start:{config:filename}});
    let config;
    try {
      config = JSON.parse(configText);
    } catch (e) {
      blackboard.put({config_error:{ref:configText}});
    }
    for (const message of config) {
      try {
        blackboard.put(message);
      } catch (e) {
        console.log('e', e);
        blackboard.put({config_error:{ref:message,err:e}});
      }
    }
    configRead = true;
    break;
  } catch (e) {
    // nothing to do, just try the next filename
    blackboard.put({server_start:{config:filename}});
  }
}
if (!configRead) {
  console.error('config not found in any of: ' + filenames);
  process.exit(1);
}



