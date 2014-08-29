var deps = [
    '/stdlib/tag.js',
    '/stdlib/observable.js'
];

function increment(x) {
    return String(parseInt(x, 10) + 1);
}

function onReady(tag, observable) {
    var value = observable.observe("0");

    function onChange(evt) {
       value.set(evt.target.value);
    }

    var input = tag.tag({
        name: 'input',
        attributes: {type: 'number', value: value},
        handlers: {keyup: onChange, change: onChange}
    });

    var inc = observable.lift(increment);
    var output = tag.tag({
        name: 'input',
        attributes: {type: 'number', value: inc(value), readOnly: true}
    });

    var div = tag.tag({name: 'div', contents: [input, output]});

    yoink.define(div);
}

yoink.require(deps, onReady);

