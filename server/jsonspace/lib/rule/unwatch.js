"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.unwatch || !ob.websocket_obj_rx.data.unwatch.channel) return;

  const results = queries.watched$conn_id.results(ob.websocket_obj_rx.conn_id);
  for (const result of results) {
    if (result.watched.channel === ob.websocket_obj_rx.data.unwatch.channel) {
      put({unwatched:result.watched});

      // *never* mutate existing message objects, always klone first
      const redacted = u.klone({unwatched:result.watched});
      delete redacted.unwatched.conn_id; // don't leak connection data

      put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:redacted}});
    }
  }
}

exports.exec = exec;