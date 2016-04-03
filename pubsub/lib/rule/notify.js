"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.notify || !ob.websocket_obj_rx.data.notify.channel || !ob.websocket_obj_rx.data.notify.username) return;
  console.log('notify 0');
  const notify = ob.websocket_obj_rx.data.notify;

  const results = queries.subscribed$conn_id$channel.results(ob.websocket_obj_rx.conn_id, notify.channel);
  console.log('notify 1', results);

  for (const result of results) {
    put({
      notified:{
        channel:ob.websocket_obj_rx.data.notify.channel,
        src_username:result.subscribed.username, // this is the username of the user doing the notification
        dst_username:notify.username,
        data:notify.data,
        conn_id:ob.websocket_obj_rx.conn_id,
        apn:ob.websocket_obj_rx.data.notify.apn,
        gcm:ob.websocket_obj_rx.data.notify.gcm
      }
    });
  }
  console.log('notify 2');

  if (results.length > 0) return;
  console.log('notify 3');

  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,data:{'error':'not subscribed'}}});

}

exports.exec = exec;