"use strict";

/**
 * Created by chris on 14/12/2015.
 */


class Query {
  constructor(name, messageType, keyField) {
    // FIXME: add the handling of unmessages, as is already done for objectArrayByField
    this._messageType = messageType;
    this._keyField = keyField;
    this._objByKey = {}; // keys are channels, values are {"<conn_id>":{type, conn_id}...}
  }

  put(ob) {
    // validate
    let message = ob[this._messageType];
    if (!message) return;
    let keyFieldValue = message[this._keyField];
    if (!keyFieldValue) return;

    this._objByKey[keyFieldValue] = ob;
  }

  getReferences() {
    return Object.values(this._objByKey);
  }

  results(key) {
    return this._objByKey[key];
  }
}

exports.Query = Query;