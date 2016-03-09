"use strict";

/**
 * Created by chris on 14/12/2015.
 */

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.subscribe || !ob.websocket_obj_rx.data.subscribe.channel || !ob.websocket_obj_rx.data.subscribe.username) return;

  // now close any subscriptions that this user/conn_id has on this channel
  const subResults = queries.subscribed$conn_id.results(ob.websocket_obj_rx.conn_id);
  for (const result of subResults) {
    if (result.subscribed.channel === ob.websocket_obj_rx.data.subscribe.channel
      && result.subscribed.username === ob.websocket_obj_rx.data.subscribe.username) {
      put({unsubscribed:result.subscribed});
    }
  }

  // now close any watches that this user/conn_id has on this channel
  let wasWatching = false;
  const watchResults = queries.watched$conn_id.results(ob.websocket_obj_rx.conn_id);
  for (const result of watchResults) {
    if (result.watched.channel === ob.websocket_obj_rx.data.subscribe.channel
        && result.watched.username === ob.websocket_obj_rx.data.subscribe.username) {
      wasWatching = true;
      put({unwatched:result.watched});
    }
  }

  const ob_to_put = {
    subscribed:{
      conn_id:ob.websocket_obj_rx.conn_id,
      username:ob.websocket_obj_rx.data.subscribe.username,
      channel:ob.websocket_obj_rx.data.subscribe.channel,
      extra:ob.websocket_obj_rx.data.subscribe.extra,
      server:ob.id.split('|')[2],
      apn:ob.websocket_obj_rx.data.subscribe.apn
    }
  };

  // the subscribedToSubscribers rule will cause this to be sent to all channel subscribers
  put(ob_to_put);

  // request that a subscribers list is sent to this conn_id
  // - this is a workaround to let the query run *after* the query has been updated with the "subscribed" message which this rule has put
  if (!wasWatching) { // do not send list if they were already watching this channel - https://github.com/chrisdew/jsonspace/issues/18
    put({ requested_subscribers: {
        channel: ob.websocket_obj_rx.data.subscribe.channel,
        conn_id: ob.websocket_obj_rx.conn_id,
        username: ob.websocket_obj_rx.data.subscribe.username
      }
    });
  }

  // request that a history is sent to this conn_id
  const published_since = ob.websocket_obj_rx.data.subscribe.published_since;
  if (typeof published_since === 'string') {
    put({
      requested_publisheds: {
        channel: ob.websocket_obj_rx.data.subscribe.channel,
        conn_id: ob.websocket_obj_rx.conn_id,
        username: ob.websocket_obj_rx.data.subscribe.username,
        published_since: published_since
      }
    });
  }
}

exports.exec = exec;
