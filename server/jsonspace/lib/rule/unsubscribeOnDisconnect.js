"use strict";

/**
 * Created by chris on 23/12/2015.
 *
 * This rule looks for websocket_disconnect events and then unsubscribes the websocket from any channels.
 *
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.websocket_disconnected || !ob.websocket_disconnected.conn_id) return;

  const results = queries.websocket_subscribed$conn_id.results(ob.websocket_disconnected.conn_id);

  for (const result of results) {
    put({websocket_unsubscribed:result.websocket_subscribed});
  }
}

exports.exec = exec;