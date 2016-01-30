"use strict";

const net = require('net');
const byline = require('byline');

function listen(ob, put, getReferences) {
}

function start(ob, put, pool) {
  const connect = ob.protocol.replication_client.connect;
  const conn_id = `replication_client|${connect.host}:${connect.port}`;
  let conn = null;

  function try_to_connect() {
    put({replication_client_connecting: {conn_id: conn_id}});
    conn = net.connect(connect.port, connect.host, function () {
      put({replication_client_connected: {conn_id: conn_id}});
      const lines = byline()
      lines.on('data', function (data) {
        put({replication_client_rx: {conn_id: conn_id, data: data}});
      });
    });
    conn.on('error', function (err) {
      put({replication_client_error: {conn_id: conn_id, error: err}});
      conn = null;
      setTimeout(try_to_connect, 5000);
    });
    conn.on('end', function () {
      put({replication_client_disconnected: {conn_id: conn_id}});
      conn = null;
      setTimeout(try_to_connect, 5000);
    });
  }

  try_to_connect();
}



exports.listen = listen;
exports.start = start;
