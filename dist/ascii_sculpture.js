import { createSculptureScene } from './sculpture_surfaces.js?v=fusion';
import { traceSculptureRay, calculateSurfaceLight } from './sculpture_raymarcher.js?v=fusion';

const FRAME_COLUMNS = 104;
const FRAME_ROWS = 64;
const FRAME_INTERVAL_IN_MILLISECONDS = 1000 / 20;
const SHADE_GROUPS = Object.freeze(['.,`-', '/~:;!', 'i|()[]', 'tszvcr', '2345XY', 'GKZB8M', 'W%#@']);
const FULL_ROTATION_IN_RADIANS = Math.PI * 2;
const FRAME_HEIGHT_TO_WIDTH_RATIO = 1.11;
const HIGHLIGHT_GLOW_IN_PIXELS = 3.375;

/** Keep both bodies prominent while allowing room for separation and growth.
 * @param {object} scene
 * @returns {{horizontal: number, vertical: number, halfWidth: number, halfHeight: number}}
 */
function frameSculptureScene(scene) {
  const horizontalEdges = scene.bodies.flatMap(body =>
    [body.center[0] - body.boundRadius, body.center[0] + body.boundRadius]);
  const verticalEdges = scene.bodies.flatMap(body =>
    [body.center[1] - body.boundRadius, body.center[1] + body.boundRadius]);
  const left = Math.min(...horizontalEdges);
  const right = Math.max(...horizontalEdges);
  const bottom = Math.min(...verticalEdges);
  const top = Math.max(...verticalEdges);
  const halfWidth = Math.max((right - left) / 2, (top - bottom) / 2 / FRAME_HEIGHT_TO_WIDTH_RATIO) * 1.06;
  return { horizontal: (left + right) / 2, vertical: (bottom + top) / 2,
    halfWidth, halfHeight: halfWidth * FRAME_HEIGHT_TO_WIDTH_RATIO };
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
 * @param {{time: number, variation: number}} options
 * @returns {{characters: string[], tones: Uint8Array}}
 */
function renderSculptureFrame(options) {
  const scene = createSculptureScene(options);
  const frame = { characters: Array(FRAME_COLUMNS * FRAME_ROWS).fill(' '),
    tones: new Uint8Array(FRAME_COLUMNS * FRAME_ROWS) };
  const view = frameSculptureScene(scene);
  for (let row = 0; row < FRAME_ROWS; row++) {
    for (let column = 0; column < FRAME_COLUMNS; column++) {
      const origin = [view.horizontal + ((column + 0.5) / FRAME_COLUMNS * 2 - 1) * view.halfWidth,
        view.vertical + (1 - (row + 0.5) / FRAME_ROWS * 2) * view.halfHeight, 4];
      const surface = traceSculptureRay(origin, scene);
      if (surface) writeSurfaceCharacter({ surface, scene, position: row * FRAME_COLUMNS + column }, frame);
    }
  }
  return frame;
}

/** Format a fixed-width buffer without changing its alignment.
 * @param {string[]} characters
 * @returns {string}
 */
function formatCharacterRows(characters) {
  return Array.from({ length: FRAME_ROWS }, (_, row) =>
    characters.slice(row * FRAME_COLUMNS, (row + 1) * FRAME_COLUMNS).join('')).join('\n');
}

/** Render a deterministic plain-text snapshot for a given time and random seed.
 * @param {{time: number, variation: number}} options
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
      state.time += Math.min(elapsed, 100) / 1000;
      drawSculpture({ artwork, state });
      state.lastFrame = timestamp;
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
  const state = { isVisible: false, isPaused: false, frameRequest: 0, lastFrame: 0, time: Math.random() * 48,
    variation: Math.random() * FULL_ROTATION_IN_RADIANS };
  const drawFrame = createFrameRenderer({ artwork, state });
  const synchronizePlayback = createPlaybackSynchronizer({ button, state, motionPreference, drawFrame });
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
