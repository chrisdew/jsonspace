"use strict";

/**
 * Created by chris on 09/12/2015.
 */

const fs = require('fs');
const jsonspace = require('jsonspace');

// FIXME: manually requiring modules and passing them to the blackboard is horrible.
// http://stackoverflow.com/questions/34835822/can-a-npm-dependency-require-a-module-from-its-parent-package
const blackboard = new jsonspace.Blackboard(null, () => new Date().toISOString(), {
  echo: require('./lib/rule/echo'),
  httpStatic: require('./lib/rule/httpStatic'),
  publish: require('./lib/rule/publish'),
  publishedToSubscribers: require('./lib/rule/publishedToSubscribers'),
  rawToObj: require('./lib/rule/rawToObj'),
  requestedPublishedsToRequester: require('./lib/rule/requestedPublishedsToRequester'),
  requestedSubscribersToRequester: require('./lib/rule/requestedSubscribersToRequester'),
  subscribe: require('./lib/rule/subscribe'),
  subscribedToSubscribers: require('./lib/rule/subscribedToSubscribers'),
  unsubscribe: require('./lib/rule/unsubscribe'),
  unsubscribedOnDisconnect: require('./lib/rule/unsubscribedOnDisconnect'),
  unsubscribedToSubscribers: require('./lib/rule/unsubscribedToSubscribers'),
  unwatch: require('./lib/rule/unwatch'),
  unwatchedOnDisconnect: require('./lib/rule/unwatchedOnDisconnect'),
  updatedExtraToSubscribers: require('./lib/rule/updatedExtraToSubscribers'),
  watch: require('./lib/rule/watch')
});

// read the config
// FIXME: read config filename from commandline, or default to /etc/jsonspace/config.json
const configText = fs.readFileSync('./config.json');
const config = JSON.parse(configText);
for (const message of config) {
  blackboard.put(message);
}



