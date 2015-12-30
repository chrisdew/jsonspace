"use strict";

/**
 * Created by chris on 23/12/2015.
 *
 * This rule looks for websocket_disconnect events then unlogins the websocket .
 *
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_disconnected || !ob.websocket_disconnected.conn_id) return;

  const result = queries.websocket_logged_in$conn_id.result(ob.websocket_disconnected.conn_id);

  if (!result) return; // the connection may not have been logged in before it disconnects

  put({websocket_logged_out:result.websocket_logged_in});
}

exports.exec = exec;