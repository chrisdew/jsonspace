"use strict";

function exec(ob, put, queries) {
  if (!ob.published || !ob.published.channel) return;

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.published.channel);
  for (const result of results) {
    put({websocket_obj_tx:{conn_id:result.subscribed.conn_id,obj:{published:ob.published}}});
  }

  // TODO: add channel sending/alerting code (for other transports, such as GCM, etc.) here
}

exports.exec = exec;