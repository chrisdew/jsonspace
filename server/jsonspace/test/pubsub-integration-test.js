"use strict";

/**
 * Created by chris on 19/12/2015.
 */

var assert = require('assert');
var ws = require('ws');

// WrappedWebSocket is a convenience class for testing purposes only
function WrappedWebSocket(name, url, connectedCallback) {
  this.name = name;
  this.conn = new ws(url);
  this.log = []; //{tx:...} or {rx:...};
  this.tx = [];
  this.rx = [];
  this.rxHandler = false;
  this.expected = false;
  this.conn.on('open', () => {
    console.log(name + ': connected');
    connectedCallback();
  });
  this.conn.on('message', (message) => {
    console.log(name + ' rx: ' + message);
    let data = JSON.parse(message);
    this.rx.push(data);
    this.log.push({rx:data});
    if (this.rxHandler) {
      if (this.expected) {
        // ignore id fields
        const tmp = klone(data);
        delete tmp.id;
        assert.deepEqual(this.expected, tmp);
      }
      this.rxHandler(data);
      this.rxHandler = false;
      this.expected = false;
    } else {
      throw new Error('unexpected data: ' + JSON.stringify(data));
    }
  });
}

// send a JSON object and optionally
WrappedWebSocket.prototype.send = function(ob, expected, rxHandler) {
  console.log(this.name + ' tx: ' + JSON.stringify(ob));
  if (rxHandler) {
    this.expect(expected, rxHandler);
  }
  this.tx.push(ob);
  this.log.push({tx:ob});
  this.conn.send(JSON.stringify(ob));
};

// calls the rxHandler with the next received message
WrappedWebSocket.prototype.expect = function(expected, rxHandler) {
  this.log.push({ex:expected});
  if (this.rxHandler) {
    throw new Error(this.name + ': websocket already has a data handler which has not been called, expected: ' + JSON.stringify(this.expected));
  }
  console.log(this.name + ' ex: ' + JSON.stringify(expected));
  this.rxHandler = rxHandler;
  this.expected = expected;
};

// make sure nothing is received for <timeout> milliseconds, then call timeoutHandler
WrappedWebSocket.prototype.wait = function(timeout, timeoutHandler) {
  let t = setTimeout(timeoutHandler, timeout);
  this.expect((data) => {
    clearTimeout(t);
    this.cancelExpect();
    throw new Error('unexpected data');
  });
};

WrappedWebSocket.prototype.cancelExpect = function() {
  if (this.rxHandler) {
    this.rxHandler = false;
    this.expected = false;
    return;
  }
  throw new Error('no rxHandler to cancel');
};

function klone(ob) {
  return JSON.parse(JSON.stringify(ob));
}

describe('pubsub', function() {
  it('should work for a simple two user test case', function(done) {
    let conn_a;
    let conn_b;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_a = new WrappedWebSocket('conn_a', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_b = new WrappedWebSocket('conn_b', 'ws://localhost:8888/pubsub', next()),
      // log in user_a on the first and user_b on the second (no auth yet)
      () => conn_a.send({login: {username: 'user_a'}}, {logged_in: true}, parallel()),
      () => conn_b.send({login: {username: 'user_b'}}, {logged_in: true}, next()),
      // subscribe user_a to channel_0 and channel_1, subscribe user_b to just channel 0
      () => conn_a.send({subscribe: {channel: '#channel_0'}}, {subscribed: {channel: '#channel_0'}}, next()),
      () => conn_b.send({subscribe: {channel: '#channel_0'}}, {subscribed: {channel: '#channel_0'}}, next()),
      () => conn_a.send({subscribe: {channel: '#channel_1'}}, {subscribed: {channel: '#channel_1'}}, next()),
      // user_a publishes on channel_0, both user_a and user_b receive the data
      () => conn_a.send({publish: {channel: '#channel_0', data: 'first on channel 0'}},
              {published: {username:'user_a', channel: '#channel_0', data: 'first on channel 0'}}, next()
            ),
      () => conn_b.expect({published: {username:'user_a', channel: '#channel_0', data: 'first on channel 0'}}, next()),
      // user_a publishes on channel_1, only user_a receives the data
      // (if user_b got a copy, it would cause a later test to fail, as this data is not expected)
      () => conn_a.send({publish: {channel: '#channel_1', data: 'first on channel 1'}},
              {published: {username:'user_a', channel: '#channel_1', data: 'first on channel 1'}}, next()
            ),
      // user_b publishes on channel_0, both user_a and user_b receive the data
      () => conn_a.expect({published: {username:'user_b', channel: '#channel_0', data: 'second on channel 0'}}, parallel()),
      () => conn_b.send({publish: {channel: '#channel_0', data: 'second on channel 0'}},
              {published: {username:'user_b', channel: '#channel_0', data: 'second on channel 0'}}, next()
            ),
      // the end
      () => done()
    ];

    // run the async actions in sequence
    let i = 0;
    let outstanding = 1;
    function next() {
      outstanding++;
      return possiblyContinue;
    }
    function possiblyContinue() {
      assert(outstanding > 0);
      outstanding--;
      if (outstanding === 0) {
        process.nextTick(steps[i]);
        //console.log(`running ${i}: ${steps[i]}`);
        i++;
      } else {
        console.log(`waiting for ${outstanding} more callbacks before continuing`);
      }
    }
    // and allow some actions to run in parallel with others
    function parallel() {
      outstanding++;
      process.nextTick(steps[i]); // run the next step, in parallel
      //console.log(`parallel running ${i}: ${steps[i]}`);
      i++;
      return possiblyContinue;
    }
    possiblyContinue(); // start running steps

  });
});

