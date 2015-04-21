var dom = require('yoinkjs/dom');

var modules = ['hello', 'canvas', 'layout', 'react'];

function mkRow (nm) {
    return dom.element({
        name: 'a',
        attributes: {href: nm + '/index.html'},
        style: {display: 'block'},
        contents: nm
    });
}

var rows = [
    dom.element({name: 'h3', contents: 'Modules'})
];

module.exports = dom.element({
    name: 'div',
    style: {margin: '10px'},
    contents: rows.concat(modules.map(mkRow))
});
