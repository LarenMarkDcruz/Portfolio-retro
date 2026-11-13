const SECTION_NAMES = ['home', 'skills', 'resume', 'work', 'contact'];
const COMMAND_NAMES = ['help', 'ls', 'pwd', 'cd', 'open', 'theme', 'mode', 'bg', 'fg', 'reset', 'size', 'history', 'whoami', 'clear'];
const MAXIMUM_HISTORY_ENTRIES = 100;
const COLOR_STORAGE_KEY = 'portfolio-terminal-colors';

/** Read a six-digit color as its relative luminance. @param {string} color @returns {number} */
function calculateLuminance(color) {
  const channels = color.match(/[a-f\d]{2}/gi).map(channel => parseInt(channel, 16) / 255);
  const linearChannels = channels.map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return linearChannels[0] * .2126 + linearChannels[1] * .7152 + linearChannels[2] * .0722;
}

/** Apply custom colors while retaining legible body text. @param {object} colors @returns {string} */
function applyCustomColors(colors) {
  const fallback = document.body.dataset.appearance === 'light' ? { bg: '#eee4d2', fg: '#202b25' } : { bg: document.body.dataset.appearance === 'navy' ? '#0f0f23' : '#000000', fg: '#d5ddd3' };
  const background = colors.bg || fallback.bg;
  const foreground = colors.fg || fallback.fg;
  const luminances = [calculateLuminance(background), calculateLuminance(foreground)].sort((first, second) => second - first);
  if ((luminances[0] + .05) / (luminances[1] + .05) < 4.5) return 'Colors need more contrast. Choose a lighter foreground or darker background (or vice versa).';
  for (const [property, value] of Object.entries(colors)) {
    document.body.style.setProperty(property === 'bg' ? '--bg' : '--text', value);
  }
  if (colors.fg) document.body.style.setProperty('--muted', colors.fg);
  return '';
}

/** Persist color preferences when browser storage is available. @param {object} colors @returns {void} */
function saveCustomColors(colors) {
  try { localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors)); }
  catch (storageError) { console.warn('Terminal colors could not be saved', { storageError }); }
}

/** Restore validated preferences without trusting stored CSS. @returns {object} */
function restoreCustomColors() {
  try {
    const savedColors = JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY) || '{}');
    const colors = Object.fromEntries(Object.entries(savedColors).filter(([key, value]) => ['bg', 'fg'].includes(key) && /^#[a-f\d]{6}$/i.test(value)));
    return applyCustomColors(colors) ? {} : colors;
  } catch (storageError) {
    console.warn('Terminal colors could not be restored', { storageError });
    return {};
  }
}

/** Reset custom colors to the selected palette. @param {object} state @returns {void} */
function resetCustomColors(state) {
  state.colors = {};
  for (const property of ['--bg', '--text', '--muted']) document.body.style.removeProperty(property);
  saveCustomColors(state.colors);
}

/** Build the terminal command reference. @param {string[]} themes @returns {string} */
function describeCommands(themes) {
  return [
    'Portfolio terminal — website commands, not a system shell.',
    'ls · pwd · cd <section> · open <section|github|linkedin|resume>',
    `theme <${themes.join('|')}> · mode <dark|navy|light>`,
    'bg #101018 · fg #eeeeee · reset (restore palette colors)',
    'size <compact|normal|large> · history · whoami · clear',
    '↑↓ command history · Tab complete · Ctrl+L clear · Ctrl+C cancel',
    'Sections: home, skills, resume, work, contact. cd .. returns home.',
  ].join('\n');
}

/** Change a picker through the same path as a pointer interaction. @param {object} selection @returns {string} */
function changeDisplaySelection({ selector, value, choices }) {
  if (!choices.includes(value)) return `Choose one: ${choices.join(', ')}.`;
  const picker = document.querySelector(selector);
  picker.value = value;
  picker.dispatchEvent(new Event('change', { bubbles: true }));
  return `Selected ${value}.`;
}

