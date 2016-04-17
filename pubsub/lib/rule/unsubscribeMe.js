"use strict";

function exec(ob, put, queries) {
  console.log('unsubscribe_me_a');
  if (!ob.websocket_obj_rx.data.unsubscribe_me || !ob.websocket_obj_rx.data.unsubscribe_me.channel) return;
  console.log('unsubscribe_me_b');

  const results = queries.subscribed$channel$username.results(ob.websocket_obj_rx.data.unsubscribe_me.channel, ob.websocket_obj_rx.data.unsubscribe_me.username);
  let count = 0;
  console.log('unsubscribe_me_c');
  for (const result of results) {
    // TODO: this will do all the unsubscribes according to what the receiving server knows.
    // Would it be better to distribute the unsubscribe_me message to all servers and handle the unsubscribing per-server?
    put({unsubscribed:result.subscribed});
    count++;
  }
  console.log('unsubscribe_me_d', count);

  if (count === 0) {
    put({'error':{message:'unsubscribe_me did not find an existing subscribed',ref:ob}});
  }
}

exports.exec = exec;