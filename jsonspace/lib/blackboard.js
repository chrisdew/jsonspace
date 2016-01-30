"use strict";

/**
 * Created by chris on 07/12/2015.
 */

// FIXME: find a way to move the logging/fs code out of blackboard, as it should not have to be concerned with IO
const fs = require('fs');
const u = require('./util');


class Blackboard {
  constructor(ip, dateFn, super_modules) {
    if (!ip) ip = '127.0.0.1';
    if (!dateFn) dateFn = () => { return "1970-01-01T00:00:00.000Z"};

    this._super_modules = super_modules;
    this._rules = {}
    this._protocols = {};
    this._queries = {};
    this._log = null;
    this._idGenerator = new IdGenerator(ip, dateFn);
  }

  put(ob) {
    try {
      // work out the type (simple the first property other than id)
      const type = u.firstNonIdPropertyName(ob);
      if (!type) return; // nothing to do

      // give it an id, if it doesn't have one
      if (!ob.id) ob.id = this._idGenerator.generate();

      // handle logging meta objects
      if (type == 'logging') {
        // FIXME: close existing log?  Log the fact that the log has moved?
        if (ob.logging.path) {
          this._log = fs.createWriteStream(ob.logging.path, {'flags': 'a'});
        }
      }

      // log the put object; we don't do this earlier, or the logging object would not be logged
      if (this._log) {
        this._log.write(JSON.stringify(ob) + '\n');
      } else {
        console.log(JSON.stringify(ob));
      }

      // handle protocol meta objects
      if (type == 'protocol') {
        // find out which protocol
        const protocolName = u.firstNonIdPropertyName(ob.protocol);
        const required = require('./protocol/' + protocolName);
        var that = this;
        if (ob.protocol[protocolName].listen) {
          // FIXME: having trouble with destructuring - const {type, send} = ... isn't working
          const typeSend = required.listen(ob, function(protocol_ob) {
            that.put(protocol_ob);
          }, (types) => this.getReferences(types));
          if (typeSend.type) {
            this.pushRule(typeSend.type, typeSend.send)
          } else if (typeSend.types) {
            for (const type of typeSend.types) {
              this.pushRule(type, typeSend.send)
            }
          }
        }
        if (ob.protocol[protocolName].connect) {
          required.start(ob, function(protocol_ob) {
            that.put(protocol_ob);
          }, function(protocol_ob) {
            that.pool(protocol_ob);
          });
        }
      }

      if (type == 'rule') {
        const required = this.super_require(ob.rule.name);
        this.pushRule(ob.rule.type, required.exec, this._queries);
      }

      if (type == 'query') {
        const required = require('./query/' + ob.query.code);
        const args = ob.query.args ? ob.query.args : [];
        const query = new required.Query(ob.query.name, ...args);
        this.pushQuery(ob.query.name, query);
      }

      for (let i in this._rules[type]) {
        var that = this;
        let drop = this._rules[type][i](ob, function (ob) {
            process.nextTick(function () {
              that.put(ob)
            });
          },
          this._queries);
        // FIXME: semantics - should this return, or just break?
        if (drop) return;
      }
      this.pool(ob);
    } catch (e) {
      console.error('put error:', e, 'ref:', ob);
    }
  }

  pool(ob) {
    try {
    for (let name in this._queries) {
      //console.log('name', name);
      //console.log('this._queries', this._queries);
      this._queries[name].put(ob);
    }
    } catch (e) {
      console.error('pool error:', e, 'ref:', ob);
    }
  }

  super_require(module_name) {
    return this._super_modules[module_name];
  }

  pushRule(type, rule) {
    if (!this._rules[type]) {
      this._rules[type] = [];
    }
    this._rules[type].push(rule);
  }

  pushQuery(name, query) {
    this._queries[name] = query;
  }

  getReferences(types) {
    let ret = {}; // list each referenced object a maximum of once
    for (let name in this._queries) {
      let references = this._queries[name].getReferences();
      for (let reference of references) {
        const id = reference.id;
        //console.log('types', types)
        if (!types) {
          ret[id] = reference;
        } else {
          let type = u.firstNonIdPropertyName(reference);
          //console.log('type', type, 'types', types, reference);
          if (types.indexOf(type) != -1) {
            ret[id] = reference;
          }
        }
      }
    }
    const ret2 = [];
    for (const i in ret) {
      ret2.push(ret[i]);
    }
    return ret2;
  }
}

// ID generator
//
// This generates unique IDs for messages which lack them.  A simple uuid could have been used, but this is more useful
// for debugging.

class IdGenerator {
  constructor(ip, dateFn) {
    this._ip = ip;
    this._dateFn = dateFn;
    this._lastDate;
    this._counter = 0;
  }

  generate() {
    let date = this._dateFn();
    if (date == this._lastDate) {
      this._counter++;
    } else {
      this._lastDate = date;
      this._counter = 0;
    }
    return `${date}|${this._counter}|${this._ip}|${process.pid}`;
  }
}

exports.Blackboard = Blackboard;
