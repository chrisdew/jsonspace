"use strict";

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.unwatch || !ob.websocket_obj_rx.data.unwatch.channel || !ob.websocket_obj_rx.data.unwatch.username) return;

  const results = queries.watched$conn_id.results(ob.websocket_obj_rx.conn_id);
  let count = 0;
  for (const result of results) {
    if (result.watched.channel === ob.websocket_obj_rx.data.unwatch.channel
        && result.watched.username === ob.websocket_obj_rx.data.unwatch.username) {
      put({unwatched:result.watched});
      count++;
    }
  }

  if (count === 0) {
    put({'error':{message:'unwatch did not find an existing watched',ref:ob}});
  }

  if (count > 1) {
    put({'error':{message:'unwatch found more than one existing watched',ref:ob}});
  }
}

exports.exec = exec;