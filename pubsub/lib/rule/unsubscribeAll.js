"use strict";

function exec(ob, put, queries) {
  if (!ob.websocket_obj_rx.data.unsubscribe_all || !ob.websocket_obj_rx.data.unsubscribe_all.channel) return;

  const results = queries.subscribed$channel.results(ob.websocket_obj_rx.data.unsubscribe_all.channel);
  let count = 0;
  for (const result of results) {
    process.nextTick(function() {
      put({unsubscribed:result.subscribed});
    });
    count++;
  }

  if (count === 0) {
    put({'error':{message:'unsubscribe did not find an existing subscribed',ref:ob}});
  }
}

exports.exec = exec;