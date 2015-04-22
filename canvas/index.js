var dom = require('poochie/dom');

var modules = ['canvas-example', 'canvas-pie-example'];

function mkRow (nm) {
    return dom.element({
        name: 'a',
        attributes: {href: nm + '.html'},
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

