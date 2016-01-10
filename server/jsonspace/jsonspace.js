"use strict";

/**
 * Created by chris on 09/12/2015.
 */

const fs = require('fs');
const bb = require('./lib/blackboard');

const blackboard = new bb.Blackboard(null, () => new Date().toISOString());

// read the config
// FIXME: read config filename from commandline, or default to /etc/jsonspace/config.json
const configText = fs.readFileSync('./config.json');
const config = JSON.parse(configText);
for (const message of config) {
  blackboard.put(message);
}



