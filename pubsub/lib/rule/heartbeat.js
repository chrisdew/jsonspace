"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote, ip) {
  if (!ob.heartbeat || isRemote(ob)) return;

  const heartbeat = u.klone(ob.heartbeat);
  if (!heartbeat.host) {
    heartbeat.host = ip;
  }

  setTimeout(function() {
    heartbeat.ts = new Date().toISOString();
    put({heartbeat:heartbeat});
  }, heartbeat.interval);
}

exports.exec = exec;