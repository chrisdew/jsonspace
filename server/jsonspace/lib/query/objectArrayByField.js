"use strict";

/**
 * Created by chris on 14/12/2015.
 */


class Query {
  constructor(name, messageType, unmessageType, keyField) {
    this._name = name;
    this._messageType = messageType;
    this._unmessageType = unmessageType;
    this._keyField = keyField;
    this._objByKey = {}; // values are arrays of objects {"<channel>":[{websocket_subscribed:...
  }

  put(ob, put) {
    // handle message and unmessages (unmessages remove messages from queries)

    // validate
    let message = ob[this._messageType];
    if (message) {
      let keyFieldValue = message[this._keyField];
      if (!keyFieldValue) return;

      if (!this._objByKey[keyFieldValue]) {
        this._objByKey[keyFieldValue] = [];
      }
      this._objByKey[keyFieldValue].push(ob);
    }

    let unmessage = ob[this._unmessageType];
    if (unmessage) {
      let keyFieldValue = unmessage[this._keyField];
      if (!keyFieldValue) return;

      if (!this._objByKey[keyFieldValue]) {
        this._objByKey[keyFieldValue] = [];
      }
      // remove any matching messages from the array
      const array =this._objByKey[keyFieldValue];
      // iterating backwards through arrays, when removing elements, is simple and safe
      for (let i = array.length - 1; i >= 0; i--) {
        // FIXME: this only work as long as the content of messages and unmessages are the same *object*
        // it will break if they are only the same value of object
        // TODO: find a good, fast Javascript deepEqual function
        if (array[i][this._messageType] === unmessage) {
          array.splice(i, 1);
        }
      }
    }
  }

  getReferences() {
    return Object.values(this._objByKey);
  }

  results(key) {
    if (this._objByKey[key]) {
      return this._objByKey[key];
    } else {
      // this lets the caller avoid a null check
      return [];
    }
  }
}

exports.Query = Query;