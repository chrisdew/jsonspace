"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.unsubscribe || !ob.websocket_obj_rx.data.unsubscribe.channel) return;

  const results = queries.subscribed$conn_id.results(ob.websocket_obj_rx.conn_id);
  for (const result of results) {
    if (result.subscribed.channel === ob.websocket_obj_rx.data.unsubscribe.channel) {
      put({unsubscribed:result.subscribed});
    }
  }
}

exports.exec = exec;