"use strict";

const http = require('http');

function listen(ob, put, getReferences) {
  console.log('LISTEN');
  return {type:'http_client_request', send:send};
}

function start(ob, put, pool) {
}

function send(ob, put) {
  console.log('SEND');
  var req = http.request(ob.http_client_request.options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.')
    })
  });

  req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
  });

  // write data to request body
  req.write(ob.http_client_request.data);
  req.end();
  console.log('SENT');
}



exports.listen = listen;
exports.start = start;
