"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.unsubscribed || !ob.unsubscribed.channel) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.unsubscribed.conn_id; // don't leak connection data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.unsubscribed.channel);
  for (const result of results) {
    // skip the conn_id which is unsubscribing, as the message would fail anyway...
    // FIXME: don;t skip sending it, as the client may be unsubscribing without disconnecting
    //if (ob.unsubscribed.conn_id === result.subscribed.conn_id) continue;

    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:redacted}});
  }

  // also send the message to each websocket connection which has watched the channel
  const watchResults = queries.watched$channel.results(ob.unsubscribed.channel);
  for (const watchResult of watchResults) {
    put({websocket_obj_tx:{conn_id:watchResult.watched.conn_id,obj:redacted}});
  }
}

exports.exec = exec;