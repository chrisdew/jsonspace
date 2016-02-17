"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.publish || !ob.websocket_obj_rx.data.publish.channel) return;
  const publish = ob.websocket_obj_rx.data.publish;

  const result = queries.subscribed$conn_id$channel.result(ob.websocket_obj_rx.conn_id, publish.channel);
  if (result) {
    put({
      published:{
        channel:ob.websocket_obj_rx.data.publish.channel,
        username:result.subscribed.username,
        data:publish.data,
        conn_id:ob.websocket_obj_rx.conn_id
      }
    });
    return;
  }

  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,data:{'error':'not subscribed'}}});

}

exports.exec = exec;