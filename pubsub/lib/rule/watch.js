"use strict";

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.watch || !ob.websocket_obj_rx.data.watch.channel || !ob.websocket_obj_rx.data.watch.username) return;

  // now close any subscriptions that this user/conn_id has on this channel
  const subResults = queries.subscribed$conn_id.results(ob.websocket_obj_rx.conn_id);
  for (const result of subResults) {
    if (result.subscribed.channel === ob.websocket_obj_rx.data.watch.channel
      && result.subscribed.username === ob.websocket_obj_rx.data.watch.username) {
      put({unsubscribed:result.subscribed});
    }
  }

  // now close any watches that this user/conn_id has on this channel
  const watchResults = queries.watched$conn_id.results(ob.websocket_obj_rx.conn_id);
  for (const result of watchResults) {
    if (result.watched.channel === ob.websocket_obj_rx.data.watch.channel
      && result.watched.username === ob.websocket_obj_rx.data.watch.username) {
      put({unwatched:result.watched});
    }
  }

  const ob_to_put = {
    watched:{
      conn_id:ob.websocket_obj_rx.conn_id,
      username:ob.websocket_obj_rx.data.watch.username,
      channel:ob.websocket_obj_rx.data.watch.channel
    }
  };

  put(ob_to_put);

  // we no longer tell the originating client that they have subscribed, instead we just send a subscribers list
  const response = {subscribers:{channel:ob.websocket_obj_rx.data.watch.channel,list:[]}};

  const results = queries.subscribed$channel.results(ob.websocket_obj_rx.data.watch.channel);
  for (const result of results) {
    response.subscribers.list.push({username:result.subscribed.username,extra:result.subscribed.extra});
  }
  put({websocket_obj_tx:{conn_id:ob.websocket_obj_rx.conn_id,obj:response}});
}

exports.exec = exec;