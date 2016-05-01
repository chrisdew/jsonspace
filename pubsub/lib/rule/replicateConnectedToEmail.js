"use strict";

function exec(ob, put, queries, isRemote) {
  if (!ob.replicate_connected) return;

  put({"email_obj_tx":{"subject":"Replicate Server reports Client Connected","text":JSON.stringify(ob,null,2)}});
}

exports.exec = exec;
