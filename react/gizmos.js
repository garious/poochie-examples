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
