'use strict';

const test = require('tape-async');
const commandPalette = require('..');

test('add details files', t => {
  const results = commandPalette.create(Object.keys(document.body.style).reverse());
  global.openWin = () => {
    const BrowserWindow = require('remote').require('browser-window');
    const win = BrowserWindow.getAllWindows()[0];

    win.setSize(800, 600);
    win.center();
    win.show();
  };

  global.openWin();
  document.body.appendChild(results);
  console.log(results);
});
