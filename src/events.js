/**
 * Handles events
 *
 * This module was taken from a very old verison of node.js. It has been
 * modified slightly to ensure it works properly outside of the V8 engine.
 *
 * Copyright 2009, 2010 Ryan Lienhart Dahl. All rights reserved.  Permission is
 * hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the
 * Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var EventEmitter = (exports.EventEmitter = function () {});

EventEmitter.prototype.emit = function (type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error || !this._events.error.length) {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  var args = Array.prototype.slice.call(arguments, 1);

  var listeners = handler.slice();
  for (var i = 0, l = listeners.length; i < l; i++) {
    listeners[i].apply(this, args);
  }
  return true;
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    this._events[type] = [];
  }

  this._events[type].push(listener);
  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function (type, listener) {
  var self = this;

  // keep this separate; don't inline (doesn't work in IE)
  function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  }

  self.on(type, g);

  return this;
};

EventEmitter.prototype.removeListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  var position = -1;
  for (var i = 0, length = list.length; i < length; i++) {
    if (
      list[i] === listener ||
      (list[i].listener && list[i].listener === listener)
    ) {
      position = i;
      break;
    }
  }
  if (position < 0) return this;
  list.splice(position, 1);
  if (list.length == 0) delete this._events[type];

  return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function (type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  return this._events[type];
};
