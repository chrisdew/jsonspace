"use strict";

/**
 * Created by chris on 14/12/2015.
 */


class Query {
  constructor() {
    this._subscribersByChannel = {}; // keys are channels, values are {"<conn_id>":{type, conn_id}...}
  }

  put(ob) {
    // FIXME: stop this from being websocket_rx-specific, as we'll need to support GCM, etc.
    if (!ob.websocket_obj_rx || !ob.websocket_obj_rx.conn_id) return;
    if (ob.websocket_obj_rx.data && ob.websocket_obj_rx.data.subscribe && ob.websocket_obj_rx.data.subscribe.channel) {
      const channel = ob.websocket_obj_rx.data.subscribe.channel;
      if (!this._subscribersByChannel[channel]) {
        this._subscribersByChannel[channel] = {};
      }
      this._subscribersByChannel[channel][ob.websocket_obj_rx.conn_id] = {type:'websocket_obj_tx',conn_id:ob.websocket_obj_rx.conn_id};
    }
  }

  getReferences() {
    return klone(this._objects);
  }

  getResult() {
    return klone(this._objects);
  }
}

exports.Query = Query;