"use strict";

// This rule sends all published messages to the pushserver, for distribution via gcm and apple messaging.

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.published || !ob.published.channel) return;

  // only send messages to the local pushserver which were published via this server - otherwise we'll get duplicates
  if (isRemote(ob)) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.published.conn_id; // don't leak connection data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.published.channel);
  const tokens = [];
  for (const result of results) {
    if (!result.subscribed.apn) continue;
    tokens.push(result.subscribed.apn.token);
  }
  const deduped = u.dedupArrayOfStrings(tokens);

  for (const token of deduped) {
    put({
      apn_obj_tx: {
        token: token,
        payload: redacted
      }
    });
  }
}

exports.exec = exec;
