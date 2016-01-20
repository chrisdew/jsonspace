"use strict";

function exec(ob, put, queries) {
  if (!ob.dns_request || !ob.dns_request.request_id) return;

  let answer = [
    {a:{name:ob.dns_request.question[0].name,address:'127.0.0.1',ttl:600}}
  ];
  put({dns_response:{request_id:ob.dns_request.request_id,answer:answer}});

}

exports.exec = exec;