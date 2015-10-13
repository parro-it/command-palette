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

function simulateKeyPress(elm, k, type) {
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

  evt.keyCodeVal = k;
  init.call(evt, type, true, true, document.defaultView, false, false, false, false, k, k);

  elm.dispatchEvent(evt);
  return evt;
}


test('key down activate next command', t => {
  const palette = recreatePalette();
  simulateKeyPress(palette.search, 40, 'keyup');
  t.equal(palette.active(), 'Align table with Regular');
});


test('enter select active command', t => {
  const palette = recreatePalette();
  return new Promise(resolve => {
    palette.on('command', cmd => {
      t.equal(cmd, 'Align table with Regular');
      resolve();
    });
    simulateKeyPress(palette.search, 40, 'keyup');
    simulateKeyPress(palette.search, 13, 'keyup');
  });
});

test('esc cancel command selection', t => {
  const palette = recreatePalette();
  return new Promise(resolve => {
    palette.on('cancel', () => {
      t.ok(true);
      resolve();
    });
    simulateKeyPress(palette.search, 27, 'keyup');
  });
});

test('palette is closed on command cancelled', t => {
  const palette = recreatePalette();
  palette.show();
  return new Promise(resolve => {
    palette.on('cancel', () => {
      t.equal(palette.element.style.display, 'none');
      resolve();
    });
    simulateKeyPress(palette.search, 27, 'keyup');
  });
});

test('palette is closed on command selected', t => {
  const palette = recreatePalette();
  palette.show();
  return new Promise(resolve => {
    palette.on('command', () => {
      t.equal(palette.element.style.display, 'none');
      resolve();
    });
    simulateKeyPress(palette.search, 40, 'keyup');
    simulateKeyPress(palette.search, 13, 'keyup');
  });
});


test('page down activate next 10 command', t => {
  const palette = recreatePalette();
  simulateKeyPress(palette.search, 34, 'keyup');
  t.equal(palette.active(), 'Delete to start of line');
});

test('activateNext activate next n command', t => {
  const palette = recreatePalette();
  palette.activateNext(10);
  t.equal(palette.active(), 'Delete to start of line');
});


test('activateNext activate next command', t => {
  const palette = recreatePalette();
  palette.activateNext();
  t.equal(palette.active(), 'Align table with Regular');
});

test('activatePrev activate prev n command', t => {
  const palette = recreatePalette();
  palette.activateNext(20);
  palette.activatePrev(10);
  t.equal(palette.active(), 'Delete to start of line');
});


test('activatePrev before first command activate it', t => {
  const palette = recreatePalette();
  palette.activateNext(2);
  palette.activatePrev(10);
  t.equal(palette.active(), 'Align JSON formatting');
});

test('activateNext after last command activate it', t => {
  const palette = recreatePalette();
  palette.activateNext(100);
  t.equal(palette.active(), 'Unfold code');
});


test('activatePrev activate prev command', t => {
  const palette = recreatePalette();
  palette.activateNext(2);
  palette.activatePrev(1);
  t.equal(palette.active(), 'Align table with Regular');
});

test('key up activate prev command', t => {
  const palette = recreatePalette();
  simulateKeyPress(palette.jet.search_tag, 40, 'keyup');
  simulateKeyPress(palette.jet.search_tag, 40, 'keyup');
  simulateKeyPress(palette.jet.search_tag, 38, 'keyup');
  t.equal(palette.active(), 'Align table with Regular');
});


test('page up activate prev 10 command', t => {
  const palette = recreatePalette();
  simulateKeyPress(palette.jet.search_tag, 34, 'keyup');
  simulateKeyPress(palette.jet.search_tag, 34, 'keyup');
  simulateKeyPress(palette.jet.search_tag, 33, 'keyup');
  t.equal(palette.active(), 'Delete to start of line');
});

test('key up activate prev command', t => {
  const palette = recreatePalette();
  palette.activateNext();
  palette.activateNext();
  palette.activatePrev();
  t.equal(palette.active(), 'Align table with Regular');
});

test('can be filtered by text', t => {
  const palette = recreatePalette();
  palette.search.focus();

  palette.jet.search_tag.value = 'c';
  const ev = simulateKeyPress(palette.jet.search_tag, 'c'.charCodeAt(0), 'keydown');
  palette.jet._onSearch(ev);
  simulateKeyPress(palette.search, 'c'.charCodeAt(0), 'input');

  return new Promise(resolve => setTimeout(() => {
    t.equal(palette.active(), 'Clear all bookmarks');
    resolve();
  }, 1));
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
  global.recreatePalette = () => {
    const p = recreatePalette();
    p.show();
    global.collider.open();
    return p;
  };

  test.syncTest('quit test environment.', t => {
    process.stdout.write('1..24\n');
    t.ok(true, 'quit');
    setTimeout(() => global.collider.quit(), 100);
  });
}

