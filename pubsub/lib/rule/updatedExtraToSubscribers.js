"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.updated_extra || !ob.updated_extra.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.updated_extra.conn_id; // don't leak connection data
  delete redacted.updated_extra.server; // don't leak connection data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.updated_extra.channel);
  for (const result of results) {
    if (isRemote(result)) continue;
    if (result.subscribed.conn_id === ob.updated_extra.conn_id) continue;
    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }

  // also send the message to each websocket connection which has watched the channel
  const watchResults = queries.watched$channel.results(ob.updated_extra.channel);
  for (const watchResult of watchResults) {
    if (isRemote(watchResult)) continue;
    if (watchResult.watched.conn_id === ob.updated_extra.conn_id) continue;
    put({websocket_obj_tx:{conn_id:watchResult.watched.conn_id,obj:redacted}});
  }
}

exports.exec = exec;
