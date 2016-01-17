"use strict";

/**
 * Created by chris on 07/12/2015.
 */

var assert = require('assert');
var obf = require('../lib/query/objectByField');

describe('objectByField', function() {
  it('should work', function() {
    let query = new obf.Query('foo$bar', 'foo', 'unfoo', 'bar');

    const obs = [
      {foo:{bar:'a',baz:'conn0'}},
      {foo:{bar:'a',baz:'conn1'}},
      {foo:{bar:'b',baz:'conn0'}}
    ];

    query.put(obs[0]);
    query.put(obs[1]);
    query.put(obs[2]);
    assert.deepEqual({
      "foo": {
        "bar": "a",
        "baz": "conn1"
      }
    }, query.result('a'));

    // references below are currently necessary.
    const unobs = [
      {unfoo:obs[0].foo},
      {unfoo:obs[1].foo},
      {unfoo:obs[2].foo}
    ];

    query.put(unobs[0]);
    // unobs[0].foo is *not* the currently referenced message, so its unmessage should have no effect
    assert.deepEqual({
      "foo": {
        "bar": "a",
        "baz": "conn1"
      }
    }, query.result('a'));

    query.put(unobs[1]);
    assert.deepEqual(undefined, query.result('a'));

  });

});


