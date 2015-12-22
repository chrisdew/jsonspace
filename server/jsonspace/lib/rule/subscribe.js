"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_obj_rx.data.subscribe || !ob.websocket_obj_rx.data.subscribe.channel) return;

  // client confirmation
  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:{subscribed:ob.websocket_obj_rx.data.subscribe}}});

  // write an association for the websocket_logged_inUsernameByConn_id query to keep
  put({websocket_subscribed:{
    conn_id:ob.websocket_obj_rx.conn_id,
    channel:ob.websocket_obj_rx.data.subscribe.channel
  }});
}

exports.exec = exec;