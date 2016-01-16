"use strict";

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.requested_publisheds || !ob.requested_publisheds.channel) return;

  const results = queries.published$channel.results(ob.requested_publisheds.channel);
  for (const result of results) {
    if (result.id <= ob.requested_publisheds.published_since) continue;
    const response = u.klone(result); // always klone before mutating
    delete response.published.conn_id;
    put({websocket_obj_tx: {conn_id: ob.requested_publisheds.conn_id, obj: response}});
  }

}

exports.exec = exec;
