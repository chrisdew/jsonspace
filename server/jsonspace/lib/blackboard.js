"use strict";

/**
 * Created by chris on 07/12/2015.
 */

// FIXME: find a way to move the logging/fs code out of blackboard, as it should not have to be concerned with IO
const fs = require('fs');
const u = require('./util');


class Blackboard {
  constructor() {
    this._rules = {}
    this._protocols = {};
    this._queries = [];
    this._log = null;
  }

  put(ob) {
    // work out the type (simple the first property other than id)
    const type = u.firstNonIdPropertyName(ob);
    if (!type) return; // nothing to do

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
      if (ob.protocol[protocolName].listen) {
        var that = this;
        // FIXME: having trouble with destructuring - const {type, send} = ... isn't working
        const typeSend = required.listen(ob, function(protocol_ob) {
          that.put(protocol_ob);
        });
        this.pushRule(typeSend.type, typeSend.send)
      }
    }

    if (type == 'rule') {
      const required = require('./rule/' + ob.rule.name);
      this.pushRule(ob.rule.type, required.exec);
    }

    for (let i in this._rules[type]) {
      var that = this;
      let drop = this._rules[type][i](ob, function(ob) {
        process.nextTick(function() {
          that.put(ob)
        });
      });
      // FIXME: semantics - should this return, or just break?
      if (drop) return;
    }
    for (let i in this._queries) {
      this._queries[i].put(ob);
    }
  }

  pushRule(type, rule) {
    if (!this._rules[type]) {
      this._rules[type] = [];
    }
    this._rules[type].push(rule);
  }

  pushQuery(query) {
    this._queries.push(query);
  }

  getReferences() {
    let ret = {}; // list each referenced object a maximum of once
    for (let query of this._queries) {
      let references = query.getReferences();
      for (let id in references) {
        ret[id] = references[id];
      }
    }
    return ret;
  }
}

exports.Blackboard = Blackboard;
