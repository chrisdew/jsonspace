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
        // FIXME: handle all depths, as a separate, recursive, function
        // ignore id fields
        const tmp = klone(data);
        delete tmp.id;
        for (let p in tmp) {
          //console.log('p', p);
          if (tmp[p] instanceof Object) {
            delete tmp[p].id;
            for (let q in tmp[p]) {
              //console.log('q', q);
              if (tmp[p][q] instanceof Object) {
                delete tmp[p][q].id;
                for (let r in tmp[p][q]) {
                  //console.log('r', r);
                  if (tmp[p][q][r] instanceof Object) {
                    delete tmp[p][q][r].id;
                    for (let s in tmp[p][q][r]) {
                      //console.log('s', s);
                      if (tmp[p][q][r][s] instanceof Object) {
                        delete tmp[p][q][r][s].id;
                      }
                    }
                  }
                }
              }
            }
          }
        }
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

WrappedWebSocket.prototype.close = function(callback) {
  this.log.push({close:true});
  if (this.rxHandler) {
    throw new Error(this.name + ': websocket had a data handler at the time of closing, expected: ' + JSON.stringify(this.expected));
  }
  // FIXME: ws do not seem to accept a callback
  this.conn.close();
  process.nextTick(callback);
};

function klone(ob) {
  return JSON.parse(JSON.stringify(ob));
}

