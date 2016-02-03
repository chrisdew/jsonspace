"use strict";

const net = require('net');
const byline = require('byline');
const u = require('../util');

function listen(ob, put, getReferences) {
}

function start(ob, put, pool) {
  const connect = ob.protocol.replication_client.connect;
  const conn_id = `replication_client|${connect.host}:${connect.port}`;
  let conn = null;

  function try_to_connect() {
    put({replication_client_connecting: {conn_id: conn_id}});
    conn = net.connect(connect.port, connect.host, function () {
      conn.setEncoding('utf8');
      put({replication_client_connected: {conn_id: conn_id}});
      const lines = byline(conn);
      lines.on('data', function (data) {
        let rep = JSON.parse(data);
        put({replication_client_rx: {conn_id: conn_id, ob: rep}});
        let type = u.firstNonIdPropertyName(rep);

        let put_types = ob.protocol.replication_client.put_types;
        if (put_types.indexOf(type) !== -1) {
          put(rep);
        }

        let pool_types = ob.protocol.replication_client.pool_types;
        if (pool_types.indexOf(type) !== -1) {
          pool(rep);
        }
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
