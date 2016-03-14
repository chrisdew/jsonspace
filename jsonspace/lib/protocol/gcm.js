"use strict";

const gcm = require('node-gcm');

function listen(ob, put, getReferences) {
  console.log('GCM LISTEN', ob.protocol.gcm.listen.options);

  var sender = new gcm.Sender(ob.protocol.gcm.listen.options.key);

  function send(ob, put) {
    console.log('GCM SEND');

    var message = new gcm.Message({
      //collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      timeToLive: 3,
      restrictedPackageName: ob.gcm_obj_tx.payload ? ob.gcm_obj_tx.payload : null,
      //dryRun: true,
      data: ob.gcm_obj_tx.payload ? ob.gcm_obj_tx.payload : {},
      notification: {
        title: ob.gcm_obj_tx.title ? ob.gcm_obj_tx.title : "title",
        icon: ob.gcm_obj_tx.icon ? ob.gcm_obj_tx.icon : "ic_launcher",
        body: ob.gcm_obj_tx.body ? ob.gcm_obj_tx.body : "body"
      }
    });

    // TODO: this is made to work just like APN, even though sending individually is inefficient
    sender.sendNoRetry(message, { registrationTokens: [ob.gcm_obj_tx.token] }, function(err, response) {
      if (err) {
        console.error(err);
      } else {
        console.log(response);
      }
    });

    console.log('GCM SENT');
  }

  return {type:'gcm_obj_tx', send:send};
}

function start(ob, put, pool) {
}




exports.listen = listen;
exports.start = start;
