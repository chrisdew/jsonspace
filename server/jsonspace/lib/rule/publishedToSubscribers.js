"use strict";

/**
 * Created by chris on 14/12/2015.
 *
 * This rule looks for websocket_rx.publish obs
 * - it then uses the subscribed$channel query to get a list of the subscribers' usernames
 * - and then uses the websocket_logged_in$username query to get a list of websocket connection
 * and generates a websocket_tx.publish for each
 */

const u = require('../util');

function exec(ob, put, queries) {
  const obName = u.firstNonIdPropertyName(ob);
  if (!ob.published || !ob.published.channel) return;

  const results = queries.subscribed$channel.results(ob.published.channel);

  for (const result of results) {
    // for each username, iterate through any websocket connections
    let username = result.subscribed.username;

    // send the message to each websocket connection for each username which has subscribed to the channel
    const websocketResults = queries.websocket_logged_in$username.results(username);
    for (const websocketResult of websocketResults) {
      console.log('###', websocketResult);
      put({websocket_obj_tx:{conn_id:websocketResult.websocket_logged_in.conn_id,obj:ob}});
    }

    // TODO: add channel sending/alerting code (for other transports, such as GCM, etc.) here
  }
}

exports.exec = exec;