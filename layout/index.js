//
// 2D Layout tests
//

var dom = require('yoinkjs/dom');
var layout = require('yoinkjs/layout');

var gap10 = layout.gap(10);

var testImg = dom.element({
    name: 'div',
    style: {
        height: '100px',
        width: '100px',
        border: '1px solid',
        padding: '5px',
        borderRadius: '5px'
    }
});

var separator = layout.gap(30);

function label(s, e) {
    return layout.hcat([dom.element({name: 'p', style: {width: '70px'}, contents: s}), gap10, e]);
}

var images = [testImg, gap10, testImg, gap10, testImg];
module.exports = layout.hcat([
    gap10,
    layout.vcat([
        gap10,
        layout.vcat([
            label('hcat', layout.hcat(images)), separator,
            label('vcat', layout.vcat(images)), separator,
        ]),
        gap10
    ]),
    gap10
]);


