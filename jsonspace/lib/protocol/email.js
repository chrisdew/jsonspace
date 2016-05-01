"use strict";

/**
 * Created by chris on 27/04/2016.
 */
const nm = require('nodemailer');
const u = require('../util');

function listen(ob, put, getReferences) {
  console.log('email LISTEN', ob.protocol.email.listen.transport);
  var transport = nm.createTransport(ob.protocol.email.listen.transport);
  var from = ob.protocol.email.listen.email.from;
  var to = ob.protocol.email.listen.email.to;

  function send(ob, put) {
    const email = u.klone(ob.email_obj_tx);
    if (!email.from) email.from = from;
    if (!email.to) email.to = to;
    transport.sendMail(email);
  }

  /*
   * just a test
   *
  setTimeout(function() {
    put({
      email_obj_tx: {
        subject: 'alert',
        text: 'alert',
        html: '<b>alert</b>'
      }
    });
  }, 3000);
   */

  return {type:'email_obj_tx', send:send};
}

function start(ob, put, pool) {
}



exports.listen = listen;
exports.start = start;