var deps = [
    '/stdlib/dom.js'
];

function onReady(dom) {

    function numInput(v) {
        return dom.element({
            name: 'input',
            attributes: {
                type: 'number',
                value: v
            },
            handlers: {
                change: function(evt) {
                    v.set(evt.target.value);
                }
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
            }
        });
    }

    function box(contents) {
        return dom.element({
            name: 'div',
            contents: contents
        });
    }

    define({
        numInput: numInput,
        numOutput: numOutput,
        box: box
    });
}

require(deps, onReady);

