"use strict";

function exec(ob, put, queries, isRemote) {
  if (!ob.replication_client_error) return;

  // only send email, if error is produced, once the reconnection delay has been pushed to its max
  if (!ob.replication_client_error.max_reconn_delay) return;

  put({"email_obj_tx":{"subject":"Replication Client reports Error connecting to Server","text":JSON.stringify(ob,null,2)}});
}

exports.exec = exec;
