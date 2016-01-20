"use strict";

/**
 * Created by chris on 17/01/2016.
 */

// TODO: pop, shift and unshift

class CircularBuffer {
  constructor(capacity) {
    if (!capacity) {
      throw new Error('CircularBuffers must have a capacity of one or greater')
    }
    this.capacity = capacity;
    this.array = [];
    this.pushIndex = 0;
  }

  push(ob) {
    this.array[this.pushIndex] = ob;
    console.log('b', this.pushIndex);
    this.pushIndex = (this.pushIndex + 1) % this.capacity;
    console.log('a', this.pushIndex);
  }

  toArray() {
    if (this.array.length === this.pushIndex) { // still growing
      return this.array;
    } else {
      return this.array.slice(this.pushIndex).concat(this.array.slice(0, this.pushIndex));
    }
  }


  remove(fn) {
    // normalise the array before deletion
    // - it makes the logic *much* simpler
    // - and causes no overhead (beyond a function call) when the array is already normalised
    this.array = this.toArray();
    this.pushIndex = this.array.length;
    for (let i = this.array.length - 1; i >= 0; i--) {
      if (fn(this.array[i])) {
        this.array.splice(i, 1);
        this.pushIndex--;
      }
    }
  }
}

exports.CircularBuffer = CircularBuffer;
