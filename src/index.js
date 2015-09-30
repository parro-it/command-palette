'use strict';

const Jets = require('jets');
const fs = require('fs');
const insertCss = require('insert-css');
const css = fs.readFileSync(__dirname + '/style.css');
const EventEmitter = require('events').EventEmitter;
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
  search.type = 'search';

  const ul = document.createElement('ul');

  const nav = document.createElement('nav');
  nav.id = guid();
  nav.style.display = 'none';
  nav.classList.add('command-palette');

  let isfirst = true;
  const addCommand = cmd => {
    const li = document.createElement('li');
    if (isfirst) {
      li.classList.add('active');
      isfirst = false;
    }
    li.appendChild(document.createTextNode(cmd));
    ul.appendChild(li);
    return li;
  };

  commands.sort();
  const first = addCommand(commands[0]);
  first.classList.add('active');
  commands.slice(1).forEach(addCommand);


  nav.appendChild(search);
  nav.appendChild(ul);

  return Object.assign(new EventEmitter(), {
    element: nav,
    search: search,
    list: ul,
    active() {
      const elm = this._activeElement();
      return (elm && elm.innerText) || '';
    },

    _activeElement() {
      return this.element.querySelector('.active');
    },

    show() {
      this.element.style.display = '';
    },

    hide() {
      this.element.style.display = 'none';
    },

    _initSearchInput() {
      if (this.called) {
        return;
      }
      this.called = true;


      search.addEventListener('keyup', e => {
        const currentlyActive = this._activeElement();

        if (e.which === 40) {
          currentlyActive.classList.remove('active');
          currentlyActive.nextSibling.classList.add('active');
        } else if (e.which === 38) {
          currentlyActive.classList.remove('active');
          currentlyActive.previousSibling.classList.add('active');
        }
      });

      search.addEventListener('input', () => {
        const currentlyActive = this._activeElement();

        if (currentlyActive) {
          currentlyActive.classList.remove('active');
        }

        setTimeout(() => {
          const searchText = this.jet.styleTag.innerText;
          let firstVisible;

          if (searchText === '') {
            firstVisible = this.list.children[0];
          } else if (this.jet) {
            firstVisible = document.querySelector(
            this.jet.styleTag.innerText
              .slice(0, -15)
              .replace(':not(', ' ')
            );
          } else {
            firstVisible = null;
          }

          if (firstVisible) {
            firstVisible.classList.add('active');
          }
        });
      });
    },


    _initJet() {
      this.jet = new Jets({
        searchTag: `#${nav.id} input`,
        contentTag: `#${nav.id} ul`
      });
    },

    appendTo(parent) {
      parent.appendChild(this.element);
      this._initJet();
      this._initSearchInput();
    }
  });
};
