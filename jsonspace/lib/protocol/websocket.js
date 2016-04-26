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
    let timeout;

    put({websocket_connected:{conn_id:conn_id,tcp_conn:tcp_conn}});

    ws.on('message', (message) => {
      put({websocket_raw_rx:{conn_id:conn_id,data:message}});

      // reset timeout on each incomming message
      if (ob.protocol.websocket.timeout) {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFn, ob.protocol.websocket.timeout);
      }
    });

    ws.on('close', () => {
      if (ob.protocol.websocket.timeout) {
        clearTimeout(timeout);
      }
      put({websocket_disconnected:{conn_id:conn_id}});
    });

    if (ob.protocol.websocket.timeout) {
      // set initial timeout, even if no data ever received from client
      timeout = setTimeout(timeoutFn, ob.protocol.websocket.timeout);
    }

    function timeoutFn() {
      put({websocket_timeout:{conn_id:conn_id}});
      ws.close();
    }
  });

  // this function is given back to the blackboard to handle outgoing websocket data
  function send(ob, put) {
    const conn = conns[ob.websocket_obj_tx.conn_id];
    if (conn) {
      conn.send(JSON.stringify(ob.websocket_obj_tx.obj),(err) => {
        if (err) {
          put({error: {message: 'error when sending'}, err:err, ref: ob});
        }
      });
    } else {
      put({error:{message:'unable to send due to non-existent conn_id'}, ref:ob});
    }
  }
  return {type:'websocket_obj_tx', send:send};
}

exports.listen = listen;
