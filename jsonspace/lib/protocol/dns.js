"use strict";

const dns = require('native-dns');

function listen(ob, put) {
  const responses = {}; // responses by request_id

  const server = dns.createServer();
  server.serve(ob.protocol.dns.listen.port, ob.protocol.dns.listen.address);

  server.on('request', (request, response) => {
    const request_id = 'dns_request|' + request.address.address + ':' + request.address.port + '|' + request.header.id;
    responses[request_id] = response;
    put({dns_request:{
      request_id: request_id,
      question: request.question,
      from: request.address.address
    }});
  });

  // this function is given back to the blackboard to handle outgoing dns data
  function send(ob, put) {
    const response = responses[ob.dns_response.request_id];
    if (response) {
      for (const answer of ob.dns_response.answer) {
        if (answer.a) {
          response.answer.push(dns.A(answer.a));
        }
        // TODO: add other record types
      }
      response.send();
    } else {
      put({error:{message:'unable to send due to non-existent request_id'}, ref:ob});
    }
  }

  return {type:'dns_response', send:send};
}

exports.listen = listen;
