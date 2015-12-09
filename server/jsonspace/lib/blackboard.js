"use strict";

/**
 * Created by chris on 07/12/2015.
 */

class Blackboard {
  constructor() {
    this._rules = [];
    this._queries = [];
  }

  put(ob) {
    for (let i in this._rules) {
      var that = this;
      let drop = this._rules[i](ob, function(ob) {
        process.nextTick(function() {
          that.put(ob)
        });
      });
      if (drop) return;
    }
    for (let i in this._queries) {
      this._queries[i].put(ob);
    }
  }

  pushRule(rule) {
    this._rules.push(rule);
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
