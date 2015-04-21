require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//
// Module name:
//
//     dom
//
// Description:
//
//     'dom' is a JavaScript module for creating HTML elements.
//     The module exposes two object constructors, 'createElement' and 'element'.
//     The functions accept the same arguments, an HTML tag name, an attributes
//     object, an array of subelements, and an eventHandlers object.  The
//     difference is that 'element' postpones the creation of an underlying DOM
//     element, whereas 'createElement' creates and returns the DOM element.
//
//     createElement(x) === element(x).render()
//
//     By postponing the creation of the DOM, we can unit test modules
//     that return element objects without requiring a browser or a browser
//     simulator such as JsDom or Zombie.  A bare-bones JavaScript interpreter
//     such as Node.js will suffice.
//


var document = require('global/document');
var observable = require('./observable');

// Add style 's' with value 'style[s]' to the DOM element 'e'.
function addStyle(e, subscriber, style, s) {
    if (style[s] instanceof observable.Observable) {
        e.style[s] = style[s].get();
        var o = style[s].map(function(v) {e.style[s] = v;});
        subscriber.addArg(o);
    } else {
        e.style[s] = style[s];
    }
}

// Add attribute 'k' with value 'v' to the DOM element 'e'.   If the
// attribute's value is 'undefined', it will be ignored.  If the
// attribute's value is an observable, then any time its value is
// 'undefined', the attribute will be removed.
function addAttribute(e, subscriber, k, v) {
    if (v instanceof observable.Observable) {
        var val = v.get();
        if (val !== undefined) {
            e.setAttribute(k, val);
        }
        var o = v.map(function(v) {
            if (v !== undefined) {
                e.setAttribute(k, v);
            } else {
                e.removeAttribute(k);
            }
        });
        subscriber.addArg(o);
    } else {
        if (v !== undefined) {
            e.setAttribute(k, v);
        }
    }
}

function setChildren(subscriber, e, xs) {
    e.innerHTML = '';
    for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        x = typeof x === 'string' ? document.createTextNode(x) : x;
        if (typeof x.render === 'function') {
            x = x.render();
            if (typeof x.get === 'function') {
                if (subscriber.args.indexOf(x) === -1) {
                    subscriber.addArg(x);
                }
                x = x.get();
            }
        }
        e.appendChild(x);
    }
}


// Create a DOM element with tag name 'nm', attributes object 'as', style object 'sty',
// an array of subelements 'xs', and an object of event handlers 'es'.
function createElement(ps) {

    if (typeof ps === 'string') {
        ps = {name: ps};
    }

    // Create DOM node
    var e = document.createElement(ps.name);

    // Create a subscriber to watch any observables.
    var subscriber = observable.subscriber([], function(){return e;});

    // Add attributes
    var as = ps.attributes;
    var k;
    if (as) {
        for (k in as) {
            if (as.hasOwnProperty(k) && k !== 'style' && as[k] !== undefined) {
                addAttribute(e, subscriber, k, as[k]);
            }
        }
    }

    // Add Style
    var style = ps.style;
    if (style) {
        for (var s in style) {
            if (style.hasOwnProperty(s) && style[s] !== undefined) {
                addStyle(e, subscriber, style, s);
            }
        }
    }

    // Add child elements
    var xs = ps.contents;
    if (xs) {
        if (typeof xs === 'string') {
            e.appendChild(document.createTextNode(xs));
        } else {
            if (xs instanceof observable.Observable) {
                var xsObs = xs;
                xs = xsObs.get();
                var o = xsObs.map(function(xs){
                    setChildren(subscriber, e, xs);
                });
                subscriber.addArg(o);
            }
            setChildren(subscriber, e, xs);
        }
    }

    // Add event handlers
    var es = ps.handlers;
    if (typeof es === 'object') {
        for (k in es) {
            if (es.hasOwnProperty(k)) {
                e.addEventListener(k, es[k]);
            }
        }
    }

    if (subscriber.args.length > 0) {
        return subscriber;
    }

    return e;
}

//
// element({name, attributes, style, contents, handlers})
//
function ReactiveElement(as) {

    if (typeof as === 'string') {
        as = {name: as};
    }

    this.name = as.name;

    if (as.attributes !== undefined) { this.attributes = as.attributes; }
    if (as.style      !== undefined) { this.style      = as.style; }
    if (as.contents   !== undefined) { this.contents   = as.contents; }
    if (as.handlers   !== undefined) { this.handlers   = as.handlers; }
}

ReactiveElement.prototype.render = function() {
     return createElement(this);
};

