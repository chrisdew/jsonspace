"use strict";

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.unwatch_and_unsubscribe || !ob.websocket_obj_rx.data.unwatch_and_unsubscribe.channel) return;

  put({websocket_obj_rx:{conn_id: ob.websocket_obj_rx.conn_id, data:{unwatch: ob.websocket_obj_rx.data.unwatch_and_unsubscribe}}});
  put({websocket_obj_rx:{conn_id: ob.websocket_obj_rx.conn_id, data:{unsubscribe: ob.websocket_obj_rx.data.unwatch_and_unsubscribe}}});
}

exports.exec = exec;