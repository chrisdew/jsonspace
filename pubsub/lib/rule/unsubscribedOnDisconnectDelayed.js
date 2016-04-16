"use strict";

const DELAY = 60000;

function exec(ob, put, queries) {
  if (!ob.websocket_disconnected || !ob.websocket_disconnected.conn_id) return;

  const results = queries.subscribed$conn_id.results(ob.websocket_disconnected.conn_id);

  for (const result of results) {
    if (result.subscribed.uod_delay) {
      setTimeout(function () {
        put({unsubscribed: result.subscribed});
      }, result.subscribed.uod_delay);
    } else {
      put({unsubscribed: result.subscribed});
    }
  }
}

exports.exec = exec;