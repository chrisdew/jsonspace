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
}

function klone(ob) {
  return JSON.parse(JSON.stringify(ob));
}

describe('blackboard', function() {
  it('should have no rules', function() {
    let blackboard = new bb.Blackboard();
    assert.deepEqual(blackboard._rules.length, 0);
  });

  it('should drop objects which match a dropping rule', function() {
    let blackboard = new bb.Blackboard();
    let dropFooRule = function(ob) { if (ob.foo) return true; };
    let catchAllQuery = new CatchAllQuery();
    blackboard.pushRule(dropFooRule);
    blackboard.pushQuery(catchAllQuery);

    blackboard.put({id:"0", foo: true});
    assert.deepEqual(catchAllQuery.getReferences()["0"], undefined);

    blackboard.put({id:"1", bar: true});
    assert.deepEqual(catchAllQuery.getReferences()["1"], {id:"1", bar: true});
  });

  it('should asynchronously put new objects', function(done) {
    let blackboard = new bb.Blackboard();
    let foosToBarsRule = function(ob, put) {
      if (!ob.foo) return false;
      put({id:"2", bar:ob.foo});
      return true;
    };
    let catchAllQuery = new CatchAllQuery();
    blackboard.pushRule(foosToBarsRule);
    blackboard.pushQuery(catchAllQuery);

    blackboard.put({id:"0", foo: true});
    assert.deepEqual(catchAllQuery.getReferences()["0"], undefined);
    setTimeout(function() { // this will run after nextTick
      assert.deepEqual(catchAllQuery.getReferences()["2"], {id: "2", bar: true});
      done();
    },
    1);

  });
});


