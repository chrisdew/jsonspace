"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_raw_rx) return;

  const obj = JSON.parse(ob.websocket_raw_rx.data);
  put({websocket_obj_rx:{conn_id:ob.websocket_raw_rx.conn_id,data:obj}});
}

exports.exec = exec;