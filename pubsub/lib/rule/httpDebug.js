"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const fs = require('fs');

function exec(ob, put, queries) {
  if (!ob.http_request) return;

  if (ob.http_request.url === '/debug') {
    let data = '<html><body>';
    for (const p in queries) {
      data += `<p><a href="/debug/${p}">${p}</a></p>`;
    }
    data += '</body></html>';
    put({http_response: {request_id: ob.http_request.request_id, data: data}});
    return true;
  }

  if (ob.http_request.url.substr(0,7) === '/debug/') {
    const name = ob.http_request.url.substr(7);
    const lines = JSON.stringify(queries[name].debug(), null, 2).split('\n');
    let data = '<html><body><pre>';
    data += lines.join('\n');
    data += '</pre></body></html>';
    put({http_response: {request_id: ob.http_request.request_id, data: data}});
    return true;
  }
}

exports.exec = exec;