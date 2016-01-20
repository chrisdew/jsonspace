"use strict";

/**
 * Created by chris on 07/12/2015.
 */

var assert = require('assert');
var cb = require('../lib/circularBuffer');

describe('circularBuffer', function() {
  it('should work', function() {
    const buf = new cb.CircularBuffer(3);
    assert.deepEqual(buf.toArray(), []);
    buf.push('a');
    assert.deepEqual(buf.toArray(), ['a']);
    buf.push('x');
    assert.deepEqual(buf.toArray(), ['a', 'x']);
    buf.remove((a) => a === 'x');
    assert.deepEqual(buf.toArray(), ['a']);
    buf.push('b');
    assert.deepEqual(buf.toArray(), ['a', 'b']);
    buf.push('c');
    assert.deepEqual(buf.toArray(), ['a', 'b', 'c']);
    buf.push('d');
    assert.deepEqual(buf.toArray(), ['b', 'c', 'd']);
    buf.push('e');
    assert.deepEqual(buf.toArray(), ['c', 'd', 'e']);
    buf.remove((a) => a === 'd');
    assert.deepEqual(buf.toArray(), ['c', 'e']);
    buf.push('f');
    assert.deepEqual(buf.toArray(), ['c', 'e', 'f']);
  });
});


