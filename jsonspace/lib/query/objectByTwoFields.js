"use strict";

/**
 * Created by chris on 14/12/2015.
 */


class Query {
  constructor(name, messageType, unmessageType, keyField, keyField2) {
    this._name = name;
    this._messageType = messageType;
    this._unmessageType = unmessageType;
    this._keyField = keyField;
    this._keyField2 = keyField2;
    this._objByKey = {}; // keys are channels, values are {"<conn_id>":{type, conn_id}...}
  }

  put(ob) {
    // handle message and unmessages (unmessages remove messages from queries)
    let message = ob[this._messageType];
    if (message) {
      let keyFieldValue = message[this._keyField];
      let keyField2Value = message[this._keyField2];
      if (!keyFieldValue) return;
      if (!keyField2Value) return;

      this._objByKey[keyFieldValue + '|@@|' + keyField2Value] = ob;
    }

    let unmessage = ob[this._unmessageType];
    if (unmessage) {
      let keyFieldValue = unmessage[this._keyField];
      let keyField2Value = unmessage[this._keyField2];
      if (!keyFieldValue) return;
      if (!keyField2Value) return;

      // only remove the object if it is the *same* object, not just an object with the same key
      if (this._objByKey[keyFieldValue + '|@@|' + keyField2Value][this._messageType] === unmessage) {
        // FIXME: this only work as long as the content of messages and unmessages are the same *object*
        // it will break if they are only the same value of object
        // TODO: find a good, fast Javascript deepEqual function
        delete this._objByKey[keyFieldValue + '|@@|' + keyField2Value];
      }
    }
  }

  getReferences() {
    const ret = [];
    for (const keyPair in this._objByKey) {
      ret.push(this._objByKey[keyPair]);
    }
    return ret;
  }

  result(key, key2) {
    return this._objByKey[key + '|@@|' + key2];
  }

  all() {
    return this._objByKey;
  }

  debug() {
    return this.all();
  }
}

exports.Query = Query;