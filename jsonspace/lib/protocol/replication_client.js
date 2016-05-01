"use strict";

const net = require('net');
const byline = require('byline');
const u = require('../util');

const INITIAL_RECONN_DELAY = 10000; // ten seconds
const MAX_RECONN_DELAY =    600000; // ten minutes
//const MAX_RECONN_DELAY =     30000; // thirty seconds

function listen(ob, put, getReferences) {
}

function start(ob, put, pool) {
  const connect = ob.protocol.replication_client.connect;
  const conn_id = `replication_client|${connect.host}:${connect.port}`;
  let conn = null;

  let reconn_delay = INITIAL_RECONN_DELAY;

  function try_to_connect() {
    put({replication_client_connecting: {conn_id: conn_id}});
    conn = net.connect(connect.port, connect.host, function () {
      conn.setEncoding('utf8');
      put({replication_client_connected: {conn_id: conn_id}});
      reconn_delay = INITIAL_RECONN_DELAY;
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
      put({replication_client_error: {conn_id: conn_id, error: err, max_reconn_delay: reconn_delay === MAX_RECONN_DELAY}});
      conn = null;
      setTimeout(try_to_connect, reconn_delay);
      reconn_delay *= 2;
      reconn_delay = Math.min(MAX_RECONN_DELAY, reconn_delay);
    });
    conn.on('end', function () {
      put({replication_client_disconnected: {conn_id: conn_id}});
      conn = null;
      setTimeout(try_to_connect, reconn_delay);
      reconn_delay *= 2;
      reconn_delay = Math.min(MAX_RECONN_DELAY, reconn_delay);
    });
  }

  try_to_connect();
}



exports.listen = listen;
exports.start = start;
