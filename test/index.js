const test = require('tape-async');
const commandPalette = require('..');

test('add details files', function *(t) {
  const result = yield commandPalette();
  t.equal(result, 42);
});