function element(as) {
    return new ReactiveElement(as);
}

module.exports = {
    createElement:   createElement,
    ReactiveElement: ReactiveElement,
    element:         element
};


},{"./observable":5,"global/document":3}],2:[function(require,module,exports){
//
// A JavaScript library for 2D layout
//

var dom = require('./dom');
var object = require('./object');
var observable = require('./observable');

// gap(n)
//
//     Create empty space of 'n' pixels wide and 'n' pixels tall.
function gap(n) {
    return dom.element({name: 'div', style: {width: n + 'px', height: n + 'px'}});
}

// Concatenate elements
function cat(as, xs, pos) {
    function setPositions(xs) {
        var ys = [];
        for (var i = 0; i < xs.length; i += 1) {
            ys[i] = setPosition(xs[i], pos);
        }
        return ys;
    }
    var zs;
    if (xs instanceof observable.Observable) {
        zs = xs.map(setPositions);
    } else {
        zs = setPositions(xs);
    }
    return dom.element({name: 'div', contents: zs});
}

function setPosition(e1, pos) {
    var e2 = object.clone(e1);
    e2.style = e2.style ? object.mixin(e2.style, pos) : pos;
    return e2;
}

// Concatenate elements horizontally
var hPos = {cssFloat: 'left', clear: 'none'};
function hcat(as, xs) {
    if (as && (as instanceof Array || as instanceof observable.Observable)) {
        xs = as;
        as = {};
    }
    return cat(as, xs, hPos);
}

// Concatenate elements vertically
var vPos = {cssFloat: 'left', clear: 'both'};
var vPosRight = {cssFloat: 'right', clear: 'both'};
function vcat(as, xs) {
    if (as && (as instanceof Array || as instanceof observable.Observable)) {
        xs = as;
        as = {};
    }
    var pos = as.align === 'right' ? vPosRight : vPos;
    return cat(as, xs, pos);
}

module.exports = {
    hcat: hcat,
    vcat: vcat,
    gap: gap
};


},{"./dom":1,"./object":4,"./observable":5}],3:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":7}],4:[function(require,module,exports){
//
// Module name:
//
//     object
//

// Return a clone of the input object using prototype inheritance.
function Clone() {}
function clone(o) {
    Clone.prototype = o;
    return new Clone();
}

// Return the union of 'o1' and 'o2'.  When both contain the
// same key, the value in 'o2' takes precedence.
function mixin(o1, o2) {
    var o3 = {};
    var k;
    for (k in o1) {
        if (o1.hasOwnProperty(k)) {
            o3[k] = o1[k];
        }
    }
    for (k in o2) {
        if (o2.hasOwnProperty(k) && o2[k] !== undefined) {
            o3[k] = o2[k];
        }
    }
    return o3;
}

// Return the mixin of an array of objects
// cascade(xs) === {} `mixin` xs[0] `mixin` xs[1] `mixin` ... `mixin` xs[-1]
function cascade(xs) {
    return xs.reduce(mixin, {});
}

