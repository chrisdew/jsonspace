"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries) {
  if (!ob.replicate_disconnected) return;

  const results = queries.subscribed$server.results(ob.replicate_disconnected.server);
  for (const result of results) {
    put({unsubscribed: result.subscribed, local: true});
  }

}

exports.exec = exec;
