"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.subscribed || !ob.subscribed.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.subscribed.conn_id; // don't leak connection data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.subscribed.channel);
  for (const result of results) {
    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }

  // also send the message to each websocket connection which has watched the channel
  const watchResults = queries.watched$channel.results(ob.subscribed.channel);
  for (const watchResult of watchResults) {
    put({websocket_obj_tx:{conn_id:watchResult.watched.conn_id,obj:redacted}});
  }
}

exports.exec = exec;