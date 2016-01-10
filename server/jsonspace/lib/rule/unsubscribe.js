"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.unsubscribe || !ob.websocket_obj_rx.data.unsubscribe.channel) return;

  const results = queries.subscribed$conn_id.results(ob.websocket_obj_rx.conn_id);
  let count = 0;
  for (const result of results) {
    if (result.subscribed.channel === ob.websocket_obj_rx.data.unsubscribe.channel) {
      put({unsubscribed:result.subscribed});
      count++;
    }
  }

  if (count === 0) {
    put({'error':{message:'unsubscribe did not find an existing subscribed',ref:ob}});
  }

  if (count > 1) {
    put({'error':{message:'unsubscribe found more than one existing subscribed',ref:ob}});
  }
}

exports.exec = exec;