"use strict";

// This rule sends all published messages to the pushserver, for distribution via gcm and apple messaging.

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.published || !ob.published.channel) return;

  // only send messages to the local pushserver which were published via this server - otherwise we'll get duplicates
  // TODO: we could send APNs from the each *subscriber's* server instead of the "publisher's" server - would this be better in any way?
  if (isRemote(ob)) return;

  if (!ob.published.apn) return; // only send published messages which have an apn object, over apn

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.published.conn_id; // don't leak connection data
  delete redacted.published.apn; // don't leak apple push data
  delete redacted.published.gcm; // don't leak google push data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.published.channel);
  const tokens = [];
  for (const result of results) {
    if (result.subscribed.conn_id === ob.published.conn_id) continue; // don't echo via apn
    if (!result.subscribed.apn) continue;
    tokens.push(result.subscribed.apn.token);
  }
  const deduped = u.dedupArrayOfStrings(tokens);

  for (const token of deduped) {
    if (!token.match(/^([0-9a-fA-F][0-9a-fA-F])+$/)) continue; // skip bad tokens

    var obj = ob.published.apn ? ob.published.apn : {};
    obj.token = token;
    obj.payload = redacted;
    put({apn_obj_tx:obj});
  }
}

exports.exec = exec;
