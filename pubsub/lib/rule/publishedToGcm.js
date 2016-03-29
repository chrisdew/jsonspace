"use strict";

// This rule sends all published messages to the pushserver, for distribution via gcm and apple messaging.

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.published || !ob.published.channel) return;

  // only send messages to the local pushserver which were published via this server - otherwise we'll get duplicates
  // TODO: we could send GCMs from the each *subscriber's* server instead of the "publisher's" server - would this be better in any way?
  // For *GCM* this propbably wouldn't be better, as we can (in future) send multiple GCMs at once
  if (isRemote(ob)) return;

  if (!ob.published.gcm) return; // only send published messages which have an gcm object, over gcm

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.published.conn_id; // don't leak connection data
  delete redacted.published.apn; // don't leak apple push data
  delete redacted.published.gcm; // don't leak google push data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.published.channel);
  const tokens = [];
  for (const result of results) {
    if (result.subscribed.conn_id === ob.published.conn_id) continue; // don't echo via gcm
    if (!result.subscribed.gcm) continue;
    tokens.push(result.subscribed.gcm.token);
  }
  const deduped = u.dedupArrayOfStrings(tokens);

  for (const token of deduped) {
    var obj = ob.published.gcm ? ob.published.gcm : {};
    obj.token = token;
    obj.payload = redacted;
    put({gcm_obj_tx:obj});
  }
}

exports.exec = exec;
