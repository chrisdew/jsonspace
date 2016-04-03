"use strict";

// This rule sends all notified messages to the pushserver, for distribution via gcm and apple messaging.

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.notified || !ob.notified.channel) return;

console.log('gcm0');
  // only send messages to the local pushserver which were notified via this server - otherwise we'll get duplicates
  // TODO: we could send GCMs from the each *subscriber's* server instead of the "publisher's" server - would this be better in any way?
  // For *GCM* this propbably wouldn't be better, as we can (in future) send multiple GCMs at once
  if (isRemote(ob)) return;
console.log('gcm1');

  if (!ob.notified.gcm) return; // only send notified messages which have an gcm object, over gcm
console.log('gcm2');

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.notified.conn_id; // don't leak connection data
  delete redacted.notified.apn; // don't leak apple push data
  delete redacted.notified.gcm; // don't leak google push data
console.log('gcm3');

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.notified.channel);
  const tokens = [];
  for (const result of results) {
    if (result.subscribed.conn_id === ob.notified.conn_id) continue; // don't echo via gcm
    if (!result.subscribed.gcm) continue;
    if (result.subscribed.username !== ob.notified.dst_username) continue; // only send to the single specified user
    tokens.push(result.subscribed.gcm.token);
  }
  const deduped = u.dedupArrayOfStrings(tokens);
console.log('gcm4');

  for (const token of deduped) {
    if (!token.match(/^([0-9a-fA-F][0-9a-fA-F])+$/)) {
      console.error('bad gcm token: ' + token);
      continue; // skip bad tokens
    }

    var obj = ob.notified.gcm ? ob.notified.gcm : {};
    obj.token = token;
    obj.payload = redacted;
    put({gcm_obj_tx:obj});
  }
}

exports.exec = exec;
