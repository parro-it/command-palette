'use strict';

const Jets = require('jets');
const fs = require('fs');
const insertCss = require('insert-css');
const css = fs.readFileSync(__dirname + '/style.css');
const EventListener = require('events').EventListener;
insertCss(css);

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return ['', s4(), s4(), s4(), s4()].join('_');
}

exports.create = (commands) => {
  const search = document.createElement('input');
  const ul = document.createElement('ul');
  const nav = document.createElement('nav');
  nav.id = guid();
  search.type = 'search';
  nav.classList.add('command-palette');

  commands.sort();
  for (const cmd of commands) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(cmd));
    ul.appendChild(li);
  }

  nav.appendChild(search);
  nav.appendChild(ul);


  setTimeout(() => {
    const jet = new Jets({
      searchTag: `#${nav.id} input`,
      contentTag: `#${nav.id} ul`
    });

    search.addEventListener('input', () => {
      const currentlyActive = document.querySelector(`#${nav.id} li.active`);
      if (currentlyActive) {
        currentlyActive.classList.remove('active');
      }
      const firstVisible = document.querySelector(
        jet.styleTag.innerText
          .slice(0, -15)
          .replace(':not(', ' ')
      );
      if (firstVisible) {
        firstVisible.classList.add('active');
      }
    });
  });

  class CommandPalette extends EventListener {
    constructor() {
      super();
      this.element = nav;
    }

    show() {}

    hide() {}

    appendTo(parent) {
      parent.appendChild(this.element);
    }
  }

  return new CommandPalette();
};
