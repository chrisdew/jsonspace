"use strict";

function exec(ob, put, queries) {
  if (!ob.dns_request || !ob.dns_request.request_id) return;

  const all = queries.heartbeat$host.all();

  const answer = [];

  for (const host in all) {
    const heartbeat = all[host].heartbeat;
    const now = new Date();
    const then = new Date(heartbeat.ts);
    if (!then) continue; // don't crash if still on the first heartbeat (which doesn't contain a .ts)
    const age = now - then;
    const ttl = 3 * heartbeat.interval;
    const ttl_secs = Math.ceil(ttl / 1000);
    if (age < ttl) {
      answer.push({a:{name:ob.dns_request.question[0].name,address:host,ttl:(ttl_secs)}});
    }
  }

  put({dns_response:{request_id:ob.dns_request.request_id,answer:answer}});

}

exports.exec = exec;