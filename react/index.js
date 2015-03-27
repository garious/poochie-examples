var deps = [
    'gizmos.js',
    '/stdlib/observable.js',
    '/stdlib/layout.js'
];

function inc(x) {
    return x + 1;
}

function onReady(gizmos, observable, layout) {
    var o = observable.publisher(0);
    var box = layout.vcat([
        gizmos.numInput(o),
        gizmos.numOutput(o.map(inc))
    ]);
    define(box);
}

require(deps, onReady);

