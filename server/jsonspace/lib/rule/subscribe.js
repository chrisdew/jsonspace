"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_obj_rx.data.subscribe || !ob.websocket_obj_rx.data.subscribe.channel) return;

  // lookup username
  let result = queries.websocket_logged_in$conn_id.result(ob.websocket_obj_rx.conn_id);

  if (!result || !result.websocket_logged_in || !result.websocket_logged_in.username) {
    put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:{
      error:{message:'not logged in',ref:ob.id,rxd:ob.websocket_obj_rx.data.subscribe}
    }}});
    return;
  }

  let username = result.websocket_logged_in.username;

  // client confirmation
  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:{subscribed:ob.websocket_obj_rx.data.subscribe}}});

  // write an association for the websocket_subscribed$username query to keep
  put({subscribed:{
    username:username,
    channel:ob.websocket_obj_rx.data.subscribe.channel
  }});
}

exports.exec = exec;