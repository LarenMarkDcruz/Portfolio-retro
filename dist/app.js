import { initializeTerminal } from './terminal.js?v=matrix-default';
import { renderFocusLine, selectFocusLine } from './focus_lines.js';
import { createIntroTyping } from './intro_typing.js?v=cursor-at-end';
import { initializeAsciiSculpture } from './ascii_sculpture.js?v=hollow-fusion';
import { selectIntroText } from './intro_sentences.js';

document.querySelector('.intro-copy').textContent = selectIntroText([Math.random(), Math.random(), Math.random()]);
const playIntroTyping = createIntroTyping(document.querySelector('#home'));

renderFocusLine({ element: document.querySelector('.cpp-meta'), declaration: selectFocusLine(Math.random()) });

const themePicker = document.querySelector('#theme');
const themes = ['matrix', 'amber', 'cyan', 'violet', 'rose'];
function setTheme(value) {
  const theme = themes.includes(value) ? value : 'matrix';
  document.body.dataset.theme = theme;
  themePicker.value = theme;
}
setTheme('matrix');
themePicker.addEventListener('change', () => {
  setTheme(themePicker.value);
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  document.querySelectorAll('[data-category]').forEach(project => {
    project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
  });
}));
const tabs = Array.from(document.querySelectorAll('nav a'));
const panels = tabs.map(tab => document.querySelector(tab.hash));
const tablist = document.querySelector('nav');
tablist.setAttribute('role', 'tablist');
tabs.forEach((tab, index) => {
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', panels[index].id);
  panels[index].setAttribute('role', 'tabpanel');
  panels[index].setAttribute('aria-labelledby', tab.id);
  panels[index].setAttribute('tabindex', '0');
});
function showTab(id, { focus = false, scroll = false } = {}) {
  if (id === 'contact') id = 'beyond';
  const selected = tabs.findIndex(tab => tab.hash === '#' + id);
  const activeIndex = selected < 0 ? 0 : selected;
  tabs.forEach((tab, index) => {
    const active = index === activeIndex;
    tab.setAttribute('aria-selected', String(active));
    tab.setAttribute('tabindex', active ? '0' : '-1');
    panels[index].hidden = !active;
  });
  document.querySelector('#current-path').textContent = panels[activeIndex].id;
  const filename = tabs[activeIndex].textContent.trim().replace(/^\[|\]$/g, '');
  document.querySelector('#terminal-location').textContent = `~/${filename}`;
  document.title = 'Meet Laren';
  if (focus) tabs[activeIndex].focus();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  playIntroTyping();
}
function navigate(id, options = {}) {
  if (id === 'contact') id = 'beyond';
  if (!panels.some(panel => panel.id === id)) return;
  if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
  showTab(id, options);
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
  const id = link.hash.slice(1);
  if (!panels.some(panel => panel.id === id)) return;
  event.preventDefault();
  const isTab = tabs.includes(link);
  navigate(id, { focus: isTab, scroll: true });
  if (!isTab) document.querySelector('#' + id).focus({ preventScroll: true });
});
tablist.addEventListener('keydown', event => {
  const index = tabs.indexOf(event.target);
  if (index < 0) return;
  let next;
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else if (event.key === ' ') next = index;
  else return;
  event.preventDefault();
  navigate(panels[next].id, { focus: true });
});
function restoreTab() { showTab(location.hash.slice(1)); }
window.addEventListener('hashchange', restoreTab);
window.addEventListener('popstate', restoreTab);
restoreTab();
/** Apply and remember the selected terminal appearance. @returns {void} */
function initializeAppearancePicker() {
  const appearancePicker = document.querySelector('#appearance');
  const appearanceStorageKey = 'portfolio-display-appearance';
  try {
    const savedAppearance = localStorage.getItem(appearanceStorageKey);
    document.body.dataset.appearance = ['dark', 'navy', 'light'].includes(savedAppearance) ? savedAppearance : 'dark';
  } catch (storageError) {
    console.warn('Appearance preference could not be read', { storageError });
  }
  appearancePicker.value = document.body.dataset.appearance;
  appearancePicker.addEventListener('change', () => {
    document.body.dataset.appearance = appearancePicker.value;
    try {
      localStorage.setItem(appearanceStorageKey, appearancePicker.value);
    } catch (storageError) {
      console.warn('Appearance preference could not be saved', { storageError });
    }
  });
}
initializeAppearancePicker();

initializeTerminal({ navigate, themes });
initializeAsciiSculpture({ artwork: document.querySelector('#ascii-sculpture'), button: document.querySelector('#sculpture-motion'), resetButton: document.querySelector('#sculpture-reset') });
