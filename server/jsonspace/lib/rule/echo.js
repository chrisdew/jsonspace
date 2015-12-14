"use strict";

/**
 * Created by chris on 14/12/2015.
 *
 * This rule consumes _rx obs and puts back _tx obs, causing an echo.
 */

const u = require('../util');

function exec(ob, put) {
  const obName = u.firstNonIdPropertyName(ob);
  if (obName.endsWith('_rx')) {
    const newObName = obName.substring(0, obName.length - 2) + 'tx';
    const newOb = {};
    newOb[newObName] = ob[obName];
    put(newOb);
    return true;
  }
}

exports.exec = exec;