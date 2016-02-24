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
      throw new Error(this.name + ' unexpected data: ' + JSON.stringify(data));
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
        joined: { username: 'user_a', channel: '#channel_0', extra: 'a_on_0'}
      }, next()),
      () => conn_a.expect({members: {channel: '#channel_0', list:[{username: "user_a", extra: "a_on_0"}]}}, next()),
      () => conn_a.expect({joined: {username: 'user_b', channel: '#channel_0', extra: 'b_on_0'}}, parallel()),
      () => conn_b.send({subscribe: {username: 'user_b', channel: '#channel_0', extra: 'b_on_0'}}, {
        joined: { username: 'user_b', channel: '#channel_0', extra: 'b_on_0'}
      }, next()),
      () => conn_b.expect({members: {channel: '#channel_0', list:[{username: "user_a", extra: "a_on_0"}, {username: "user_b", extra: "b_on_0"}]}}, next()),
      () => conn_a.send({subscribe: {username: 'user_a', channel: '#channel_1', extra: 'a_on_1'}}, {
        joined: { username: 'user_a', channel: '#channel_1', extra: 'a_on_1'}
      }, next()),
      () => conn_a.expect({members: {channel: '#channel_1', list:[{username: "user_a", extra: "a_on_1"}]}}, next()),
      // user_a publishes on channel_0, only user_b will receive the data, as there is no echo
      () => conn_b.expect({
        published: {
          username: 'user_a',
          channel: '#channel_0',
          data: 'first on channel 0'
        }
      }, parallel()),
      //() => conn_a.send({publish: {channel: '#channel_0', data: 'first on channel 0'}},
      //  {published: {username: 'user_a', channel: '#channel_0', data: 'first on channel 0'}}, next()
      //),
      () => { conn_a.send({publish: {channel: '#channel_0', data: 'first on channel 0'}}); next()(); },
      // user_a publishes on channel_1, only user_a receives the data
      // (if user_b got a copy, it would cause a later test to fail, as this data is not expected)
      //() => conn_a.send({publish: {channel: '#channel_1', data: 'first on channel 1'}},
      //  {published: {username: 'user_a', channel: '#channel_1', data: 'first on channel 1'}}, next()
      //),
      () => { conn_a.send({publish: {channel: '#channel_1', data: 'first on channel 1'}}); next()(); },
      // user_b publishes on channel_0, both user_a and user_b receive the data
      () => conn_a.expect({published: {username: 'user_b', channel: '#channel_0', data: 'second on channel 0'}},
        parallel()),
      //() => conn_b.send({publish: {channel: '#channel_0', data: 'second on channel 0'}},
      //  {published: {username: 'user_b', channel: '#channel_0', data: 'second on channel 0'}}, next()
      //),
      () => { conn_b.send({publish: {channel: '#channel_0', data: 'second on channel 0'}}); next()(); },
      () => conn_b.send({watch: {username: "user_b", channel: '#channel_1'}}, {
        members: {channel: "#channel_1", list:[{username: "user_a", extra: "a_on_1"}]}
      }, next()),
      // close one of the members and make sure that they are removed form the subscriber objectArrayByField query
      // results
      () => conn_b.expect({left: {username: 'user_a', channel: '#channel_0', extra: 'a_on_0'}}, parallel()),
      () => conn_a.close(next()),
      // TODO: find a way to let a connection expect more than one message, as the line below would make more sense
      // if placed earlier
      () => conn_b.expect({left: {username: "user_a", channel: "#channel_1", extra: "a_on_1"}}, next()),
      // if we send more data, before the server realises that the first websocket is closed, we get a harmless error,
      // so wait 100ms, just to make the results neat
      () => setTimeout(next(), 100),
      //() => conn_b.send({publish: {channel: '#channel_0', data: 'third on channel 0'}},
      //  {published: {username: 'user_b', channel: '#channel_0', data: 'third on channel 0'}}, next()
      //),
      () => { conn_b.send({publish: {channel: '#channel_0', data: 'third on channel 0'}}); next()(); },
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
        members: {channel: '#channel_2', list:[]}
      }, next()),
      () => conn_c.expect({joined: {username: 'user_d', channel: '#channel_2', extra: 'd_on_2'}}, parallel()),
      () => conn_d.send({subscribe: {username: 'user_d', channel: '#channel_2', extra: 'd_on_2'}}, {
        joined: { username: 'user_d', channel: '#channel_2', extra: 'd_on_2' }
      }, next()),
      () => conn_d.expect({members: {channel: '#channel_2', list:[{username: 'user_d', extra: 'd_on_2'}]}}, next()),
      // close one of the members and make sure that they are removed form the subscriber objectArrayByField query
      // results
      () => conn_c.expect({left: {username: 'user_d', channel: '#channel_2', extra: 'd_on_2'}}, parallel()),
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
        members:{channel: '#channel_3', list:[]}
      }, next()),
      () => conn_e.expect({joined: {username: 'user_f', channel: '#channel_3', extra: 'f_on_3'}}, parallel()),
      () => conn_f.send({subscribe: {username: 'user_f', channel: '#channel_3', extra: 'f_on_3'}}, {
        joined: { username: 'user_f', channel: '#channel_3', extra: 'f_on_3' }
      }, next()),
      () => conn_f.expect({members:{channel: '#channel_3', list:[{"username": "user_f", "extra": "f_on_3"}]}}, next()),
      () => conn_e.expect({left: {username: 'user_f', channel: '#channel_3', extra: 'f_on_3'}}, parallel()),
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
  it('should work', function (done) {
    let conn_g;
    let conn_h;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_g = new WrappedWebSocket('conn_g', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_h = new WrappedWebSocket('conn_h', 'ws://localhost:8888/pubsub', next()),
      () => conn_g.send({watch: {username: "user_g", channel: '#channel_4'}}, {
        members: {channel: '#channel_4', list: []}
      }, next()),
      () => {
        conn_g.send({unwatch: {username: "user_g", channel: '#channel_4'}});
        next()();
      },
      () => conn_h.send({subscribe: {username: 'user_h', channel: '#channel_4', extra: 'h_on_4'}}, {
        joined: { username: 'user_h', channel: '#channel_4', extra: 'h_on_4' }
      }, next()),
      () => conn_h.expect({members: {channel: '#channel_4', list: [{username: "user_h" , extra: "h_on_4"}]}}, next()),
      // conn_g should receive nothing in response to conn_h subscribing, as it has unwatched
      () => conn_g.wait(100, parallel()),
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
        members: {channel: '#channel_5', list:[]}
      }, next()),
      () => conn_i.expect({joined: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, parallel()),
      () => conn_j.send({subscribe: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, {
        joined: { username: 'user_j', channel: '#channel_5', extra: 'j_on_5' }
      }, next()),
      () => conn_j.expect({members: {channel: '#channel_5', list:[{username: "user_j", extra: "j_on_5"}]}}, next()),
      // conn_i should not be told about the new subscription, as it is being made by user_j, who has already joined
      () => conn_i.wait(100, parallel()),
      () => conn_k.send({subscribe: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, {
        members: {channel: '#channel_5', list:[{username: 'user_j', extra: 'j_on_5'}]}
      }, next()),
      // conn_i should not be told about the new unsubscribe, as it is being made by user_j, who has still has a one subscription left
      () => conn_i.wait(100, parallel()),
      () => { conn_j.send({unsubscribe: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}); next()(); },
      // conn_i should be told about the *final* unsubscription of user_j
      () => conn_i.expect({left: {username: 'user_j', channel: '#channel_5', extra: 'j_on_5'}}, parallel()),
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

describe('updated_extra', function() {
  it('should work', function (done) {
    let conn_l;
    let conn_m;
    let conn_n;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_l = new WrappedWebSocket('conn_l', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_m = new WrappedWebSocket('conn_m', 'ws://localhost:8888/pubsub', parallel()),
      () => conn_n = new WrappedWebSocket('conn_n', 'ws://localhost:8888/pubsub', next()),
      () => conn_l.send({watch: {username: "user_l", channel: '#channel_6'}}, {
        members: {channel: '#channel_6', list: []}
      }, next()),
      () => conn_l.expect({joined: {username: 'user_m', channel: '#channel_6', extra: 'm_on_6'}}, parallel()),
      () => conn_m.send({subscribe: {username: 'user_m', channel: '#channel_6', extra: 'm_on_6'}}, {
        joined: { username: 'user_m', channel: '#channel_6', extra: 'm_on_6' }
      }, next()),
      () => conn_m.expect({members: {channel: '#channel_6', list: [{username: 'user_m', extra: 'm_on_6'}]}}, next()),
      // conn_l should not be told about the new subscription, as it is being made by user_m, who has already joined
      // but should be told about the updated_extra
      () => conn_l.expect({ updated_extra: { username: 'user_m', channel: '#channel_6', extra: 'm_on_6_updated' }}, parallel()),
      () => conn_m.expect({ updated_extra: { username: 'user_m', channel: '#channel_6', extra: 'm_on_6_updated' }}, parallel()),
      () => conn_n.send({subscribe: {username: 'user_m', channel: '#channel_6', extra: 'm_on_6_updated'}}, {
        members: {channel: '#channel_6', list: [{username: 'user_m', extra: 'm_on_6_updated'}]}
      }, next()),
      // conn_l should not be told about the new unsubscribe, as it is being made by user_m, who has still has a one subscription left
      () => conn_l.wait(100, parallel()),
      () => { conn_m.send({unsubscribe: {username: 'user_m', channel: '#channel_6'}}); next()(); },
      // conn_l should be told about the *final* unsubscription of user_m
      () => conn_l.expect({left: {username: 'user_m', channel: '#channel_6', extra: 'm_on_6_updated'}}, parallel()),
      () => { conn_n.send({unsubscribe: {username: 'user_m', channel: '#channel_6'}}); next()(); },
      () => conn_l.close(next()),
      () => conn_m.close(next()),
      () => conn_n.close(next()),
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



  describe('published_since', function() {
    it('should cause old message to be sent when subscribing', function (done) {
      let conn_o;
      let conn_p;
      let conn_q;

      const steps = [
        // make two separate websocket connections to the server
        () => conn_o = new WrappedWebSocket('conn_o', 'ws://localhost:8888/pubsub', next()),
        () => conn_o.send({subscribe: {username: 'user_o', channel: '#channel_7', extra: 'o_on_7'}}, {
          joined: { username: 'user_o', channel: '#channel_7', extra: 'o_on_7' }
        }, next()),
        () => conn_o.expect({members: {channel: '#channel_7', list: [{username: "user_o", extra: "o_on_7"}]}}, next()),
        () => {
          conn_o.send({publish: {channel: '#channel_7', data: 'first on channel 7'}});
          next()();
        },
        () => conn_o.close(next()),
        () => setTimeout(next(), 200), // wait for socket to close
        () => conn_p = new WrappedWebSocket('conn_p', 'ws://localhost:8888/pubsub', next()),
        () => conn_p.send({
          subscribe: {
            username: 'user_p',
            channel: '#channel_7',
            extra: 'p_on_7',
            published_since: '1970-01-01T00:00:00.000Z'
          }
        }, {
          joined: { username: 'user_p', channel: '#channel_7', extra: 'p_on_7' }
        }, next()),
        () => conn_p.expect({members: {channel: '#channel_7', list: [{username: "user_p", extra: "p_on_7"}]}}, next()),
        () => conn_p.expect({
          published: {
            username: 'user_o',
            channel: '#channel_7',
            data: 'first on channel 7'
          }
        }, next()),
        () => conn_p.close(next()),
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


describe("upgrading shouldn't cause a new list of members to be sent", function() {
  it('should work', function (done) {
    let conn_r;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_r = new WrappedWebSocket('conn_r', 'ws://localhost:8888/pubsub', next()),
      () => conn_r.send({watch: {username: "user_r", channel: '#channel_8'}}, {
        members: {channel: '#channel_8', list: []}
      }, next()),
      () => conn_r.send({subscribe: {username: 'user_r', channel: '#channel_8', extra: 'r_on_8'}}, {
        joined: {username: 'user_r', channel: '#channel_8', extra: 'r_on_8'}
      }, next()),
      () => setTimeout(next(), 1000), // don't finish the test until we've allowed some time for a bad response
      () => conn_r.close(next()),
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


describe("user list should only contain the latest subscriptions for each username", function() {
  it('should work', function (done) {
    let conn_s;
    let conn_t;
    let conn_u;

    const steps = [
      // make two separate websocket connections to the server
      () => conn_s = new WrappedWebSocket('conn_s', 'ws://localhost:8888/pubsub', next()),
      () => conn_t = new WrappedWebSocket('conn_t', 'ws://localhost:8888/pubsub', next()),
      () => conn_u = new WrappedWebSocket('conn_u', 'ws://localhost:8888/pubsub', next()),
      () => conn_s.send({subscribe: {username: "user_s", channel: '#channel_9', extra: 's_on_9'}}, {
        joined: { username: 'user_s', channel: '#channel_9', extra: 's_on_9' }
      }, next()),
      () => conn_s.expect({members: {channel: '#channel_9', list: [{"extra": "s_on_9", "username": "user_s"}]}}, next()),
      () => conn_t.send({subscribe: {username: "user_s", channel: '#channel_9', extra: 's_on_9'}}, {
        members: {channel: '#channel_9', list: [{"extra": "s_on_9", "username": "user_s"}]}
      }, next()),
      () => conn_u.send({watch: {username: "user_u", channel: '#channel_9', extra: 'u_on_9'}}, {
        members: {channel: '#channel_9', list: [{"extra": "s_on_9", "username": "user_s"}]}
      }, next()),
      () => conn_s.close(next()),
      () => conn_t.close(next()),
      () => conn_u.close(next()),
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

