"use strict";

const dns = require('native-dns');

function listen(ob, put) {
  const responses = {}; // responses by request_id

  const server = dns.createServer();
  server.serve(ob.protocol.dns.listen.port, ob.protocol.dns.listen.address);

  server.on('request', (request, response) => {
    if (!request.address || !request.address.address || !request.address.port) {
      put({dns_malformed_request:{
        request:request
      }});
    } else {
      const request_id = 'dns_request|' + request.address.address + ':' + request.address.port + '|' + request.header.id;
      responses[request_id] = response;
      put({dns_request:{
        request_id: request_id,
        question: request.question,
        from: request.address.address
      }});
    }
  });

  server.on('error', function (error, buf, request, response) {
    if (!request.address || !request.address.address || !request.address.port) {
      put({dns_malformed_request_error:{
        //request:request,
        //error: error.stack // this causes a "TypeError: Converting circular structure to JSON"
      }});
    } else {
      const request_id = 'dns_request|' + request.address.address + ':' + request.address.port + '|' + request.header.id;
      responses[request_id] = response;
      put({
        dns_error: {
          request_id: request_id,
          question: request.question,
          from: request.address.address,
          error: error.stack
        }
      });
    }
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
      put({dns_error:{message:'unable to send due to non-existent request_id'}, ref:ob});
    }
  }

  return {type:'dns_response', send:send};
}

exports.listen = listen;
