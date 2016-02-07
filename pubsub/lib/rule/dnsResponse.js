"use strict";

var maxmind = require('maxmind');
maxmind.init('./geoip/GeoLiteCity.dat');

function exec(ob, put, queries) {
  if (!ob.dns_request || !ob.dns_request.request_id) return;

  if (ob.dns_request.question[0].name !== 'pubsub.jsonspace.com'
   && ob.dns_request.question[0].name !== 'pubsub.tourney.com') return; // temporary fix for server being abused in a dns amplification attack

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
      const dist = _getDistance(ob.dns_request.from, heartbeat.host);
      answer.push({a:{name:ob.dns_request.question[0].name,address:host,ttl:ttl_secs,dist:dist}});
    }
  }

  // sort the servers, nearest first
  answer.sort(function(p,q) {
    if (p.a.dist < q.a.dist) return -1;
    if (p.a.dist > q.a.dist) return 1;
    return 0;
  });

  put({dns_response:{request_id:ob.dns_request.request_id,answer:answer}});

}

function _getDistance(a, b) {
  var fromLocation = maxmind.getLocation(a);
  if (!fromLocation) return Number.MAX_VALUE;
  var toLocation = maxmind.getLocation(b);
  if (!toLocation) return Number.MAX_VALUE;

  //console.log('From:\t', fromLocation.countryName, fromLocation.city);
  //console.log('To:\t', toLocation.countryName, toLocation.city);
  const dist = toLocation.distance(fromLocation);
  //console.log('Dist:\t', dist);
  return dist;
}

exports.exec = exec;