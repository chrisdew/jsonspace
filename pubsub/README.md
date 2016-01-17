PubSub
======

PubSub is a websocket publish/subscribe server which uses the jsonpace framework.

It is under active development - do not use in production until version 1.0.0.


install
=======
```
91:tmp chris$ npm install pubsub_jsonspace@0.4.3
 
> utf-8-validate@1.2.1 install /private/tmp/node_modules/pubsub_jsonspace/node_modules/ws/node_modules/utf-8-validate
> node-gyp rebuild

  CXX(target) Release/obj.target/validation/src/validation.o
  SOLINK_MODULE(target) Release/validation.node

> bufferutil@1.2.1 install /private/tmp/node_modules/pubsub_jsonspace/node_modules/ws/node_modules/bufferutil
> node-gyp rebuild

  CXX(target) Release/obj.target/bufferutil/src/bufferutil.o
  SOLINK_MODULE(target) Release/bufferutil.node
pubsub_jsonspace@0.4.3 node_modules/pubsub_jsonspace
├── jsonspace@0.4.1
├── wscat@1.0.1 (tinycolor@0.0.1, commander@2.8.1)
├── mocha@2.3.4 (escape-string-regexp@1.0.2, commander@2.3.0, diff@1.4.0, growl@1.8.1, supports-color@1.2.0, debug@2.2.0, mkdirp@0.5.0, jade@0.26.3, glob@3.2.3)
└── ws@0.8.1 (options@0.0.6, ultron@1.0.2, utf-8-validate@1.2.1, bufferutil@1.2.1)
```

run
===
```
91:tmp chris$ cd node_modules/pubsub_jsonspace/
91:pubsub_jsonspace chris$ npm start

> pubsub_jsonspace@0.4.3 start /private/tmp/node_modules/pubsub_jsonspace
> node pubsub.js

{"protocol":{"websocket":{"listen":{"port":8888,"path":"/pubsub"}}},"id":"2016-01-17T11:37:26.009Z|0|127.0.0.1|2718"}
{"protocol":{"http":{"listen":{"port":8080}}},"id":"2016-01-17T11:37:26.088Z|0|127.0.0.1|2718"}
{"rule":{"type":"websocket_raw_rx","name":"rawToObj"},"id":"2016-01-17T11:37:26.098Z|0|127.0.0.1|2718"}
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
