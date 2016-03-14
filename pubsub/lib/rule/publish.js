"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.publish || !ob.websocket_obj_rx.data.publish.channel) return;
  const publish = ob.websocket_obj_rx.data.publish;

  const results = queries.subscribed$conn_id$channel.results(ob.websocket_obj_rx.conn_id, publish.channel);
  for (const result of results) {
    // FIXME: we should also check the username, as multiple usernames can theoretically be used on one websocket
    put({
      published:{
        channel:ob.websocket_obj_rx.data.publish.channel,
        username:result.subscribed.username,
        data:publish.data,
        conn_id:ob.websocket_obj_rx.conn_id,
        apn:ob.websocket_obj_rx.data.publish.apn,
        gcm:ob.websocket_obj_rx.data.publish.gcm
      }
    });
  }
  if (results.length > 0) return;

  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,data:{'error':'not subscribed'}}});

}

exports.exec = exec;