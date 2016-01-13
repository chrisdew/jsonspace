"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.published || !ob.published.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.published.conn_id; // don't leak connection data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.published.channel);
  for (const result of results) {
    if (result.subscribed.conn_id === ob.published.conn_id) continue;
    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:{published:redacted.published}}});
  }

  // TODO: add channel sending/alerting code (for other transports, such as GCM, etc.) here
}

exports.exec = exec;