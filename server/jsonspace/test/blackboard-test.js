"use strict";

/**
 * Created by chris on 07/12/2015.
 */

var assert = require('assert');
var bb = require('../lib/blackboard');

class CatchAllQuery {
  constructor() {
    this._objects = {}
  }

  put(ob) {
    this._objects[ob.id] = ob;
  }

  getReferences() {
    return klone(this._objects);
  }

  getResult() {
    return klone(this._objects);
  }
}

class CounterQuery {
  constructor(prop) {
    this._prop = prop;
    this._objects = {};
    this._count = 0;
  }

  put(ob) {
    if (!ob[this._prop]) return;
    this._count++;
    this._objects[ob.id] = ob;
  }

  getReferences() {
    return klone(this._objects);
  }

  getResult() {
    return this._count;
  }
}

function klone(ob) {
  return JSON.parse(JSON.stringify(ob));
}

describe('blackboard', function() {
  it('should have no rules', function() {
    let blackboard = new bb.Blackboard();
    assert.deepEqual(blackboard._rules, {});
  });

  it('should drop objects which match a dropping rule', function() {
    let blackboard = new bb.Blackboard();
    let dropFooRule = function(ob) { if (ob.foo) return true; };
    let catchAllQuery = new CatchAllQuery();
    blackboard.pushRule('foo', dropFooRule);
    blackboard.pushQuery(catchAllQuery);

    blackboard.put({id:"0",foo:{some:'data'}});
    assert.deepEqual(catchAllQuery.getReferences()["0"], undefined);

    blackboard.put({id:"1",bar:{some:'data'}});
    assert.deepEqual(catchAllQuery.getReferences()["1"], {id:"1",bar:{some:'data'}});
  });

  it('should asynchronously put new objects', function(done) {
    let blackboard = new bb.Blackboard();
    let foosToBarsRule = function(ob, put) {
      if (!ob.foo) return false;
      put({id:"2", bar:ob.foo});
      return true;
    };
    let catchAllQuery = new CatchAllQuery();
    blackboard.pushRule('foo', foosToBarsRule);
    blackboard.pushQuery(catchAllQuery);

    blackboard.put({id:"0",foo:{some:'data'}});
    assert.deepEqual(catchAllQuery.getReferences()["0"], undefined);
    setTimeout(function() { // this will run after nextTick
      assert.deepEqual(catchAllQuery.getReferences()["2"], {id:"2",bar:{some:'data'}});
      done();
    }, 1);

  });

  it('should be able to report the queries references, for replication', function() {
    let blackboard = new bb.Blackboard();
    let fooCounter = new CounterQuery('foo');
    let barCounter = new CounterQuery('bar');
    blackboard.pushQuery(fooCounter);
    blackboard.pushQuery(barCounter);

    blackboard.put({id:"0",foo: true});
    blackboard.put({id:"1",foo: true, bar: true});
    blackboard.put({id:"2",baz: true});
    blackboard.put({id:"3",quux: true});

    assert.deepEqual(fooCounter.getResult(), 2);
    assert.deepEqual(barCounter.getResult(), 1);

    assert.deepEqual(fooCounter.getReferences(), { '0': { id: '0', foo: true }, '1': { id: '1', foo: true, bar: true } });
    assert.deepEqual(barCounter.getReferences(), { '1': { id: '1', foo: true, bar: true } });
    assert.deepEqual(blackboard.getReferences(), { '0': { id: '0', foo: true }, '1': { id: '1', foo: true, bar: true } });

  });
});


