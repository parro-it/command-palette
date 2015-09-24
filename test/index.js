'use strict';

const test = require('tape-async');
const commandPalette = require('..');
const commands = require('./fixtures/commands');
const rum = require('rum-node');

global.openChrome = () => {
  const BrowserWindow = require('remote').require('browser-window');
  const win = BrowserWindow.getAllWindows()[0];

  win.setSize(800, 600);
  win.center();
  win.show();
};


function recreatePalette() {
  document.body.innerHTML = '';
  const palette = commandPalette.create(commands);
  palette.appendTo(document.body);
  return palette;
}


test('command-palette: element return root widget element', t => {
  const palette = recreatePalette();
  const nav = palette.element;
  t.equal(nav.tagName, 'NAV');
});


test('command-palette: contain all commands', t => {
  const palette = recreatePalette();
  const commandElements = palette.element.querySelectorAll('li');
  t.equal(commandElements.length, commands.length);
});


test('command-palette: commands are ordered', t => {
  const palette = recreatePalette();
  const commandElements = Array.from(palette.element.querySelectorAll('li'));
  window.commandElements=commandElements
  window.rum = rum
  function stringSort (a, b) {
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
