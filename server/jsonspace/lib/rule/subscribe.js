"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.subscribe || !ob.websocket_obj_rx.data.subscribe.channel) return;

  const ob_to_put = {
    subscribed:{
      conn_id:ob.websocket_obj_rx.conn_id,
      username:ob.websocket_obj_rx.data.subscribe.username,
      channel:ob.websocket_obj_rx.data.subscribe.channel,
      extra:ob.websocket_obj_rx.data.subscribe.extra
    }
  };

  // the subscribedToSubscribers rule will cause this to be sent to all channel subscribers
  put(ob_to_put);

  // *never* mutate message objects, always klone first
  const response = u.klone(ob_to_put);
  delete response.subscribed.conn_id; // just being tidy

  const results = queries.subscribed$channel.results(response.subscribed.channel);
  response.subscribed.others = {}; // the use of an object, rather than an array, dedups by username
  for (const result of results) {
    response.subscribed.others[result.subscribed.username] = {extra:result.subscribed.extra};
  }

  // explicitly send the response to the originator, as the originator will not (yet) be in the query results
  // when the subscribedToSubscribers rule picks up the "subscribed" message.
  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:response}});
}

exports.exec = exec;