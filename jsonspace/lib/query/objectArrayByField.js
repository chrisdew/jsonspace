"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const cb = require('../circularBuffer');
const u = require('../util');

const DEFAULT_MAX=100; // we can *never* afford unlimited memory usage

class Query {
  constructor(name, messageType, unmessageType, keyField, max) {
    this._name = name;
    this._messageType = messageType;
    this._unmessageType = unmessageType;
    this._keyField = keyField;
    this._objByKey = {}; // values are arrays of objects {"<channel>":[{websocket_subscribed:...
    this._max = max ? max : DEFAULT_MAX;
  }

  put(ob, put) {
    // handle message and unmessages (unmessages remove messages from queries)

    // validate
    let message = ob[this._messageType];
    if (message) {
      let keyFieldValue = message[this._keyField];
      if (!keyFieldValue) return;

      if (!this._objByKey[keyFieldValue]) {
        this._objByKey[keyFieldValue] = new cb.CircularBuffer(this._max);
      }
      this._objByKey[keyFieldValue].push(ob);
    }

    let unmessage = ob[this._unmessageType];
    if (unmessage) {
      console.log('unmessage ' + JSON.stringify(unmessage));
      let keyFieldValue = unmessage[this._keyField];
      if (!keyFieldValue) return;
      console.log('unmessage1 ' + JSON.stringify(unmessage));

      if (!this._objByKey[keyFieldValue]) {
        console.log('unmessage2 ' + JSON.stringify(unmessage));
        this._objByKey[keyFieldValue] = new cb.CircularBuffer(this._max);
      }

      // remove any matching messages from the array
      // FIXME: this only work as long as the content of messages and unmessages are the same *object*
      // it will break if they are only the same value of object
      // TODO: find a good, fast Javascript deepEqual function
      const circBuf = this._objByKey[keyFieldValue];
      circBuf.remove((x) => {
        const ret = u.deepEqual(x[this._messageType], unmessage);
        console.log('unmessage3 ' + JSON.stringify(unmessage) + ' ' + JSON.stringify(x[this._messageType]), ret);
        return ret;
      });
    }
  }

  getReferences() {
    const ret = [];
    for (const key in this._objByKey) {
      ret.push(this._objByKey[key].toArray());
    }
    return [].concat(...ret);
  }

  results(key) {
    if (this._objByKey[key]) {
      return this._objByKey[key].toArray();
    } else {
      // this lets the caller avoid a null check
      return [];
    }
  }

  debug() {
    const ret = {};
    for (const key in this._objByKey) {
      ret[key] = this._objByKey[key].toArray();
    }
    return ret;
  }
}

exports.Query = Query;