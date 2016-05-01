"use strict";

function exec(ob, put, queries, isRemote) {
  if (!ob.replication_client_disconnected) return;

  put({"email_obj_tx":{"subject":"Replication Client reports Disconnected from Server","text":JSON.stringify(ob,null,2)}});
}

exports.exec = exec;
