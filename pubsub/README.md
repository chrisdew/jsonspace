PubSub
======

PubSub is a websocket publish/subscribe server which uses the jsonpace framework.

It is under active development - do not use in production until version 1.0.0.


install
=======
```
94:tmp chris$ npm install pubsub_jsonspace
npm WARN deprecated jade@0.26.3: Jade has been renamed to pug, please install the latest version of pug instead of jade
npm WARN deprecated graceful-fs@2.0.3: graceful-fs v3.0.0 and before will fail on node releases >= v6.0. Please update to graceful-fs@^4.0.0 as soon as possible. Use 'npm ls graceful-fs' to find it in the tree.

> utf-8-validate@1.2.1 install /private/tmp/node_modules/pubsub_jsonspace/node_modules/ws/node_modules/utf-8-validate
> node-gyp rebuild

  CXX(target) Release/obj.target/validation/src/validation.o
  SOLINK_MODULE(target) Release/validation.node

> bufferutil@1.2.1 install /private/tmp/node_modules/pubsub_jsonspace/node_modules/ws/node_modules/bufferutil
> node-gyp rebuild

  CXX(target) Release/obj.target/bufferutil/src/bufferutil.o
  SOLINK_MODULE(target) Release/bufferutil.node
pubsub_jsonspace@0.18.22 node_modules/pubsub_jsonspace
├── maxmind@0.6.0
├── wscat@1.0.1 (tinycolor@0.0.1, commander@2.8.1)
├── mocha@2.4.5 (commander@2.3.0, escape-string-regexp@1.0.2, diff@1.4.0, growl@1.8.1, supports-color@1.2.0, debug@2.2.0, mkdirp@0.5.1, jade@0.26.3, glob@3.2.3)
├── jsonspace@0.6.22 (byline@4.2.1, nodemailer@2.3.2, native-dns@0.7.0, apn@1.7.5, node-gcm@0.14.0)
└── ws@0.8.1 (options@0.0.6, ultron@1.0.2, utf-8-validate@1.2.1, bufferutil@1.2.1)
```

run
===
```94:tmp chris$ cd node_modules/pubsub_jsonspace/
   94:pubsub_jsonspace chris$ mkdir ./geoip
   94:pubsub_jsonspace chris$ cp /where/you/keep/it/GeoLiteCity.dat ./geoip/
   94:pubsub_jsonspace chris$ npm start

   > pubsub_jsonspace@0.18.22 start /private/tmp/node_modules/pubsub_jsonspace
   > node pubsub.js

   {"server_start":{},"id":"2016-05-02T05:46:11.112Z|0|81.187.221.94|4238"}
   {"server_start":{"config":"/etc/pubsub.json"},"id":"2016-05-02T05:46:11.122Z|0|81.187.221.94|4238"}
   {"server_start":{"config":"./etc/pubsub.json"},"id":"2016-05-02T05:46:11.123Z|0|81.187.221.94|4238"}
...
   {"heartbeat":{"interval":2000,"host":"81.187.221.94","ts":"2016-05-02T05:46:13.717Z"},"id":"2016-05-02T05:46:13.718Z|0|81.187.221.94|4238"}
   {"heartbeat":{"interval":2000,"host":"81.187.221.94","ts":"2016-05-02T05:46:15.720Z"},"id":"2016-05-02T05:46:15.720Z|0|81.187.221.94|4238"}
...
```

test
====

(in another window)
```
91:tmp chris$ cd node_modules/pubsub_jsonspace/
91:pubsub_jsonspace chris$ npm test

> pubsub_jsonspace@0.4.3 test /private/tmp/node_modules/pubsub_jsonspace
> mocha



  pubsub
conn_a: connected
waiting for 1 more callbacks before continuing
conn_b: connected
conn_a tx: {"subscribe":{"username":"user_a","channel":"#channel_0","extra":"a_on_0"}}
conn_a ex: {"subscribers":{"channel":"#channel_0","list":[{"username":"user_a","extra":"a_on_0"}]}}
conn_a rx: {"subscribers":{"channel":"#channel_0","list":[{"username":"user_a","extra":"a_on_0"}]}}
...

...
conn_p rx: {"published":{"channel":"#channel_7","username":"user_o","data":"first on channel 7"},"id":"2016-01-17T11:37:44.812Z|2|127.0.0.1|2718"}
      ✓ should cause old message to be sent when subscribing (223ms)


  7 passing (1s)

```
