"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const u = require('../util');

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.subscribe || !ob.websocket_obj_rx.data.subscribe.channel) return;

  const subscribed = {
    subscribed:{
      conn_id:ob.websocket_obj_rx.conn_id,
      username:ob.websocket_obj_rx.data.subscribe.username,
      channel:ob.websocket_obj_rx.data.subscribe.channel,
      extra:ob.websocket_obj_rx.data.subscribe.extra
    }
  };

  // *never* mutate message objects, always klone first
  const redacted = u.klone(subscribed);
  delete redacted.subscribed.conn_id;

  // explicitly send the response to the originator, as the originator will not (yet) be in the query results
  // when the subscribedToSubscribers rule picks up the "subscribed" message.
  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:redacted}});
  // the subscribedToSubscribers rule will cause this to be sent to all channel subscribers
  put(subscribed);
}

exports.exec = exec;