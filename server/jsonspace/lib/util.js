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

exports.firstNonIdPropertyName = firstNonIdPropertyName;

