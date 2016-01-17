"use strict";

/**
 * Created by chris on 30/12/2015.
 */

const http = require('http');

function listen(ob, put) {
  const responses = {}; // http connections by conn_id

  const server = new http.Server();
  server.listen(ob.protocol.http.listen.port);
  server.on('request', (request, response) => {
    const client_addr = request.connection.remoteAddress;
    const client_port = request.connection.remotePort;
    const server_addr = request.connection.localAddress;
    const server_port = request.connection.localPort;
    const tcp_conn = {client:{host:client_addr,port:client_port},server:{host:server_addr,port:server_port}};
    // FIXME: this is broken if more than one request is made on the same connection, simultaneously
    const request_id = `http|${client_addr}:${client_port}|${server_addr}:${server_port}`;
    responses[request_id] = response;
    put({http_request:{
      request_id:request_id,
      domain:request.domain,
      http_version:request.httpVersion,
      url:request.url,
      method:request.method,
      tcp_conn:tcp_conn
    }});
    //console.log('request', request);
  });

  // this function is given back to the blackboard to handle outgoing websocket data
  function send(ob, put) {
    const response = responses[ob.http_response.request_id];
    if (response) {
      if (ob.http_response.status_code) {
        response.statusCode = ob.http_response.status_code;
      }
      response.end(ob.http_response.data, (err) => {
        if (err) {
          put({error: {message: 'error when responding'}, err:err, ref:ob});
        }
      });
    } else {
      put({error:{message:'unable to send due to non-existent request_id'}, ref:ob});
    }
  }
  return {type:'http_response', send:send};
}

exports.listen = listen;
