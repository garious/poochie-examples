var deps = [
    '/stdlib/dom.js',
    '/stdlib/observable.js'
];

var inputStyle = {
    fontSize: '24pt',
    margin: '10px'
};

function onReady(dom, observable) {

    function numInput(v) {

        function onChange(evt) {
            if (v instanceof observable.Observable) {
                v.set(evt.target.value);
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

    define({
        numInput: numInput,
        numOutput: numOutput
    });
}

require(deps, onReady);

