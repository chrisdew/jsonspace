"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_obj_rx.data.publish || !ob.websocket_obj_rx.data.publish.channel) return;

  put({published:ob.websocket_obj_rx.data.publish});
}

exports.exec = exec;