module.exports = {
    clone: clone,
    mixin: mixin,
    cascade: cascade,
};


},{}],5:[function(require,module,exports){
//
// Observable JS
//

// Publishers and Subscribers share the Observable
// interface, which includes a get() and subscribe()
// function.
function Observable() {
}

Observable.prototype.subscribe = function(f) {
    if (!this.subscribers) {
        this.subscribers = [f];
    } else {
        this.subscribers.push(f);
    }
    return this;
};

// o.map(f) is a shorthand for observable.subscriber([o], f)
Observable.prototype.map = function(f) {
    return subscriber([this], f);
};

// Observable values
Publisher.prototype = new Observable();
Publisher.prototype.constructor = Publisher;

function Publisher(v) {
    this.value = v;
}

Publisher.prototype.set = function(v) {
    this.value = v;
    if (this.subscribers) {
        var me = this;
        this.subscribers.forEach(function(f) {
            f(me);
        });
    }
    return this;
};

Publisher.prototype.get = function() {
    return this.value;
};


// Observable computations.  subscriber() takes a list of observables
// and a callback function and returns an observable.  Any time
// a value is requested AND an input has changed, the given callback
// is executed, and its return value is returned.
Subscriber.prototype = new Observable();
Subscriber.prototype.constructor = Subscriber;
function Subscriber(args, f) {
    this.valid = false;
    this.f = f;
    this.args = args;

    var me = this;  // Avoid 'this' ambiguity.
    args.forEach(function(o) {
        if (o instanceof Observable) {
            o.subscribe(function (obs) {
                me.invalidate();
            });
        }
    });
}

Subscriber.prototype.addArg = function(o) {
    this.args.push(o);
    var me = this;
    o.subscribe(function (obs) {
        me.invalidate();
    });
};

Subscriber.prototype.invalidate = function() {
    if (this.valid) {
        this.valid = false;
        if (this.subscribers) {
            for (var i = 0; i < this.subscribers.length; i++) {
                var f = this.subscribers[i];
                f(this);
            }
        }
    }
};

Subscriber.prototype.get = function() {
   if (this.valid) {
     return this.value;
   } else {
     var vals = this.args.map(function(o){
         return o instanceof Observable ? o.get() : o;
     });

     var oldValue = this.value;
     this.value = this.f.apply(null, vals);
     this.valid = true;

     if (this.value !== oldValue && this.subscribers) {
         var me = this;
         this.subscribers.forEach(function(f) {
             f(me);
         });
     }

     return this.value;
   }
};

function subscriber(args, f) {
    return new Subscriber(args, f);
}

// Handy function to lift a raw function into the observable realm
function lift(f) {
    return function() {
       var args = Array.prototype.slice.call(arguments);
       return subscriber(args, f);
    };
}


// Handy function to capture the current state of an object containing observables
function snapshot(o) {
    if (typeof o === 'object') {
        if (o instanceof Observable) {
            return snapshot( o.get() );
        } else {
            if (o instanceof Array) {
                return o.map(snapshot);
            } else {
                var o2 = {};
                var k;
                for (k in o) {
                    if (o.hasOwnProperty(k)) {
                        o2[k] = snapshot(o[k]);
                    }
                }
                return o2;
            }
        }
    } else {
        return o;
    }
}

function publisher(v) {
    return new Publisher(v);
}

module.exports = {
    Observable: Observable,
    Publisher: Publisher,
    publisher: publisher,
    Subscriber: Subscriber,
    subscriber: subscriber,
    lift: lift,
    snapshot: snapshot,

    // deprecated aliases
    observe: publisher,
    thunk: subscriber
};


},{}],"/canvas/canvas-example.js":[function(require,module,exports){

var canvas = document.createElement('canvas');
canvas.width  = 150;
canvas.height = 250;

var ctx = canvas.getContext('2d');  

ctx.font = "20pt Arial";
var s = "Hello world";
var sz = ctx.measureText(s);
ctx.fillText(sz.width + 'px', 10, 50);
ctx.fillText(s, 10, 80);

ctx.moveTo(10, 82);
ctx.lineTo(10 + sz.width, 82);
ctx.stroke();

ctx.fillStyle = "rgb(200,0,0)";  
ctx.fillRect(20, 120, 55, 50);  

ctx.fillStyle = "rgba(0, 0, 200, 0.5)";  
ctx.fillRect(40, 140, 55, 50);

module.exports = canvas;


},{}],"/canvas/canvas-pie-example.js":[function(require,module,exports){
var canvas = document.createElement('canvas');

if (!canvas.getContext){
    alert('Sorry, but to see this demo, you need a web browser that supports the "canvas" element.');
}

canvas.height = 1000;
canvas.width  = 1000;

var ctx = canvas.getContext('2d');

for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 3; j++) {
        ctx.beginPath();
        var x          = 100 + j * 100;               // x coordinate
        var y          = 100 + i * 100;               // y coordinate
        var radius     = 40;                          // Arc radius
        var startAngle = 0;                           // Starting point on circle
        var endAngle   = Math.PI + (Math.PI * j) / 2; // End point on circle
        var clockwise  = i % 2 === 0 ? false : true;  // clockwise or counterclockwise

        ctx.arc(x, y, radius, startAngle, endAngle, clockwise);

        if (i > 1){
          ctx.fill();
        } else {
          ctx.stroke();
        }
    }
}

