"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const ws = require('ws');

function listen(ob, put) {
  const conns = {}; // websocket connections by conn_id

  const server = new ws.Server(ob.protocol.websocket.listen);
  server.on('connection', (ws) => {
    const client_addr = ws.upgradeReq.connection.remoteAddress;
    const client_port = ws.upgradeReq.connection.remotePort;
    const server_addr = ws.upgradeReq.connection.localAddress;
    const server_port = ws.upgradeReq.connection.localPort;
    const tcp_conn = {client:{host:client_addr,port:client_port},server:{host:server_addr,port:server_port}};
    const conn_id = `websocket|${client_addr}:${client_port}|${server_addr}:${server_port}`;
    conns[conn_id] = ws;
    put({websocket_connected:{conn_id:conn_id,tcp_conn:tcp_conn}});
    ws.on('message', (message) => {
      put({websocket_raw_rx:{conn_id:conn_id,data:message}});
    })
    ws.on('end', () => {
      put({websocket_disconnected:{conn_id:conn_id,data:message}});
    })
  });

  // this function is given back to the blackboard to handle outgoing websocket data
  function send(ob, put) {
    const conn = conns[ob.websocket_tx.conn_id];
    if (!conn) return;
    conn.send(JSON.stringify(ob.websocket_obj_tx.obj));
  }
  return {type:'websocket_obj_tx', send:send};
}

exports.listen = listen;
