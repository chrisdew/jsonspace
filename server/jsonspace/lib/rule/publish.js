"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.publish || !ob.websocket_obj_rx.data.publish.channel) return;
  const publish = ob.websocket_obj_rx.data.publish;

  const results = queries.subscribed$conn_id.results(ob.websocket_obj_rx.conn_id);

  // TODO: make a new query type which accepts multiple keys
  for (const result of results) {
    if (result.subscribed.channel === publish.channel) {
      console.log(';;;');
      put({
        published:{
          channel:ob.websocket_obj_rx.data.publish.channel,
          username:result.subscribed.username,
          data:publish.data
        }
      });
      return;
    }
  }

  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,data:{'error':'not subscribed'}}});

}

exports.exec = exec;