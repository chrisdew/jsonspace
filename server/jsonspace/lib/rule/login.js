"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_obj_rx.data.login || !ob.websocket_obj_rx.data.login.username) return;

  // client confirmation
  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:{logged_in:true}}});

  // write an association for the websocket_logged_in$conn_id query to keep
  put({websocket_logged_in:{
    conn_id:ob.websocket_obj_rx.conn_id,
    username:ob.websocket_obj_rx.data.login.username
  }});
}

exports.exec = exec;