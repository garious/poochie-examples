var assert = require('assert');
var div = require('./index');

var inputValue = div.contents[0].attributes.value;
var outputValue = div.contents[1].attributes.value;

// Verify initial state.
assert.equal(inputValue.get(), 0);
assert.equal(outputValue.get(), 1);

// Set the left value to 5 and verify the output
// text box contains the incremented value.
inputValue.set(5);
assert.equal(inputValue.get(), 5);
assert.equal(outputValue.get(), 6);

// Ensure it tolerates strings.
inputValue.set(parseInt('boom?', 10));
assert.equal(isNaN(inputValue.get()), true);
assert.equal(isNaN(outputValue.get()), true);

module.exports = 'passed!';

