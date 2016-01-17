"use strict";

function exec(ob, put, queries) {
  if (!ob.websocket_disconnected || !ob.websocket_disconnected.conn_id) return;

  const results = queries.watched$conn_id.results(ob.websocket_disconnected.conn_id);

  for (const result of results) {
    put({unwatched: result.watched});
  }
}

exports.exec = exec;