import { createSculptureScene } from './sculpture_surfaces.js?v=abstract-contours';
import { traceSculptureRay, calculateSurfaceLight } from './sculpture_raymarcher.js?v=abstract-contours';

const FRAME_COLUMNS = 104;
const FRAME_ROWS = 64;
const FRAME_INTERVAL_IN_MILLISECONDS = 1000 / 40;
const SHADE_GROUPS = Object.freeze(['.,`-', '/~:;!', 'i|()[]', 'tszvcr', '2345XY', 'GKZB8M', 'W%#@']);
const FULL_ROTATION_IN_RADIANS = Math.PI * 2;
const VIEW_HALF_WIDTH = 2.5;
const CHARACTER_WIDTH_TO_FONT_SIZE_RATIO = 0.6;
const CHARACTER_LINE_HEIGHT = 1.08;
const DEFAULT_VIEWPORT = Object.freeze({ rows: FRAME_ROWS, halfWidth: VIEW_HALF_WIDTH,
  halfHeight: VIEW_HALF_WIDTH * FRAME_ROWS * CHARACTER_LINE_HEIGHT /
    (FRAME_COLUMNS * CHARACTER_WIDTH_TO_FONT_SIZE_RATIO) });
const HIGHLIGHT_GLOW_IN_PIXELS = 3.375;
const MINIMUM_MOTION_SPEED_MULTIPLIER = 1.5;
const MAXIMUM_MOTION_SPEED_MULTIPLIER = 2;

/** Ease between faster motion speeds using a seed-specific rhythm.
 * @param {{time: number, variation: number}} options
 * @returns {number}
 */
export function calculateSculptureMotionSpeed({ time, variation }) {
  const frequency = 0.12 + 0.05 * Math.sin(variation);
  const progress = 0.5 + 0.5 * Math.sin(time * frequency + variation);
  return MINIMUM_MOTION_SPEED_MULTIPLIER + progress *
    (MAXIMUM_MOTION_SPEED_MULTIPLIER - MINIMUM_MOTION_SPEED_MULTIPLIER);
}

/** Match a fixed camera to the rectangle without following the animated silhouette.
 * @param {{width: number, height: number}} dimensions
 * @returns {{rows: number, halfWidth: number, halfHeight: number}}
 */
export function createSculptureViewport({ width, height }) {
  const characterHeight = width / FRAME_COLUMNS / CHARACTER_WIDTH_TO_FONT_SIZE_RATIO * CHARACTER_LINE_HEIGHT;
  const rows = Math.max(1, Math.ceil(height / characterHeight));
  return { rows, halfWidth: VIEW_HALF_WIDTH,
    halfHeight: VIEW_HALF_WIDTH * rows * CHARACTER_LINE_HEIGHT /
      (FRAME_COLUMNS * CHARACTER_WIDTH_TO_FONT_SIZE_RATIO) };
}

/** Shade one occupied character using the geometry beneath its viewing ray.
 * @param {{surface: object, scene: object, position: number}} sample
 * @param {{characters: string[], tones: Uint8Array}} frame
 * @returns {void}
 */
function writeSurfaceCharacter({ surface, scene, position }, frame) {
  const tone = Math.min(SHADE_GROUPS.length - 1,
    Math.floor(calculateSurfaceLight(surface, scene) * SHADE_GROUPS.length));
  const group = SHADE_GROUPS[tone];
  const [horizontal, vertical, depth] = surface.point;
  const texture = Math.abs(Math.sin(horizontal * 127 + vertical * 311 + depth * 73));
  frame.tones[position] = tone;
  frame.characters[position] = group[Math.min(group.length - 1, Math.floor(texture * group.length))];
}

/** Ray march two bodies through a shared field so fusion changes the silhouette.
 * @param {{time: number, variation: number, viewport?: object}} options
 * @returns {{characters: string[], tones: Uint8Array}}
 */
function renderSculptureFrame(options) {
  const scene = createSculptureScene(options);
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;
  const frame = { characters: Array(FRAME_COLUMNS * viewport.rows).fill(' '),
    tones: new Uint8Array(FRAME_COLUMNS * viewport.rows) };
  for (let row = 0; row < viewport.rows; row++) {
    for (let column = 0; column < FRAME_COLUMNS; column++) {
      const origin = [((column + 0.5) / FRAME_COLUMNS * 2 - 1) * viewport.halfWidth,
        (1 - (row + 0.5) / viewport.rows * 2) * viewport.halfHeight, 4];
      const surface = traceSculptureRay(origin, scene);
      if (surface) writeSurfaceCharacter({ surface, scene, position: row * FRAME_COLUMNS + column }, frame);
    }
  }
  return frame;
}

/** Keep every frame on the same character grid, including empty edge cells.
 * @param {string[]} characters
 * @returns {string}
 */
function formatCharacterRows(characters) {
  return Array.from({ length: characters.length / FRAME_COLUMNS }, (_, row) =>
    characters.slice(row * FRAME_COLUMNS, (row + 1) * FRAME_COLUMNS).join('')).join('\n');
}

/** Render a deterministic plain-text snapshot for a given time and random seed.
 * @param {{time: number, variation: number, viewport?: object}} options
 * @returns {string}
 */
