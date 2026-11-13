/** C++ declarations used as playful engineering mottos, rather than professional claims. */
export const FOCUS_LINES = Object.freeze([
  ['constexpr', 'auto', 'focus', '"build reliable software"'],
  ['constexpr', 'auto', 'mindset', '"measure, learn, improve"'],
  ['constexpr', 'auto', 'mission', '"keep production boring"'],
  ['constexpr', 'auto', 'craft', '"make complexity readable"'],
  ['constexpr', 'auto', 'principle', '"design for the unexpected"'],
  ['const', 'auto', 'next_step', '"build, observe, refine"'],
  ['const', 'auto', 'daily_plan', '"coffee, code, repeat"'],
  ['const', 'auto', 'direction', '"follow the signals"'],
  ['const', 'auto', 'approach', '"small changes, clear intent"'],
  ['const', 'auto', 'reminder', '"read the logs first"'],
  ['constexpr', 'const char*', 'philosophy', '"simple is a feature"'],
  ['constexpr', 'const char*', 'priority', '"reliability by design"'],
  ['constexpr', 'const char*', 'curiosity', '"look beneath the surface"'],
  ['constexpr', 'const char*', 'workflow', '"automate the repetitive"'],
  ['constexpr', 'const char*', 'compass', '"clarity over cleverness"'],
  ['const', 'char* const', 'weekend_plan', '"one more side project"'],
  ['const', 'char* const', 'debugging_rule', '"reproduce before guessing"'],
  ['const', 'char* const', 'release_note', '"leave it better than before"'],
  ['const', 'char* const', 'terminal_message', '"hello from Victoria, BC"'],
  ['const', 'char* const', 'engineering_goal', '"turn ideas into working systems"'],
  ['constexpr', 'bool', 'keep_learning', 'true'],
  ['constexpr', 'bool', 'prefer_readable_code', 'true'],
  ['constexpr', 'bool', 'observe_before_optimizing', 'true'],
  ['constexpr', 'bool', 'test_the_assumptions', 'true'],
  ['constexpr', 'bool', 'stay_curious', 'true'],
].map(declaration => Object.freeze(declaration)));

/** Select a declaration from a caller-supplied random value. @param {number} randomValue @returns {readonly string[]} */
export function selectFocusLine(randomValue) {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('Focus selection requires a finite random value from zero up to, but excluding, one.');
  }
  return FOCUS_LINES[Math.floor(randomValue * FOCUS_LINES.length)];
}

/** Render a declaration with syntax colors and safe text nodes. @param {object} options @returns {void} */
export function renderFocusLine({ element, declaration }) {
  const [qualifier, type, identifier, value] = declaration;
  const fragments = [
    ['cpp-keyword', `${qualifier} `],
    ['cpp-type', `${type} `],
    ['muted', `${identifier} = `],
    [value.startsWith('"') ? 'cpp-string' : 'cpp-literal', value],
    ['cpp-punctuation', ';'],
  ];
  element.replaceChildren(...fragments.map(([className, text]) => {
    const fragment = element.ownerDocument.createElement('span');
    fragment.className = className;
    fragment.textContent = text;
    return fragment;
  }));
}
