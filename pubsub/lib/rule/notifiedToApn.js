"use strict";

// This rule sends all notified messages to the pushserver, for distribution via gcm and apple messaging.

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.notified || !ob.notified.channel) return;
console.log('apn0');

  // only send messages to the local pushserver which were notified via this server - otherwise we'll get duplicates
  // TODO: we could send APNs from the each *subscriber's* server instead of the "publisher's" server - would this be better in any way?
  if (isRemote(ob)) return;
console.log('apn1');

  if (!ob.notified.apn) return; // only send notified messages which have an apn object, over apn
console.log('apn2');

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.notified.conn_id; // don't leak connection data
  delete redacted.notified.apn; // don't leak apple push data
  delete redacted.notified.gcm; // don't leak google push data
console.log('apn3');

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.notified.channel);
  const tokens = [];
  for (const result of results) {
    if (result.subscribed.conn_id === ob.notified.conn_id) continue; // don't echo via apn
    if (!result.subscribed.apn) continue;
    if (result.subscribed.username !== ob.notified.dst_username) continue; // only send to the single specified user
    tokens.push(result.subscribed.apn.token);
  }
  const deduped = u.dedupArrayOfStrings(tokens);
console.log('apn4');

  for (const token of deduped) {
    if (!token.match(/^([0-9a-fA-F][0-9a-fA-F])+$/)) {
      console.error('bad apn token: ' + token);
      continue; // skip bad tokens
    }

    var obj = ob.notified.apn ? ob.notified.apn : {};
    obj.token = token;
    obj.payload = redacted;
    put({apn_obj_tx:obj});
  }
}

exports.exec = exec;
