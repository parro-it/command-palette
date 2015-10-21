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

exports.create = (commands, opts) => {
  const search = document.createElement('input');
  search.type = 'search';

  const options = opts || {};

  if (options.theme) {
    insertCss(options.theme);
  } else {
    const themeCss = fs.readFileSync(__dirname + '/theme.css');
    insertCss(themeCss);
  }

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
      return this.list.querySelector('.active');
    },

    show() {
      this.element.style.display = '';
      search.focus();
    },

    hide() {
      this.element.style.display = 'none';
    },

    activate(elm) {
      const currentlyActive = this._activeElement();
      if (currentlyActive) {
        currentlyActive.classList.remove('active');
      }

      elm.classList.add('active');
      if ((elm.offsetTop - this.list.offsetTop - this.list.clientHeight + elm.scrollHeight) > this.list.scrollTop) {
        this.list.scrollTop = elm.offsetTop - this.list.offsetTop - this.list.clientHeight + elm.scrollHeight;
      }

      if ((elm.offsetTop - this.list.offsetTop) < this.list.scrollTop) {
        this.list.scrollTop = elm.offsetTop - this.list.offsetTop;
      }
    },

    move(howMany, next, defaultResult) {
      howMany = howMany === undefined ? 1 : howMany; // eslint-disable-line no-param-reassign

      const currentlyActive = this._activeElement();

      let i = howMany;
      let newActive = currentlyActive;
      while (i-- && newActive !== null) {
        newActive = next(newActive);
      }

      if (!newActive && defaultResult) {
        newActive = defaultResult;
      }

      if (newActive) {
        this.activate(newActive);
      }
    },

    activateNext(howMany) {
      const filter = this.jet.styleTag.innerText
          .slice(0, -15)
          .replace(':not(', ' ');
      const lastElement = filter
        ? Array.from(this.list.querySelectorAll(filter)).slice(-1)[0]
        : this.list.lastElementChild;

      this.move(howMany, commandElm => {
        let next = commandElm.nextSibling;
        while (next !== null && filter && !next.matches(filter)) {
          next = next.nextSibling;
        }
        return next;
      }, lastElement );
    },

    activatePrev(howMany) {
      const filter = this.jet.styleTag.innerText
          .slice(0, -15)
          .replace(':not(', ' ');
      const firstElement = filter
        ? this.list.querySelector(filter)
        : this.list.firstElementChild;

      this.move(howMany, commandElm => {
        let prev = commandElm.previousSibling;
        while (prev !== null && filter && !prev.matches(filter)) {
          prev = prev.previousSibling;
        }
        return prev;
      }, firstElement);
    },

    _initSearchInput() {
      if (this.called) {
        return;
      }
      this.called = true;

      let repeatInterval = null;
      let repeatTimeout = null;

      const stopRepeating = ()=>{
        if (repeatInterval) {
          clearInterval(repeatInterval);
          repeatInterval = null;
        }

        if (repeatTimeout) {
          clearTimeout(repeatTimeout);
          repeatTimeout = null;
        }
      };

      const runKeyCommand = key => {
        if (key === 40) {
          this.activateNext();
        } else if (key === 38) {
          this.activatePrev();
        } else if (key === 34) {
          this.activateNext(10);
        } else if (key === 33) {
          this.activatePrev(10);
        } else if (key === 13) {
          this.hide();
          this.emit('command', this.active());
        } else if (key === 27) {
          this.hide();
          this.emit('cancel');
        }
      };

      const startRepeating = keycode => ()=>{
        repeatInterval = setInterval(() =>{
          runKeyCommand(keycode);
        }, 50);
      };

      search.addEventListener('keydown', e => {
        if (!repeatTimeout) {
          stopRepeating();
          repeatTimeout = setTimeout(startRepeating(e.which), 500);
        }
      });

      search.addEventListener('keyup', e => {
        runKeyCommand(e.which);
        stopRepeating();
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
