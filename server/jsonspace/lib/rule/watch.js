"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.watch || !ob.websocket_obj_rx.data.watch.channel) return;

  const ob_to_put = {
    watched:{
      conn_id:ob.websocket_obj_rx.conn_id,
      channel:ob.websocket_obj_rx.data.watch.channel,
    }
  };

  put(ob_to_put);

  // *never* mutate message objects, always klone first
  const response = u.klone(ob_to_put);
  delete response.watched.conn_id; // just being tidy

  const results = queries.subscribed$channel.results(response.watched.channel);
  response.watched.others = {}; // the use of an object, rather than an array, dedups by username
  for (const result of results) {
    response.watched.others[result.subscribed.username] = {extra:result.subscribed.extra};
  }

  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:response}});
}

exports.exec = exec;