module.exports = canvas;


},{}],"/canvas/index.js":[function(require,module,exports){
var dom = require('yoinkjs/dom');

var modules = ['canvas-example', 'canvas-pie-example'];

function mkRow (nm) {
    return dom.element({
        name: 'a',
        attributes: {href: nm + '.html'},
        style: {display: 'block'},
        contents: nm
    });
}

var rows = [
    dom.element({name: 'h3', contents: 'Modules'})
];

module.exports = dom.element({
    name: 'div',
    style: {margin: '10px'},
    contents: rows.concat(modules.map(mkRow))
});


},{"yoinkjs/dom":1}],"/hello/index.js":[function(require,module,exports){
module.exports = "Hello World!";

},{}],"/index.js":[function(require,module,exports){
var dom = require('yoinkjs/dom');

var modules = ['hello', 'canvas', 'layout', 'react'];

function mkRow (nm) {
    return dom.element({
        name: 'a',
        attributes: {href: nm + '/index.html'},
        style: {display: 'block'},
        contents: nm
    });
}

var rows = [
    dom.element({name: 'h3', contents: 'Modules'})
];

module.exports = dom.element({
    name: 'div',
    style: {margin: '10px'},
    contents: rows.concat(modules.map(mkRow))
});

},{"yoinkjs/dom":1}],"/layout/index.js":[function(require,module,exports){
//
// 2D Layout tests
//

var dom = require('yoinkjs/dom');
var layout = require('yoinkjs/layout');

var gap10 = layout.gap(10);

var testImg = dom.element({
    name: 'div',
    style: {
        height: '100px',
        width: '100px',
        border: '1px solid',
        padding: '5px',
        borderRadius: '5px'
    }
});

var separator = layout.gap(30);

function label(s, e) {
    return layout.hcat([dom.element({name: 'p', style: {width: '70px'}, contents: s}), gap10, e]);
}

var images = [testImg, gap10, testImg, gap10, testImg];
module.exports = layout.hcat([
    gap10,
    layout.vcat([
        gap10,
        layout.vcat([
            label('hcat', layout.hcat(images)), separator,
            label('vcat', layout.vcat(images)), separator,
        ]),
        gap10
    ]),
    gap10
]);



},{"yoinkjs/dom":1,"yoinkjs/layout":2}],"/react/gizmos.js":[function(require,module,exports){
var dom = require('yoinkjs/dom');
var observable = require('yoinkjs/observable');

var inputStyle = {
    fontSize: '24pt',
    margin: '10px'
};

function numInput(v) {

    function onChange(evt) {
        if (v instanceof observable.Observable) {
            v.set(parseInt(evt.target.value, 10));
        }
    }

    return dom.element({
        name: 'input',
        attributes: {
            type: 'number',
            value: v
        },
        style: inputStyle,
        handlers: {
            change: onChange,
            keyup: onChange
        }
    });
}

function numOutput(v) {
    return dom.element({
        name: 'input',
        attributes: {
            type: 'number',
            value: v,
            readOnly: true
        },
        style: inputStyle
    });
}

module.exports = {
    numInput: numInput,
    numOutput: numOutput
}

},{"yoinkjs/dom":1,"yoinkjs/observable":5}],"/react/index.js":[function(require,module,exports){
var gizmos = require('./gizmos');
var observable = require('yoinkjs/observable');
var layout = require('yoinkjs/layout');

function inc(x) {
    return x + 1;
}

var o = observable.publisher(0);
module.exports = layout.vcat([
    gizmos.numInput(o),
    gizmos.numOutput(o.map(inc))
]);

},{"./gizmos":"/react/gizmos.js","yoinkjs/layout":2,"yoinkjs/observable":5}],"/react/index_test.js":[function(require,module,exports){
var assert = require('assert');
var div = require('./index');

var inputValue = div.contents[0].attributes.value;
var outputValue = div.contents[1].attributes.value;

// Verify initial state.
assert.equal(inputValue.get(), 0);
assert.equal(outputValue.get(), 1);

// Set the left value to 5 and verify the output
// text box contains the incremented value.
inputValue.set(5);
assert.equal(inputValue.get(), 5);
assert.equal(outputValue.get(), 6);

// Ensure it tolerates strings.
inputValue.set(parseInt('boom?', 10));
assert.equal(isNaN(inputValue.get()), true);
assert.equal(isNaN(outputValue.get()), true);

module.exports = 'passed!';


},{"./index":"/react/index.js","assert":6}],6:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":11}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],10:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],11:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":10,"_process":9,"inherits":8}],"yoink":[function(require,module,exports){
var dom = require('./dom');
var observable = require('./observable');

// Render a ReactiveElement.  If it contains observables, poll it
// for updates.
function render(gizmo) {
    var nd = gizmo;
    if (typeof gizmo === 'string') {
        nd = document.createTextNode(gizmo);
    } else if (gizmo instanceof dom.ReactiveElement)  {
        nd = gizmo.render();
    }

    if (nd instanceof observable.Observable) {
        var obs = nd;
        setInterval(function(){obs.get();}, 30);
        nd = obs.get();
    }

    return nd;
}

module.exports = {
    render: render
};


},{"./dom":1,"./observable":5}]},{},[]);
