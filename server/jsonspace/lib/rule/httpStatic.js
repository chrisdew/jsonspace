"use strict";

/**
 * Created by chris on 14/12/2015.
 */

const fs = require('fs');

function exec(ob, put, queries) {
  if (!ob.http_request) return;

  let result = queries.http_static_content$path.result(ob.http_request.url);
  if (!result) {
    put({http_response:{request_id:ob.http_request.request_id, status_code:404}});//, data:'404 - not found'}});
    return;
  }
  if (result.http_static_content.data) {
    put({http_response:{request_id:ob.http_request.request_id, data:result.http_static_content.data}});
    return;
  }
  if (result.http_static_content.file) {
    fs.readFile('./http_public/' + result.http_static_content.file, 'utf8', (err, data) => {
      if (err) {
        put({http_response:{request_id:ob.http_request.request_id, status_code:500}});
        return;
      }
      put({http_response:{request_id:ob.http_request.request_id, data:data}});
    });
  }
}

exports.exec = exec;