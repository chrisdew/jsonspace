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
  if (!ob.publish || !ob.publish.channel) return;

  const results = queries.subscribers.results;

  for (const result in results) {
    const newObName = obName.substring(0, obName.length - 2) + 'tx';
    const newOb = {};
    newOb[newObName] = ob[obName];
    put(newOb);
    return true;
  }
}

exports.exec = exec;