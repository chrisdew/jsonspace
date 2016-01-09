"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.unwatch || !ob.websocket_obj_rx.data.unwatch.channel || !ob.websocket_obj_rx.data.unwatch.username) return;

  const results = queries.watched$conn_id.results(ob.websocket_obj_rx.conn_id);
  for (const result of results) {
    if (result.watched.channel === ob.websocket_obj_rx.data.unwatch.channel
        && result.watched.username === ob.websocket_obj_rx.data.unwatch.username) {
      put({unwatched:result.watched});
    }
  }
}

exports.exec = exec;