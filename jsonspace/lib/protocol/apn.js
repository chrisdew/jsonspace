"use strict";

const apn = require('apn');

function listen(ob, put, getReferences) {
  console.log('LISTEN', ob.protocol.apn.listen.options);
  var apnConnection = new apn.Connection(ob.protocol.apn.listen.options);

  function send(ob, put) {
    console.log('SEND');
    var myDevice = new apn.Device(ob.apn_obj_tx.token);
    var note = new apn.Notification();

    note.expiry = ob.apn_obj_tx.expiry ? ob.apn_obj_tx.expiry : Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = ob.apn_obj_tx.badge ? ob.apn_obj_tx.badge : 3;
    note.sound = ob.apn_obj_tx.sound ? ob.apn_obj_tx.sound : "ping.aiff";
    note.alert = ob.apn_obj_tx.alert ? ob.apn_obj_tx.alert : "\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = ob.apn_obj_tx.payload ? ob.apn_obj_tx.payload : {};

    apnConnection.pushNotification(note, myDevice);

    console.log('SENT');
  }

  return {type:'apn_obj_tx', send:send};
}

function start(ob, put, pool) {
}




exports.listen = listen;
exports.start = start;
