"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.unsubscribed || !ob.unsubscribed.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.unsubscribed.conn_id; // don't leak connection data
  delete redacted.unsubscribed.server; // don't leak connection data
  delete redacted.unsubscribed.uod_delay; // don't leak
  delete redacted.unsubscribed.apn; // don't leak apple push data
  delete redacted.unsubscribed.gcm; // don't leak google push data

  // if this is not the first subscription for the username/channel combo, don't bother to inform
  // other subscribers/watchers
  const usernameResults = queries.subscribed$channel.results(ob.unsubscribed.channel);
  let num_for_username = 0;
  for (const result of usernameResults) {
    if (result.subscribed.username === ob.unsubscribed.username) num_for_username++;
  }
  // note: we have to check for "> 1" as this unsubscribe message will not remove the subscribed event from the
  // query until *after* this code has been run
  if (num_for_username > 1) return;

  redacted.left = redacted.unsubscribed;
  delete redacted.unsubscribed;

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.unsubscribed.channel);
  for (const result of results) {
    if (isRemote(result)) continue;
    if (ob.unsubscribed.conn_id === result.subscribed.conn_id) continue;
    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }

  // also send the message to each websocket connection which has watched the channel
  const watchResults = queries.watched$channel.results(ob.unsubscribed.channel);
  for (const watchResult of watchResults) {
    if (isRemote(watchResult)) continue;
    put({websocket_obj_tx:{conn_id:watchResult.watched.conn_id,obj:redacted}});
  }
}

exports.exec = exec;
