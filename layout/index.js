//
// 2D Layout tests
//

var deps = [
    '/stdlib/dom.js',
    '/stdlib/layout.js'
];

function onReady(dom, layout) {

    function testImg() {
        return dom.element({name: 'img', attributes: {src: 'logo.png'}, style: {border: '1px solid', padding: '5px', borderRadius: '5px'}});
    }

    function hcatTest() {
        return layout.hcat([
            dom.element({name: 'span', style: {height: '20px', width: '70px'}, contents: 'hello'}), 
            layout.gap(10),
            dom.element({name: 'span', style: {height: '20px', width: '70px'}, contents: 'world'})
        ]);
    }

    function test() {
        var separator = layout.gap(30);

        function label(s, e) {
            return layout.hcat([dom.element({name: 'p', style: {width: '70px'}, contents: s}), layout.gap(10), e]);
        }

        return layout.hcat([
            layout.gap(10),
            layout.vcat([
                layout.gap(10),
                layout.vcat([
                    label('hcat', layout.hcat([testImg(), layout.gap(10), testImg(), layout.gap(10), testImg()])), separator,
                    label('vcat', layout.vcat([testImg(), layout.gap(10), testImg(), layout.gap(10), testImg()])), separator,
                ]),
                layout.gap(10)
            ]),
            layout.gap(10)
        ]);
    }

    define(test());
}


require(deps, onReady);

