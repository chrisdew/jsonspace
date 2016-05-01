"use strict";

function exec(ob, put, queries, isRemote) {
  if (!ob.replicate_error) return;

  put({"email_obj_tx":{"subject":"Replicate Server reports Client Connection Error","text":JSON.stringify(ob,null,2)}});
}

exports.exec = exec;
