"use strict";

const net = require('net');

function listen(ob, put, getReferences) {
  const conns = {}; // tcp connections by conn_id

  const server = net.createServer((connection) => {
    const client_addr = connection.remoteAddress;
    const client_port = connection.remotePort;
    const server_addr = connection.localAddress;
    const server_port = connection.localPort;
    const tcp_conn = {client:{host:client_addr,port:client_port},server:{host:server_addr,port:server_port}};
    // FIXME: this is broken if more than one request is made on the same connection, simultaneously
    const conn_id = `replicate|${client_addr}:${client_port}|${server_addr}:${server_port}`;
    conns[conn_id] = connection;
    put({replication_client_connected:{
      conn_id:conn_id,
      tcp_conn:tcp_conn,
    }});
    // send contents of pool on connection
    const refs = getReferences(ob.protocol.replicate.types);
    for (const i in refs) {
      connection.write(JSON.stringify(refs[i]) + '\n');
    }
  });

  // TODO: remove closed/errored clients form conns

  server.listen(ob.protocol.replicate.listen.port);

  // this function is given back to the blackboard to handle outgoing websocket data
  // FIXME: this is not working...
  function send(ob, put) {
    for (const i in conns) {
      conns[i].write(JSON.stringify(ob) + '\n');
    }
  }
  return {types:ob.protocol.replicate.types, send:send};
}

exports.listen = listen;
