"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.subscribed || !ob.subscribed.channel) return;

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.subscribed.channel);
  for (const result of results) {
    // *never* mutate existing message objects, always klone first
    const redacted = u.klone(ob);
    delete redacted.subscribed.conn_id; // don't leak connection data

    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }
}

exports.exec = exec;