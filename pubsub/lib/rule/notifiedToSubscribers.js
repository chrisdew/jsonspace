"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.notified || !ob.notified.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.notified.conn_id; // don't leak connection data
  delete redacted.notified.apn; // don't leak apple push data
  delete redacted.notified.gcm; // don't leak google push data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.notified.channel);
  for (const result of results) {
    if (isRemote(result)) continue;
    if (result.subscribed.conn_id === ob.notified.conn_id) continue;
    if (result.subscribed.username !== ob.notified.dst_username) continue; // only send to the single specified user on maybe multiple connections
    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }
}

exports.exec = exec;
