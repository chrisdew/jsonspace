"use strict";

/**
 * Created by chris on 07/12/2015.
 */

var assert = require('assert');
var obf = require('../lib/query/objectByTwoFields');

describe('objectByField', function() {
  it('should work', function() {
    let query = new obf.Query('foo$bar', 'foo', 'unfoo', 'bar', 'baz');

    const obs = [
      {foo:{bar:'a',baz:'conn0',quux:'0'}},
      {foo:{bar:'a',baz:'conn1',quux:'1'}},
      {foo:{bar:'b',baz:'conn0',quux:'2'}}
    ];

    query.put(obs[0]);
    query.put(obs[1]);
    query.put(obs[2]);
    assert.deepEqual({
      "foo": {
        "bar": "a",
        "baz": "conn0",
        "quux": "0"
      }
    }, query.result('a', 'conn0'));

  });

});


