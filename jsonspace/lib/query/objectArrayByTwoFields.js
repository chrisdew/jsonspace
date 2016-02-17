"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const cb = require('../circularBuffer');
const u = require('../util');

const DEFAULT_MAX=100; // we can *never* afford unlimited memory usage

class Query {
  constructor(name, messageType, unmessageType, keyField, keyField2, max) {
    this._name = name;
    this._messageType = messageType;
    this._unmessageType = unmessageType;
    this._keyField = keyField;
    this._keyField2 = keyField2;
    this._objByKey = {}; // values are arrays of objects {"<channel>":[{websocket_subscribed:...
    this._max = max ? max : DEFAULT_MAX;
  }

  put(ob, put) {
    // handle message and unmessages (unmessages remove messages from queries)

    // validate
    let message = ob[this._messageType];
    if (message) {
      let keyFieldValue = message[this._keyField];
      let keyFieldValue2 = message[this._keyField2];
      if (!keyFieldValue) return;
      if (!keyFieldValue2) return;

      if (!this._objByKey[keyFieldValue + '|@@|' + keyFieldValue2]) {
        this._objByKey[keyFieldValue + '|@@|' + keyFieldValue2] = new cb.CircularBuffer(this._max);
      }
      this._objByKey[keyFieldValue + '|@@|' + keyFieldValue2].push(ob);
    }

    let unmessage = ob[this._unmessageType];
    if (unmessage) {
      //console.log('unmessage ' + JSON.stringify(unmessage));
      let keyFieldValue = unmessage[this._keyField];
      let keyFieldValue2 = unmessage[this._keyField2];
      if (!keyFieldValue) return;
      if (!keyFieldValue2) return;
      //console.log('unmessage1 ' + JSON.stringify(unmessage));

      if (!this._objByKey[keyFieldValue + '|@@|' + keyFieldValue2]) {
        //console.log('unmessage2 ' + JSON.stringify(unmessage));
        this._objByKey[keyFieldValue + '|@@|' + keyFieldValue2] = new cb.CircularBuffer(this._max);
      }

      // remove any matching messages from the array
      // FIXME: this only work as long as the content of messages and unmessages are the same *object*
      // it will break if they are only the same value of object
      // TODO: find a good, fast Javascript deepEqual function
      const circBuf = this._objByKey[keyFieldValue + '|@@|' + keyFieldValue2];
      circBuf.remove((x) => {
        const ret = u.deepEqual(x[this._messageType], unmessage);
        //console.log('unmessage3 ' + JSON.stringify(unmessage) + ' ' + JSON.stringify(x[this._messageType]), ret);
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

  results(key, key2) {
    if (this._objByKey[key + '|@@|' + key2]) {
      return this._objByKey[key + '|@@|' + key2].toArray();
    } else {
      // this lets the caller avoid a null check
      return [];
    }
  }

  all() {
    const ret = {};
    for (const key in this._objByKey) {
      ret[key] = this._objByKey[key].toArray();
    }
    return ret;
  }

  debug() {
    return this.all();
  }
}

exports.Query = Query;