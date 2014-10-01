var deps = [
    '/stdlib/tag.js'
];

function onReady(tag) {

    function numInput(v, readOnly) {
        return tag.tag({
            name: 'input',
            attributes: {
                type: 'number',
                value: v,
                readOnly: readOnly
            }
        });
    }

    function box(contents) {
        return tag.tag({
            name: 'div',
            contents: contents
        });
    }

    define({
        numInput: numInput,
        box: box
    });
}

require(deps, onReady);

