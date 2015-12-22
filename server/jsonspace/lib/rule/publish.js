"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_obj_rx.data.publish || !ob.websocket_obj_rx.data.publish.channel) return;

  const result = queries.websocket_logged_in$conn_id.results(ob.websocket_obj_rx.conn_id);

  if (!result) {
    put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,data:{'error':'not logged in'}}});
    return;
  }

  put({
    published:{
      channel:ob.websocket_obj_rx.data.publish.channel,
      username:result.websocket_logged_in.username,
      data:ob.websocket_obj_rx.data.publish.data
    }
  });
}

exports.exec = exec;