"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries) {
  if (!ob.requested_publisheds || !ob.requested_publisheds.channel) return;

  const results = queries.published$channel.results(ob.requested_publisheds.channel);
  for (const result of results) {
    if (result.id.substr(0, 24) <= ob.requested_publisheds.published_since) continue;

    // *never* mutate existing message objects, always klone first
    const redacted = u.klone(result);
    delete redacted.published.conn_id; // don't leak connection data
    delete redacted.published.apn; // don't leak apple push data
    delete redacted.published.gcm; // don't leak google push data

    put({websocket_obj_tx: {conn_id: ob.requested_publisheds.conn_id, obj: redacted}});
  }

}

exports.exec = exec;
