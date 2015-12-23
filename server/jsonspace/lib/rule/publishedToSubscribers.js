"use strict";

/**
 * Created by chris on 14/12/2015.
 *
 * This rule looks for websocket_rx.publish obs - it then uses the subscribe query to get a list of the subscribers
 * and generates a websocket_tx.publish for each
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.published || !ob.published.channel) return;

  const results = queries.websocket_subscribed$channel.results(ob.published.channel);

  for (const result of results) {
    put({websocket_obj_tx:{conn_id:result.websocket_subscribed.conn_id,obj:ob}});
  }
}

exports.exec = exec;