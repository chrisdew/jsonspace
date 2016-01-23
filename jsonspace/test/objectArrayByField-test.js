"use strict";

/**
 * Created by chris on 07/12/2015.
 */

var assert = require('assert');
var oabf = require('../lib/query/objectArrayByField');

describe('objectArrayByField', function() {
  it('should work', function() {
    let query = new oabf.Query('foo$bar', 'foo', 'unfoo', 'bar');

    const obs = [
      {foo:{bar:'a',baz:'conn0'}},
      {foo:{bar:'a',baz:'conn1'}},
      {foo:{bar:'b',baz:'conn0'}}
    ];

    query.put(obs[0]);
    query.put(obs[1]);
    query.put(obs[2]);
    assert.deepEqual([
      {
        "foo": {
          "bar": "a",
          "baz": "conn0"
        }
      },
      {
        "foo": {
          "bar": "a",
          "baz": "conn1"
        }
      }
    ], query.results('a'));

    assert.deepEqual([
      { foo: { bar: 'a', baz: 'conn0' } },
      { foo: { bar: 'a', baz: 'conn1' } },
      { foo: { bar: 'b', baz: 'conn0' } }
    ], query.getReferences());

    // FIXME: there is some code which is checking object identity, when it should be checking object value, so the
    // references below are currently necessary.
    const unobs = [
      {unfoo:obs[0].foo},
      {unfoo:obs[1].foo},
      {unfoo:obs[2].foo}
    ];

    query.put(unobs[0]);
    assert.deepEqual([
      {
        "foo": {
          "bar": "a",
          "baz": "conn1"
        }
      }
    ], query.results('a'));


  });

});


