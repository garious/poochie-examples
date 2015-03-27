var deps = [
    'gizmos.js',
    '/stdlib/observable.js',
    '/stdlib/layout.js'
];

function increment(x) {
    return String(parseInt(x, 10) + 1);
}

function onReady(gizmos, observable, layout) {
    var o = observable.publisher('0');
    var box = layout.vcat([
        gizmos.numInput(o),
        gizmos.numOutput(o.map(increment))
    ]);
    define(box);
}

require(deps, onReady);

