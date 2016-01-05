"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.unsubscribed || !ob.unsubscribed.channel) return;

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.unsubscribed.channel);
  for (const result of results) {
    // *never* mutate existing message objects, always klone first
    const redacted = u.klone(ob);
    delete redacted.unsubscribed.conn_id; // don't leak connection data

    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }
}

exports.exec = exec;