const themePicker = document.querySelector('#theme');
const themes = ['matrix', 'amber', 'cyan', 'violet', 'rose'];
const themeStorageKey = 'portfolio-color-theme';
function setTheme(value) {
  const theme = themes.includes(value) ? value : 'matrix';
  document.body.dataset.theme = theme;
  themePicker.value = theme;
}
let savedTheme = 'matrix';
try { savedTheme = localStorage.getItem(themeStorageKey) || 'matrix'; } catch {}
setTheme(savedTheme);
themePicker.addEventListener('change', () => {
  setTheme(themePicker.value);
  try { localStorage.setItem(themeStorageKey, themePicker.value); } catch {}
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
  const selected = tabs.findIndex(tab => tab.hash === '#' + id);
  const activeIndex = selected < 0 ? 0 : selected;
  tabs.forEach((tab, index) => {
    const active = index === activeIndex;
    tab.setAttribute('aria-selected', String(active));
    tab.setAttribute('tabindex', active ? '0' : '-1');
    panels[index].hidden = !active;
  });
  document.querySelector('#current-path').textContent = panels[activeIndex].id;
  document.title = `Laren Mark D’Cruz | ${tabs[activeIndex].textContent.trim().replace(/^\[|\]$/g, '')}`;
  if (focus) tabs[activeIndex].focus();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}
function navigate(id, options = {}) {
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
const output = document.querySelector('#terminal-output');
const input = document.querySelector('#terminal-input');
document.querySelector('#terminal-form').addEventListener('submit', event => {
  event.preventDefault();
  const command = input.value.trim().toLowerCase();
  input.value = '';
  if (!command) return;
  if (command === 'clear') { output.replaceChildren(); return; }
  const entry = document.createElement('p');
  const routes = {home:'home',work:'work',projects:'work',skills:'skills',resume:'resume',contact:'contact'};
  const destination = routes[command.replace(/^cd\s+/, '').replace(/[./]/g, '')];
  let message;
  if (destination) { navigate(destination, { scroll: true }); message = `Opening /${destination}…`; }
  else if (command === 'help') message = 'Commands: home, work, skills, resume, contact, ls, whoami, clear.\nYou can also use cd work (or another section).';
  else if (command === 'ls') message = 'home/  work/  skills/  resume/  contact/';
  else if (command === 'whoami') message = 'Laren Mark D’Cruz — Software Engineer & Site Reliability Engineer. Currently at Cisco/Splunk. Building websites in Victoria, BC.';
  else message = `Command not found: ${command}. Type help to see available commands.`;
  entry.textContent = `$ ${command}\n${message}`;
  output.append(entry);
  while (output.children.length > 6) output.firstElementChild.remove();
});
