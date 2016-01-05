JSON Space
==========

JSON Space is an implementation of a variation of the [TupleSpace](http://c2.com/cgi/wiki?TupleSpace)/[Blackboard Metaphor](https://en.wikipedia.org/wiki/Blackboard_system#Metaphor) designs.

The goal is to provide an open source, performant, geographically distributed and failure tolerant message switch.

A first concrete implementation will be a [pub/sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) messaging system.  This will allow extremely low-latency intra-continental messaging, while ensuring timely global delivery. 


Concept
-------

The JSON Space servers can be augmented with rules (written in JavaScript) which match JSON objects.  The return code from a rule determines whether the JSON is removed (`true`) or left for other rules to process (`false`). 

Each rule may generate zero or more new JSON objects.

The JSON Space protocols generate and remove JSON objects themselves - generating a JSON object is sufficient to send network traffic.  (FIXME: Add code examples.)

JSON Space is a betteries-included kit of parts for building the message switch you need, with the domain-specific logic you specifiy, with redundancy and abuse-prevention built-in.


Protocols
---------

The JSON Space server will initially be able to accept rules about the following protocols:

* WebSocket
* DNS

Others will be implemented when needed, and will probably include:

* HTTP server
* HTTP client
* raw UDP
* raw TCP
* SMTP


Languages
---------

All server code modules will initially be written in (ES6) JavaScript/NodeJS, but it is expected that some portions will need to be rewritten in C/Haskell/Rust to use server hardware more efficiently.


Licensing
---------

JSON Space client code is licensed under the MIT license, so that it does not add any open-source obligations to the mobile, desktop or web apps which incorporate it.

The JSON Space server code is licensed under the AGPLv3 - the server code will include a URL from where the server code may be downloaded.
