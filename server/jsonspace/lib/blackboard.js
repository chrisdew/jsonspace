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
      let drop = this._rules[i](ob, this.put);
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
}

exports.Blackboard = Blackboard;
