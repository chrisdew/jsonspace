"use strict";

const u = require('jsonspace/lib/util');

function exec(ob, put, queries) {
  if (!ob.requested_subscribers || !ob.requested_subscribers.channel) return;

  const response = {members:{channel:ob.requested_subscribers.channel,list:[]}};

  const results = queries.subscribed$channel.results(ob.requested_subscribers.channel);
  let set = {}; // using an object as a simple way to keep only the last "subscribed" for each username
  for (const result of results) {
    set[result.subscribed.username] = ({username:result.subscribed.username,extra:result.subscribed.extra});
  }
  for (const username in set) {
    response.members.list.push(set[username]);
  }
  put({websocket_obj_tx:{conn_id:ob.requested_subscribers.conn_id,obj:response}});

}

exports.exec = exec;
