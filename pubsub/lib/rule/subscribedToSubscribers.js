"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.subscribed || !ob.subscribed.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.subscribed.conn_id; // don't leak connection data
  delete redacted.subscribed.server; // don't leak connection data
  delete redacted.subscribed.uod_delay; // don't leak
  delete redacted.subscribed.apn; // don't leak apple push data
  delete redacted.subscribed.gcm; // don't leak google push data
  delete redacted.subscribed.hidefrom;

  // if this is not the first subscription for the username/channel combo, don't bother to inform
  // other subscribers/watchers
  const usernameResults = queries.subscribed$channel.results(ob.subscribed.channel);
  let num_for_username = 0;
  let old_extra;
  for (const result of usernameResults) {
    if (result.subscribed.username === ob.subscribed.username) num_for_username++;
    old_extra = result.subscribed.extra;
  }
  if (num_for_username > 0) {
    // if the "extra" field has changed, make it known
    if (!u.deepEqual(old_extra, ob.subscribed.extra)) {
      put({updated_extra:ob.subscribed});
    }
    return;
  }

  redacted.joined = redacted.subscribed;
  delete redacted.subscribed;

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.subscribed.channel);
  for (const result of results) {
    if (isRemote(result)) continue;
    if (result.subscribed.conn_id === ob.subscribed.conn_id) continue;

    // if this subscription is hiding from a user, don't tell that user
    if (ob.subscribed.hidefrom && ob.subscribed.hidefrom.indexOf(result.subscribed.username) !== -1) continue;

    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }

  // tell the subscribing client that it has subscribed
  put({websocket_obj_tx:{conn_id:ob.subscribed.conn_id,obj:redacted}});

  // also send the message to each websocket connection which has watched the channel
  const watchResults = queries.watched$channel.results(ob.subscribed.channel);
  for (const watchResult of watchResults) {
    if (isRemote(watchResult)) continue;
    if (watchResult.watched.conn_id === ob.subscribed.conn_id) continue;

    // if this subscription is hiding from a user, don't tell that user
    if (ob.subscribed.hidefrom && ob.subscribe.hidefrom.indexOf(watchResult.subscribed.username) !== -1) continue;

    put({websocket_obj_tx:{conn_id:watchResult.watched.conn_id,obj:redacted}});
  }
}

exports.exec = exec;
