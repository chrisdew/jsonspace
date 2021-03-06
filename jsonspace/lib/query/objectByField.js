"use strict";

/**
 * Created by chris on 14/12/2015.
 */
const u = require('../util');

class Query {
  constructor(name, messageType, unmessageType, keyField) {
    this._name = name;
    this._messageType = messageType;
    this._unmessageType = unmessageType;
    this._keyField = keyField;
    this._objByKey = {}; // keys are channels, values are {"<conn_id>":{type, conn_id}...}
  }

  put(ob) {
    // handle message and unmessages (unmessages remove messages from queries)
    let message = ob[this._messageType];
    if (message) {
      let keyFieldValue = message[this._keyField];
      if (!keyFieldValue) return;

      this._objByKey[keyFieldValue] = ob;
    }

    let unmessage = ob[this._unmessageType];
    if (unmessage) {
      let keyFieldValue = unmessage[this._keyField];
      if (!keyFieldValue) return;

      // only remove the object if it is the *same* object, not just an object with the same key
      if (u.deepEqual(this._objByKey[keyFieldValue][this._messageType], unmessage)) {
        delete this._objByKey[keyFieldValue];
      }
    }
  }

  getReferences() {
    const ret = [];
    for (const key in this._objByKey) {
      ret.push(this._objByKey[key]);
    }
    return ret;
  }

  result(key) {
    return this._objByKey[key];
  }

  all() {
    return this._objByKey;
  }

  debug() {
    return this.all();
  }
}

exports.Query = Query;