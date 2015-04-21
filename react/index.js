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
