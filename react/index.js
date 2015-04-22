var gizmos = require('./gizmos');
var observable = require('poochie/observable');
var layout = require('poochie/layout');

function inc(x) {
    return x + 1;
}

var o = observable.publisher(0);
module.exports = layout.vcat([
    gizmos.numInput(o),
    gizmos.numOutput(o.map(inc))
]);