describe('pubsub', function() {
  it('should work for a simple two user test case', function (done) {
    let conn_a;
    let conn_b;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_a = new WrappedWebSocket('conn_a', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_b = new WrappedWebSocket('conn_b', 'ws://localhost:8888/pubsub', next()),
      // subscribe user_a to channel_0 and channel_1, subscribe user_b to just channel 0
      () => conn_a.send({subscribe: {username: 'user_a', channel: '#channel_0', extra: 'a_on_0'}}, {
        subscribers: {channel: '#channel_0', list:[]}
      }, next()),
      () => conn_a.expect({subscribed: {username: 'user_b', channel: '#channel_0', extra: 'b_on_0'}}, parallel()),
      () => conn_b.send({subscribe: {username: 'user_b', channel: '#channel_0', extra: 'b_on_0'}}, {
        subscribers: {channel: '#channel_0', list:[{username: "user_a", extra: "a_on_0"}]}
      }, next()),
      () => conn_a.send({subscribe: {username: 'user_a', channel: '#channel_1', extra: 'a_on_1'}}, {
        subscribers: {channel: '#channel_1', list:[]}
      }, next()),
      // user_a publishes on channel_0, both user_a and user_b receive the data
      () => conn_b.expect({
        published: {
          username: 'user_a',
          channel: '#channel_0',
          data: 'first on channel 0'
        }
      }, parallel()),
      () => conn_a.send({publish: {channel: '#channel_0', data: 'first on channel 0'}},
        {published: {username: 'user_a', channel: '#channel_0', data: 'first on channel 0'}}, next()
      ),
      // user_a publishes on channel_1, only user_a receives the data
      // (if user_b got a copy, it would cause a later test to fail, as this data is not expected)
      () => conn_a.send({publish: {channel: '#channel_1', data: 'first on channel 1'}},
        {published: {username: 'user_a', channel: '#channel_1', data: 'first on channel 1'}}, next()
      ),
      // user_b publishes on channel_0, both user_a and user_b receive the data
      () => conn_a.expect({published: {username: 'user_b', channel: '#channel_0', data: 'second on channel 0'}},
        parallel()),
      () => conn_b.send({publish: {channel: '#channel_0', data: 'second on channel 0'}},
        {published: {username: 'user_b', channel: '#channel_0', data: 'second on channel 0'}}, next()
      ),
      () => conn_b.send({watch: {username: "user_b", channel: '#channel_1'}}, {
        subscribers: {channel: "#channel_1", list:[{username: "user_a", extra: "a_on_1"}]}
      }, next()),
      // close one of the subscribers and make sure that they are removed form the subscriber objectArrayByField query
      // results
      () => conn_b.expect({unsubscribed: {username: 'user_a', channel: '#channel_0', extra: 'a_on_0'}}, parallel()),
      () => conn_a.close(next()),
      // TODO: find a way to let a connection expect more than one message, as the line below would make more sense
      // if placed earlier
      () => conn_b.expect({unsubscribed: {username: "user_a", channel: "#channel_1", extra: "a_on_1"}}, next()),
      // if we send more data, before the server realises that the first websocket is closed, we get a harmless error,
      // so wait 100ms, just to make the results neat
      () => setTimeout(next(), 100),
      () => conn_b.send({publish: {channel: '#channel_0', data: 'third on channel 0'}},
        {published: {username: 'user_b', channel: '#channel_0', data: 'third on channel 0'}}, next()
      ),
      () => conn_b.close(next()),
      // the end
      done
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

describe('watch', function() {
  it('should work', function (done) {
    let conn_c;
    let conn_d;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_c = new WrappedWebSocket('conn_c', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_d = new WrappedWebSocket('conn_d', 'ws://localhost:8888/pubsub', next()),
      () => conn_c.send({watch: {username: "user_c", channel: '#channel_2'}}, {
        subscribers: {channel: '#channel_2', list:[]}
      }, next()),
      () => conn_c.expect({subscribed: {username: 'user_d', channel: '#channel_2', extra: 'd_on_2'}}, parallel()),
      () => conn_d.send({subscribe: {username: 'user_d', channel: '#channel_2', extra: 'd_on_2'}}, {
        subscribers: {channel: '#channel_2', list:[]}
      }, next()),
      // close one of the subscribers and make sure that they are removed form the subscriber objectArrayByField query
      // results
      () => conn_c.expect({unsubscribed: {username: 'user_d', channel: '#channel_2', extra: 'd_on_2'}}, parallel()),
      () => conn_d.close(next()),
      // if we send more data, before the server realises that the first websocket is closed, we get a harmless error,
      // so wait 100ms, just to make the results neat
      () => setTimeout(next(), 100),
      () => conn_c.close(next()),
      // the end
      done
    ];

    // TODO: turn next and parallel into a module
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

describe('unsubscribe', function() {
  it('should work', function(done) {
    let conn_e;
    let conn_f;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_e = new WrappedWebSocket('conn_e', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_f = new WrappedWebSocket('conn_f', 'ws://localhost:8888/pubsub', next()),
      () => conn_e.send({watch: {username: "user_e", channel: '#channel_3'}}, {
        subscribers:{channel: '#channel_3', list:[]}
      }, next()),
      () => conn_e.expect({subscribed: {username: 'user_f', channel: '#channel_3', extra: 'f_on_3'}}, parallel()),
      () => conn_f.send({subscribe: {username: 'user_f', channel: '#channel_3', extra: 'f_on_3'}}, {
        subscribers:{channel: '#channel_3', list:[]}
      }, next()),
      () => conn_e.expect({unsubscribed: {username: 'user_f', channel: '#channel_3', extra: 'f_on_3'}}, parallel()),
      () => { conn_f.send({unsubscribe: {username: 'user_f', channel: '#channel_3', extra: 'f_on_3'}}); next()(); },
      () => conn_e.close(next()),
      () => conn_f.close(next()),
      // the end
      done
    ];

    // TODO: turn next and parallel into a module
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

describe('unwat_ch', function() {
  it('should work', function(done) {
    let conn_g;
    let conn_h;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_g = new WrappedWebSocket('conn_e', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_h = new WrappedWebSocket('conn_f', 'ws://localhost:8888/pubsub', next()),
      () => conn_g.send({watch: {username: "user_g", channel: '#channel_4'}}, {
        subscribers: {channel: '#channel_4', list:[]}
      }, next()),
      () => { conn_g.send({unwatch: {username: "user_g", channel: '#channel_4'}}); next()(); },
      // conn_h should receive nothing in response to conn_h subscribing, as it has unwatched
      () => conn_g.wait(100, parallel()),
      () => conn_h.send({subscribe: {username: 'user_h', channel: '#channel_4', extra: 'h_on_4'}}, {
        subscribers: {channel: '#channel_4', list:[]}
      }, next()),
      () => conn_g.close(next()),
      () => conn_h.close(next()),
      // the end
      done
    ];

    // TODO: turn next and parallel into a module
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

  describe('multisub', function() {
    it('should work', function(done) {
      let conn_i;
      let conn_j;
      let conn_k;

      const steps = [
        // make two separate websocket connections to the server
        () => conn_i = new WrappedWebSocket('conn_i', 'ws://localhost:8888/pubsub', parallel()),
        () => conn_j = new WrappedWebSocket('conn_j', 'ws://localhost:8888/pubsub', parallel()),
        () => conn_k = new WrappedWebSocket('conn_k', 'ws://localhost:8888/pubsub', next()),
        () => conn_i.send({watch: {username: "user_i", channel: '#channel_5'}}, {
          subscribers: {channel: '#channel_5', list:[]}
        }, next()),
        () => conn_i.expect({subscribed: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, parallel()),
        () => conn_j.send({subscribe: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, {
          subscribers: {channel: '#channel_5', list:[]}
        }, next()),
        // conn_i should not be told about the new subscription, as it is being made by user_j, who has already subscribed
        () => conn_i.wait(100, parallel()),
        () => conn_k.send({subscribe: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, {
          subscribers: {channel: '#channel_5', list:[{username: 'user_j', extra: 'j_on_5'}]}
        }, next()),
        // conn_i should not be told about the new unsubscribe, as it is being made by user_j, who has still has a one subscription left
        () => conn_i.wait(100, parallel()),
        () => { conn_j.send({unsubscribe: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}); next()(); },
        // conn_i shoulde be told about the *final* unsubscription of user_j
        () => conn_i.expect({unsubscribed: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, parallel()),
        () => { conn_k.send({unsubscribe: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}); next()(); },
        () => conn_i.close(next()),
        () => conn_j.close(next()),
        () => conn_k.close(next()),
        // the end
        done
      ];

      // TODO: turn next and parallel into a module
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
});