/** Resolve section filenames and paths to the site's routes. @param {string} destination @returns {string} */
function resolveSection(destination) {
  const normalized = destination.replace(/^~?\//, '').replace(/\/$/, '').replace(/\.(cpp|hpp|md)$/, '');
  if (['', '~', '..', 'main'].includes(normalized)) return 'home';
  return normalized === 'projects' ? 'work' : normalized;
}

/** Navigate within the site or open a supplied profile. @param {object} request @returns {string} */
function openDestination({ command, destination, navigate }) {
  const externalLinks = { github: '#home a[href*="github.com"]', linkedin: '#home a[href*="linkedin.com"]', resume: '.resume-document' };
  if (command === 'open' && externalLinks[destination]) {
    const link = document.querySelector(externalLinks[destination]);
    const openedWindow = window.open(link.href, '_blank');
    if (!openedWindow) return 'Your browser blocked the new tab. Use the matching link on the page.';
    openedWindow.opener = null;
    return `Opened ${destination} in a new tab.`;
  }
  const section = resolveSection(destination);
  if (!SECTION_NAMES.includes(section)) return `Section not found: ${destination}. Try ls.`;
  navigate(section);
  return `Opening /${section}.`;
}

/** Change validated custom background or text colors. @param {object} request @returns {string} */
function changeCustomColor({ command, value, state }) {
  if (!/^#[a-f\d]{6}$/i.test(value)) return `Usage: ${command} #rrggbb (six hexadecimal digits).`;
  const colors = { ...state.colors, [command]: value };
  const error = applyCustomColors(colors);
  if (error) return error;
  state.colors = colors;
  saveCustomColors(colors);
  return `${command === 'bg' ? 'Background' : 'Foreground'} set to ${value}. Use reset to restore the palette.`;
}

/** Resize the terminal without moving it from the document flow. @param {string} size @returns {string} */
function changeTerminalSize(size) {
  const heightBySize = { compact: 200, normal: 320, large: 560 };
  if (!heightBySize[size]) return 'Usage: size compact|normal|large';
  document.querySelector('.terminal-content').style.height = `${heightBySize[size]}px`;
  document.querySelector('#terminal-height').value = heightBySize[size];
  return `Terminal size: ${size}.`;
}

/** Execute navigation and display commands. @param {object} request @returns {string} */
function executeCommand({ line, state, dependencies }) {
  const [command, ...argumentsList] = line.toLowerCase().split(/\s+/);
  const value = argumentsList.join(' ');
  if (command === 'help') return describeCommands(dependencies.themes);
  if (command === 'ls') return SECTION_NAMES.map(section => `${section}/`).join('  ');
  if (command === 'pwd') return `/${document.querySelector('#current-path').textContent}`;
  if (command === 'history') return state.history.map((entry, index) => `${index + 1}  ${entry}`).join('\n');
  if (command === 'whoami') return 'Laren Mark D’Cruz — Backend Engineer / Site Reliability Engineer. Cisco/Splunk. Victoria, BC.';
  if (command === 'size') return changeTerminalSize(value);
  if (['bg', 'fg'].includes(command)) return changeCustomColor({ command, value, state });
  if (command === 'reset') { resetCustomColors(state); return 'Custom colors reset.'; }
  if (['theme', 'mode'].includes(command)) return changeDisplaySelection({ selector: command === 'theme' ? '#theme' : '#appearance', value, choices: command === 'theme' ? dependencies.themes : ['dark', 'navy', 'light'] });
  if (['cd', 'open'].includes(command)) return openDestination({ command, destination: value, navigate: dependencies.navigate });
  if (SECTION_NAMES.includes(command)) return openDestination({ command: 'cd', destination: command, navigate: dependencies.navigate });
  return `Command not found: ${command}. Type help to see website commands.`;
}

/** Complete known commands and their supported arguments. @param {object} context @returns {void} */
function completeInput({ input, output, themes }) {
  const words = input.value.toLowerCase().split(/\s+/);
  const argumentChoices = { cd: SECTION_NAMES, open: [...SECTION_NAMES, 'github', 'linkedin'], theme: themes, mode: ['dark', 'navy', 'light'], size: ['compact', 'normal', 'large'] };
  const choices = words.length === 1 ? COMMAND_NAMES : argumentChoices[words[0]] || [];
  const matches = choices.filter(choice => choice.startsWith(words.at(-1)));
  if (matches.length === 1) { words[words.length - 1] = matches[0]; input.value = words.join(' '); }
  if (matches.length > 1) appendOutput({ output, line: input.value, message: matches.join('  ') });
}

/** Append plain text output and keep the scrollback bounded. @param {object} entry @returns {void} */
function appendOutput({ output, line, message }) {
  const entry = document.createElement('p');
  entry.textContent = `$ ${line}\n${message}`;
  output.append(entry);
  while (output.children.length > MAXIMUM_HISTORY_ENTRIES) output.firstElementChild.remove();
  entry.scrollIntoView({ block: 'nearest' });
}

/** Add command history and familiar keyboard shortcuts. @param {object} context @returns {void} */
function bindTerminalKeyboard(context) {
  const { input, output, state } = context;
  input.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !event.shiftKey && input.value.trim()) { event.preventDefault(); completeInput(context); return; }
    if (event.ctrlKey && ['l', 'c'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      if (event.key.toLowerCase() === 'l') output.replaceChildren();
      else input.value = '';
      return;
    }
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (state.historyIndex === state.history.length) state.draft = input.value;
    state.historyIndex = Math.max(0, Math.min(state.history.length, state.historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    input.value = state.history[state.historyIndex] ?? state.draft;
  });
}

/** Wire accessible height controls alongside native drag resizing. @returns {void} */
function bindTerminalResizing() {
  const heightControl = document.querySelector('#terminal-height');
  heightControl.addEventListener('input', () => {
    document.querySelector('.terminal-content').style.height = `${heightControl.value}px`;
  });
  document.querySelector('#terminal-reset').addEventListener('click', () => changeTerminalSize('normal'));
  const observer = new ResizeObserver(entries => {
    heightControl.value = Math.round(entries[0].target.getBoundingClientRect().height);
  });
  observer.observe(document.querySelector('.terminal-content'));
}

/** Initialize the website terminal with replaceable routing dependencies. @param {object} dependencies @returns {void} */
export function initializeTerminal(dependencies) {
  const output = document.querySelector('#terminal-output');
  const input = document.querySelector('#terminal-input');
  const state = { history: [], historyIndex: 0, draft: '', colors: restoreCustomColors() };
  bindTerminalKeyboard({ input, output, state, themes: dependencies.themes });
  bindTerminalResizing();
  for (const selector of ['#theme', '#appearance']) document.querySelector(selector).addEventListener('change', () => resetCustomColors(state));
  document.querySelector('#terminal-form').addEventListener('submit', event => {
    event.preventDefault();
    const line = input.value.trim();
    input.value = '';
    if (!line) return;
    state.history.push(line);
    if (state.history.length > MAXIMUM_HISTORY_ENTRIES) state.history.shift();
    state.historyIndex = state.history.length;
    state.draft = '';
    if (line.toLowerCase() === 'clear') { output.replaceChildren(); return; }
    appendOutput({ output, line, message: executeCommand({ line, state, dependencies }) });
    input.focus({ preventScroll: true });
  });
}
