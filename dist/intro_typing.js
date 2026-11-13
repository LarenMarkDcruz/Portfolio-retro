const TYPING_WORDS_PER_MINUTE = 120;
const INTRO_GREETING_PREFIXES = Object.freeze([
  'Hey there, I’m',
  'Hello, I’m',
  'Hi there, I’m',
  'Hey, I’m',
  'Welcome, I’m',
  'Good to see you, I’m',
  'Nice to meet you, I’m',
  'Glad you’re here, I’m',
  'Hello, world! I’m',
  'Greetings, traveler. I’m',
  'Welcome to my terminal. I’m',
  'Connection established. I’m',
  'Session started. I’m',
  'You found my corner of the web. I’m',
  'A friendly hello from the terminal. I’m',
  'Pull up a prompt. I’m',
  'Thanks for stopping by. I’m',
  'Ready when you are. I’m',
  'Let’s talk software. I’m',
  'A little code, a little curiosity. I’m',
]);
const AVERAGE_CHARACTERS_PER_WORD = 5;
const MILLISECONDS_PER_MINUTE = 60_000;
const CHARACTER_INTERVAL_IN_MILLISECONDS = MILLISECONDS_PER_MINUTE /
  (TYPING_WORDS_PER_MINUTE * AVERAGE_CHARACTERS_PER_WORD);

/** Preserve a line's layout and accessible text while preparing its reveal.
 * @param {HTMLElement} element
 * @returns {{characters: HTMLElement[], restore: () => void}}
 */
function prepareTypingLine(element) {
  const accessibleContent = element.innerText;
  const textWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (textWalker.nextNode()) {
    if (!textWalker.currentNode.parentElement.closest('.cursor')) textNodes.push(textWalker.currentNode);
  }
  const replacements = textNodes.map(textNode => {
    const wrapper = document.createElement('span');
    wrapper.setAttribute('aria-hidden', 'true');
    const characters = Array.from(textNode.textContent, character => {
      const characterElement = document.createElement('span');
      characterElement.textContent = character;
      characterElement.className = 'typing-character';
      wrapper.append(characterElement);
      return characterElement;
    });
    textNode.replaceWith(wrapper);
    return { textNode, wrapper, characters };
  });
  const accessibleText = document.createElement('span');
  accessibleText.className = 'sr-only';
  accessibleText.textContent = accessibleContent;
  element.append(accessibleText);
  return {
    characters: replacements.flatMap(replacement => replacement.characters),
    restore: () => {
      replacements.forEach(({ wrapper, textNode }) => wrapper.replaceWith(textNode));
      accessibleText.remove();
    },
  };
}

/** Animate prepared lines in reading order without moving surrounding content.
 * @param {{lines: ReturnType<typeof prepareTypingLine>[], motionPreference: MediaQueryList}} options
 * @returns {void}
 */
function animateTypingLines({ lines, motionPreference }) {
  const characters = lines.flatMap(line => line.characters);
  let startedAt;
  let hasFinished = false;
  let revealedCount = 0;
  const finishTyping = () => {
    hasFinished = true;
    lines.forEach(line => line.restore());
    motionPreference.removeEventListener('change', finishTyping);
  };
  const revealFrame = timestamp => {
    if (hasFinished) return;
    startedAt ??= timestamp;
    const visibleCount = Math.floor((timestamp - startedAt) / CHARACTER_INTERVAL_IN_MILLISECONDS) + 1;
    characters[revealedCount - 1]?.classList.remove('typing-caret');
    characters.slice(revealedCount, visibleCount).forEach(character => character.classList.add('is-typed'));
    revealedCount = Math.min(visibleCount, characters.length);
    characters[revealedCount - 1]?.classList.add('typing-caret');
    if (visibleCount >= characters.length) return finishTyping();
    requestAnimationFrame(revealFrame);
  };
  motionPreference.addEventListener('change', finishTyping, { once: true });
  requestAnimationFrame(revealFrame);
}

/** Create a single typing entrance, triggered when the main page first opens.
 * @param {HTMLElement} homePanel
 * @returns {() => void}
 */
export function createIntroTyping(homePanel) {
  const greeting = homePanel.querySelector('.intro-greeting');
  greeting.textContent = INTRO_GREETING_PREFIXES[Math.floor(Math.random() * INTRO_GREETING_PREFIXES.length)];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hasPlayed = false;
  return () => {
    if (hasPlayed || homePanel.hidden) return;
    hasPlayed = true;
    if (motionPreference.matches) return;
    const lines = Array.from(homePanel.querySelectorAll('.intro-comment, .cpp-namespace, .intro-greeting, h1, .lead, .intro-note'), prepareTypingLine);
    animateTypingLines({ lines, motionPreference });
  };
}
