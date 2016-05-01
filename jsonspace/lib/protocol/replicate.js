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
    const conn_id = `replicate|${client_addr}|${client_port}|${server_addr}|${server_port}`;
    conns[conn_id] = connection;
    put({replicate_connected:{
      conn_id:conn_id,
      tcp_conn:tcp_conn,
      server:client_addr
    }});
    // send contents of pool on connection
    const refs = getReferences(ob.protocol.replicate.types);
    for (const i in refs) {
      connection.write(JSON.stringify(refs[i]) + '\n');
    }

    connection.on('error', (error) => {
      put({replicate_error:{
        conn_id:conn_id,
        tcp_conn:tcp_conn,
        server:client_addr,
        error:error
      }});
      connection.end();
    });

    connection.on('close', () => {
      put({replicate_disconnected:{
        conn_id:conn_id,
        tcp_conn:tcp_conn,
        server:client_addr
      }});
    });
  });

  // TODO: remove closed/errored clients form conns

  server.listen(ob.protocol.replicate.listen.port, ob.protocol.replicate.listen.host);

  function send(ob, put) {
    for (const i in conns) {
      // only send obs whose id's IP is not the same as the conns's conn_id's IP
      const ob_ip = ob.id.split('|')[2];
      const client_ip = i.split('|')[1];
      //put({info:{ob_ip:ob_ip,client_ip:client_ip}});
      if (ob_ip === client_ip) continue; // don't send messages back to the node which created them
      if (ob.local) continue; // don't send explicitly local messages

      try {
        conns[i].write(JSON.stringify(ob) + '\n');
      } catch (e) {
        put({replicate_error:{err:e}});
        delete conns[i];
      }
    }
  }
  return {types:ob.protocol.replicate.types, send:send};
}

exports.listen = listen;
