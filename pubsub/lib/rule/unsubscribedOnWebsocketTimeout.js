"use strict";

function exec(ob, put, queries) {
  if (!ob.websocket_timeout || !ob.websocket_timeout.conn_id) return;

  const results = queries.subscribed$conn_id.results(ob.websocket_timeout.conn_id);

  for (const result of results) {
    put({unsubscribed: result.subscribed});
  }
}

exports.exec = exec;