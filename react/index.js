var deps = [
    'gizmos.js',
    '/stdlib/observable.js'
];

function increment(x) {
    return String(parseInt(x, 10) + 1);
}

function onReady(gizmos, observable) {
    var o = observable.publisher("0");
    var oIncrement = observable.lift(increment);
    var box = gizmos.box([
        gizmos.numInput(o),
        gizmos.numOutput(oIncrement(o))
    ]);
    define(box);
}

require(deps, onReady);

