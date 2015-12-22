"use strict";

/**
 * Created by chris on 14/12/2015.
 */


class Query {
  constructor(messageType, keyField) {
    this._messageType = messageType;
    this._keyField = keyField;
    this._objByKey = {}; // values are arrays of objects {"<channel>":[{websocket_subscribed:...
  }

  put(ob) {
    //console.log('ob', ob);
    //console.log('this', this);
    // validate
    let message = ob[this._messageType];
    //console.log('message', message);
    if (!message) return;
    let keyFieldValue = message[this._keyField];
    //console.log('keyFieldValue', keyFieldValue);
    if (!keyFieldValue) return;

    if (!this._objByKey[keyFieldValue]) {
      this._objByKey[keyFieldValue] = [];
    }
    this._objByKey[keyFieldValue].push(ob);
  }

  getReferences() {
    return Object.values(this._objByKey);
  }

  results(key) {
    return this._objByKey[key];
  }
}

exports.Query = Query;