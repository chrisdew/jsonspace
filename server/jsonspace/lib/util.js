"use strict";

/**
 * Created by chris on 14/12/2015.
 */

function firstNonIdPropertyName(ob) {
  let p = null;
  for (p in ob) {
    if (p != 'id') {
      break;
    }
  }
  return p;
}

// make a deep clone of the object
function klone(ob) {
  return JSON.parse(JSON.stringify(ob));
}

// FIXME: this is broken if the objects are equal, but fields were added in a different order
function deepEqual(a, b) {
  return (JSON.stringify(a) === JSON.stringify(b));
}

exports.klone = klone;
exports.firstNonIdPropertyName = firstNonIdPropertyName;
exports.deepEqual = deepEqual;

