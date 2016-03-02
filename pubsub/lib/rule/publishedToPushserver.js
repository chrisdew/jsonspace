"use strict";

// This rule sends all published messages to the pushserver, for distribution via gcm and apple messaging.

const u = require('jsonspace/lib/util');

function exec(ob, put, queries, isRemote) {
  if (!ob.published || !ob.published.channel) return;

  // only send messages to the local pushserver which were published via this server - otherwise we'll get duplicates
  if (isRemote(ob)) return;

  // *never* mutate existing message objects, always klone first
  const redacted = u.klone(ob);
  delete redacted.published.conn_id; // don't leak connection data

  // send the message to each websocket connection which has subscribed to the channel
  const results = queries.subscribed$channel.results(ob.published.channel);
  const users = [];
  for (const result of results) {
    users.push(result.subscribed.username);
  }
  const deduped = u.dedupArrayOfStrings(users);

  const data = JSON.stringify({
    users: deduped,
    android:{
      collapseKey: "optional",
      data:{
        message: redacted
      }
    },
    ios:{
      badge: 0,
      alert: redacted,
      sound: "soundName"
    }
  });

  put({
    http_client_request:{
      options: {
        hostname: 'localhost',
        port: 8010,
        path: '/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      },
      data:data
    }
  });
}

exports.exec = exec;
