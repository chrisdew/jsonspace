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

  /*
  const results = queries.subscribers.results;

  for (const result in results) {
    const newObName = obName.substring(0, obName.length - 2) + 'tx';
    const newOb = {};
    newOb[newObName] = ob[obName];
    put(newOb);
    return true;
  }
  */
}

exports.exec = exec;