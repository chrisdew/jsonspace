"use strict";

/**
 * Created by chris on 19/12/2015.
 */

var assert = require('assert');
var ws = require('ws');
var Step  = require('step');

// WrappedWebSocket is a convenience class for testing purposes only
function WrappedWebSocket(url, connectedCallback) {
  this.conn = new ws(url);
  this.log = []; //{tx:...} or {rx:...};
  this.tx = [];
  this.rx = [];
  this.rxHandler = false;
  this.conn.on('open', connectedCallback);
  this.conn.on('message', (message) => {
    let data = JSON.stringify(message);
    this.rx.push(data);
    this.log.push({rx:data});
    if (this.rxHandler) {
      this.rxHandler(data);
      this.rxHandler = false;
    }
  });
}

// send a JSON object and optionally
WrappedWebSocket.prototype.send = function(ob, rxHandler) {
  if (rxHandler) {
    this.expect(rxHandler);
  }
  this.tx.push(ob);
  this.log.push({tx:ob});
  this.conn.send(JSON.stringify(ob));
};

// calls the rxHandler with the next received message
WrappedWebSocket.prototype.expect = function(rxHandler) {
  this.log.push({ex:true});
  if (this.rxHandler) {
    throw new Error('websocket already has a data handler which has not been called')
  }
  this.rxHandler = rxHandler;
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
    return;
  }
  throw new Error('no rxHandler to cancel');
};

describe('pubsub', function() {
  it('should work for a simple two user test case', function(done) {
    let conn_a;
    let conn_b;
    Step(
      // make two separate websocket connections to the server
      function connect() {
        conn_a = new WrappedWebSocket('ws://localhost:8000/pubsub', this.parallel());
        conn_b = new WrappedWebSocket('ws://localhost:8000/pubsub', this.parallel());
      },
      // log in user_a on the first and user_b on the second (no auth yet)
      function login(err) {
        if (err) throw err;
        conn_a.send({login: {username: 'user_a'}}, (response) => {
          assertDeepEqual({logged_in: true}, response);
          this.parallel();
        });
        conn_b.send({login: {username: 'user_b'}}, (response) => {
          assertDeepEqual({logged_in: true}, response);
          this.parallel();
        });
      },
      // subscribe user_a to channel_0 and channel_1, subscribe user_b to just channel 0
      function subscribe(err) {
        if (err) throw err;
        conn_a.send({subscribe: {channel: '#channel_0'}}, (response) => {
          assertDeepEqual({subscribed: {channel: '#channel_0'}}, response);
          this.parallel();
        });
        conn_a.send({subscribe: {channel: '#channel_1'}}, (response) => {
          assertDeepEqual({subscribed: {channel: '#channel_1'}}, response);
          this.parallel();
        });
        conn_b.send({subscribe: {channel: '#channel_0'}}, (response) => {
          assertDeepEqual({subscribed: {channel: '#channel_0'}}, response);
          this.parallel();
        });
      },
      // user_a publishes on channel_0, both user_a and user_b receive the data
      function publish(err) {
        if (err) throw err;
        conn_a.send({publish: {channel: '#channel_0', data: 'first on channel 0'}}, (response) => {
          assertDeepEqual({published: {username:'user_a', channel: '#channel_0', data: 'first on channel 0'}}, response);
          this.parallel();
        });
        conn_b.expect((data) => {
          assertDeepEqual({published: {username:'user_a', channel: '#channel_0', data: 'first on channel 0'}}, data);
          this.parallel();
        });
      },
      // user_a publishes on channel_1, only user_a receives the data, wait on user_b's connection to make sure they
      // don't get a copy
      function publish(err) {
        if (err) throw err;
        conn_a.send({publish: {channel: '#channel_1', data: 'first on channel 1'}}, (response) => {
          assertDeepEqual({published: {username:'user_a', channel: '#channel_1', data: 'first on channel 1'}}, response);
          this.parallel();
        });
        conn_b.wait(500, () => {
          this.parallel();
        });
      },
      // user_b publishes on channel_0, both user_a and user_b receive the data
      function publish(err) {
        if (err) throw err;
        conn_b.send({publish: {channel: '#channel_0', data: 'second on channel 0'}}, (response) => {
          assertDeepEqual({published: {username:'user_b', channel: '#channel_0', data: 'second on channel 0'}}, response);
          this.parallel();
        });
        conn_a.expect((data) => {
          assertDeepEqual({published: {username:'user_b', channel: '#channel_0', data: 'second on channel 0'}}, data);
          this.parallel();
        });
      },
      // the end
      function end(err) {
        if (err) throw err;
        done();
      }
    );
  });
});