export function renderAsciiSculpture(options) {
  return formatCharacterRows(renderSculptureFrame(options).characters);
}

/** Update seven reusable text layers with actual highlight and shadow colors.
 * @param {{artwork: HTMLElement, state: object}} options
 * @returns {void}
 */
function drawSculpture({ artwork, state }) {
  const frame = renderSculptureFrame(state);
  if (!artwork.firstElementChild) {
    artwork.textContent = '';
    for (let tone = 0; tone < SHADE_GROUPS.length; tone++) {
      const layer = document.createElement('span');
      layer.className = `sculpture-tone sculpture-tone-${tone}`;
      artwork.append(layer);
    }
  }
  Array.from(artwork.children).forEach((layer, tone) => {
    layer.textContent = formatCharacterRows(frame.characters.map((character, index) =>
      frame.tones[index] === tone ? character : ' '));
  });
  artwork.style.setProperty('--sculpture-glow', `${HIGHLIGHT_GLOW_IN_PIXELS}px`);
}

/** Build a frame callback around an isolated playback state.
 * @param {{artwork: HTMLElement, state: object}} options
 * @returns {(timestamp: number) => void}
 */
function createFrameRenderer({ artwork, state }) {
  const drawFrame = timestamp => {
    const elapsed = timestamp - state.lastFrame;
    if (elapsed >= FRAME_INTERVAL_IN_MILLISECONDS) {
      const motionElapsed = timestamp - state.lastMotionUpdate;
      state.time += Math.min(motionElapsed, 100) / 1000 * calculateSculptureMotionSpeed(state);
      drawSculpture({ artwork, state });
      state.lastMotionUpdate = timestamp;
      state.lastFrame = timestamp - elapsed % FRAME_INTERVAL_IN_MILLISECONDS;
    }
    state.frameRequest = requestAnimationFrame(drawFrame);
  };
  return drawFrame;
}

/** Synchronize rendering and controls with the user's motion preferences.
 * @param {{button: HTMLButtonElement, state: object, motionPreference: MediaQueryList, drawFrame: Function}} options
 * @returns {() => void}
 */
function createPlaybackSynchronizer({ button, state, motionPreference, drawFrame }) {
  return () => {
    cancelAnimationFrame(state.frameRequest);
    const shouldAnimate = state.isVisible && !state.isPaused && !document.hidden && !motionPreference.matches;
    if (shouldAnimate) {
      state.lastFrame = performance.now();
      state.lastMotionUpdate = state.lastFrame;
      state.frameRequest = requestAnimationFrame(drawFrame);
    }
    button.textContent = shouldAnimate ? '[pause]' : '[play]';
    button.setAttribute('aria-pressed', String(state.isPaused));
    button.setAttribute('aria-label', `${shouldAnimate ? 'Pause' : 'Play'} ASCII sculpture animation`);
    button.hidden = motionPreference.matches;
  };
}

/** Keep animation work scoped to a visible, unpaused sculpture.
 * @param {{artwork: HTMLElement, button: HTMLButtonElement, resetButton: HTMLButtonElement}} elements
 * @returns {void}
 */
export function initializeAsciiSculpture({ artwork, button, resetButton }) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { viewport: DEFAULT_VIEWPORT, isVisible: false, isPaused: false, frameRequest: 0, lastFrame: 0, lastMotionUpdate: 0, time: Math.random() * 48,
    variation: Math.random() * FULL_ROTATION_IN_RADIANS };
  const drawFrame = createFrameRenderer({ artwork, state });
  const synchronizePlayback = createPlaybackSynchronizer({ button, state, motionPreference, drawFrame });
  observeSculptureViewport({ artwork, state });
  drawSculpture({ artwork, state });
  observeSculpturePlayback({ artwork, button, state, synchronizePlayback, motionPreference });
  connectSculptureControls({ artwork, state, resetButton });
}

/** Connect visibility, motion preferences, and the optional pause control.
 * @param {object} playback
 * @returns {void}
 */
function observeSculpturePlayback({ artwork, button, state, synchronizePlayback, motionPreference }) {
  const observer = new IntersectionObserver(entries => {
    state.isVisible = entries[0].isIntersecting;
    synchronizePlayback();
  });
  observer.observe(artwork);
  button.addEventListener('click', () => {
    state.isPaused = !state.isPaused;
    synchronizePlayback();
  });
  document.addEventListener('visibilitychange', synchronizePlayback);
  motionPreference.addEventListener('change', synchronizePlayback);
  synchronizePlayback();
}

/** Randomize both bodies without changing the playback state.
 * @param {object} controls
 * @returns {void}
 */
function connectSculptureControls({ artwork, state, resetButton }) {
  resetButton.addEventListener('click', () => {
    state.time = Math.random() * 48;
    state.variation = Math.random() * FULL_ROTATION_IN_RADIANS;
    drawSculpture({ artwork, state });
  });
}

/** Change the grid only when the rectangle changes size, never as the bodies move.
 * @param {{artwork: HTMLElement, state: object}} options
 * @returns {void}
 */
function observeSculptureViewport({ artwork, state }) {
  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    if (width <= 0 || height <= 0) return;
    state.viewport = createSculptureViewport({ width, height });
    drawSculpture({ artwork, state });
  });
  observer.observe(artwork);
}
