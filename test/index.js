'use strict';

const test = require('tape-async');
const commandPalette = require('..');
const commands = require('./fixtures/commands');
const rum = require('rum-node');


function recreatePalette() {
  document.body.innerHTML = '';
  const palette = commandPalette.create(commands);
  palette.appendTo(document.body);
  return palette;
}

test('palette element property return root widget element', t => {
  const palette = recreatePalette();
  const nav = palette.element;
  t.equal(nav.tagName, 'NAV');
});


test('palette DOM contain all commands', t => {
  const palette = recreatePalette();
  const commandElements = palette.element.querySelectorAll('li');
  t.equal(commandElements.length, commands.length);
});

test('palette.show make the element visible', t => {
  const palette = recreatePalette();
  palette.show();
  t.equal(palette.element.style.display, '');
});

test('palette start invisible', t => {
  const palette = recreatePalette();
  t.equal(palette.element.style.display, 'none');
});

test('palette.hide make the element invisible', t => {
  const palette = recreatePalette();
  palette.show();
  palette.hide();
  t.equal(palette.element.style.display, 'none');
});


test('palette.active return the command currently active', t => {
  const palette = recreatePalette();
  t.equal(palette.active(), 'Align JSON formatting');
});

function simulateKeyPress(elm, k) {
  const evt = document.createEvent('KeyboardEvent');
  const init = evt.initKeyboardEvent ? evt.initKeyboardEvent.bind(evt) : evt.initKeyEvent.bind(evt);
  // Chromium Hack
  Object.defineProperty(evt, 'keyCode', {
    get() {
      return this.keyCodeVal;
    }
  });
  Object.defineProperty(evt, 'which', {
    get() {
      return this.keyCodeVal;
    }
  });

  init.call(evt, 'keyup', true, true, document.defaultView, false, false, false, false, k, k);
  init.call(evt, 'input', true, true, document.defaultView, false, false, false, false, k, k);
  evt.keyCodeVal = k;

  elm.dispatchEvent(evt);
}


test('key down activate next command', t => {
  const palette = recreatePalette();
  simulateKeyPress(palette.search, 40);
  return new Promise(resolve => setTimeout(() => {
    t.equal(palette.active(), 'Align table with Regular');
    resolve();
  }, 100));
});

test('key up activate prev command', t => {
  const palette = recreatePalette();
  simulateKeyPress(palette.search, 40);
  simulateKeyPress(palette.search, 40);
  simulateKeyPress(palette.search, 38);
  return new Promise(resolve => setTimeout(() => {
    t.equal(palette.active(), 'Align table with Regular');
    resolve();
  }, 100));
});

test('can be filtered by text', t => {
  const palette = recreatePalette();
  simulateKeyPress(palette.search, 'C'.charCodeAt(0));
  return new Promise(resolve => setTimeout(() => {
    t.equal(palette.active(), 'Clear all bookmarks');
    resolve();
  }, 100));
});


test('commands are ordered', t => {
  const palette = recreatePalette();
  const commandElements = Array.from(palette.element.querySelectorAll('li'));

  function stringSort(a, b) {
    if (a === b) {
      return 0;
    }

    return a < b ? -1 : 1;
  }

  t.ok(rum.arr.sorted(
    commandElements.map(li => li.innerText),
    stringSort
  ), 'commands are ordered');
});

if (global.collider) {
  global.commandPalette = recreatePalette();

  test.syncTest('quit test environment.', t => {
    process.stdout.write('1..10\n');
    t.ok(true, 'quit');
    setTimeout(() => global.collider.quit(), 100);
  });
}

