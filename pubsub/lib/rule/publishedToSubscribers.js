"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.published || !ob.published.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.published.conn_id; // don't leak connection data
  delete redacted.published.apn; // don't leak apple push data
  delete redacted.published.gcm; // don't leak google push data
  delete redacted.published.hidefrom;

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.published.channel);
  for (const result of results) {
    if (isRemote(result)) continue;
    if (result.subscribed.conn_id === ob.published.conn_id) continue;

    if (ob.published.hidefrom && ob.published.hidefrom.indexOf(result.subscribed.username) !== -1) continue;

    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }
}

exports.exec = exec;
