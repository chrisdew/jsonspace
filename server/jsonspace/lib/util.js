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

exports.klone = klone;
exports.firstNonIdPropertyName = firstNonIdPropertyName;

