import { createSculpturePattern, sampleSculptureSurface } from './sculpture_surfaces.js?v=continuous';

const FRAME_COLUMNS = 104;
const FRAME_ROWS = 64;
const FRAME_INTERVAL_IN_MILLISECONDS = 1000 / 20;
const SHADE_GROUPS = Object.freeze(['.,`-', '/~:;!', 'i|()[]', 'tszvcr', '2345XY', 'GKZB8M', 'W%#@']);
const FULL_ROTATION_IN_RADIANS = Math.PI * 2;

/** Rotate a point around two independently drifting axes.
 * @param {number[]} point
 * @param {number[]} angles
 * @returns {number[]}
 */
function rotatePoint([horizontal, vertical, depth], [pitch, yaw]) {
  const tiltedVertical = vertical * Math.cos(pitch) - depth * Math.sin(pitch);
  const tiltedDepth = vertical * Math.sin(pitch) + depth * Math.cos(pitch);
  return [horizontal * Math.cos(yaw) + tiltedDepth * Math.sin(yaw),
    tiltedVertical, tiltedDepth * Math.cos(yaw) - horizontal * Math.sin(yaw)];
}

/** Write a lit surface sample into a character buffer using depth testing.
 * @param {{point: number[], normal: number[]}} surface
 * @param {{characters: string[], depths: Float32Array, angles: number[]}} frame
 * @returns {void}
 */
function projectSurface(surface, frame) {
  const rotated = rotatePoint(surface.point, frame.angles);
  const [horizontal, vertical, depth] = rotated.map((coordinate, index) => coordinate * frame.scale + frame.offset[index]);
  const projectionScale = 5 / (5 - depth);
  const column = Math.round(FRAME_COLUMNS / 2 + horizontal * projectionScale * 25);
  const row = Math.round(FRAME_ROWS / 2 - vertical * projectionScale * 17);
  if (column < 0 || column >= FRAME_COLUMNS || row < 0 || row >= FRAME_ROWS) return;
  const position = row * FRAME_COLUMNS + column;
  if (depth <= frame.depths[position]) return;
  const [normalHorizontal, normalVertical, normalDepth] = rotatePoint(surface.normal, frame.angles);
  const light = Math.max(0, normalHorizontal * -0.4 + normalVertical * 0.55 + normalDepth * 0.7);
  const tone = Math.min(SHADE_GROUPS.length - 1, Math.floor(Math.pow(light, frame.intensity) * SHADE_GROUPS.length));
  const group = SHADE_GROUPS[tone];
  const texture = Math.abs(Math.sin(surface.point[0] * 127 + surface.point[1] * 311 + surface.point[2] * 73));
  frame.tones[position] = tone;
  frame.depths[position] = depth;
  frame.characters[position] = group[Math.min(group.length - 1, Math.floor(texture * group.length))];
}

/** Render one connected sculpture with shared geometry, lighting, and motion.
 * @param {{time: number, variation: number, intensity?: number}} options
 * @returns {{characters: string[], tones: Uint8Array}}
 */
function renderSculptureFrame({ time, variation, intensity = 2.25 }) {
  const frame = { characters: Array(FRAME_COLUMNS * FRAME_ROWS).fill(' '),
    depths: new Float32Array(FRAME_COLUMNS * FRAME_ROWS).fill(-Infinity),
    tones: new Uint8Array(FRAME_COLUMNS * FRAME_ROWS), intensity };
  const pattern = createSculpturePattern(variation);
  const surfaceFrame = { ...frame, scale: 0.86, offset: [0, 0, 0],
    angles: [Math.sin(time * 0.13 + variation) * 0.55, time * 0.18 + variation] };
  for (let longitude = 0; longitude < FULL_ROTATION_IN_RADIANS; longitude += 0.025) {
    for (let latitude = 0; latitude < FULL_ROTATION_IN_RADIANS; latitude += 0.055) {
      projectSurface(sampleSculptureSurface({ longitude, latitude, time, pattern }), surfaceFrame);
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

/** Render a deterministic plain-text snapshot for a given time and intensity.
 * @param {{time: number, variation: number, intensity?: number}} options
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
  artwork.style.setProperty('--sculpture-glow', `${state.intensity * 1.5}px`);
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
 * @param {{artwork: HTMLElement, button: HTMLButtonElement, resetButton: HTMLButtonElement, intensityInput: HTMLInputElement, intensityOutput: HTMLOutputElement}} elements
 * @returns {void}
 */
export function initializeAsciiSculpture({ artwork, button, resetButton, intensityInput, intensityOutput }) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { isVisible: false, isPaused: false, frameRequest: 0, lastFrame: 0, time: Math.random() * 48,
    variation: Math.random() * FULL_ROTATION_IN_RADIANS, intensity: Number(intensityInput.value) };
  const drawFrame = createFrameRenderer({ artwork, state });
  const synchronizePlayback = createPlaybackSynchronizer({ button, state, motionPreference, drawFrame });
  drawSculpture({ artwork, state });
  observeSculpturePlayback({ artwork, button, state, synchronizePlayback, motionPreference });
  connectSculptureControls({ artwork, state, resetButton, intensityInput, intensityOutput });
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

/** Randomize the connected form without changing playback or chosen lighting.
 * @param {object} controls
 * @returns {void}
 */
function connectSculptureControls({ artwork, state, resetButton, intensityInput, intensityOutput }) {
  resetButton.addEventListener('click', () => {
    state.time = Math.random() * 48;
    state.variation = Math.random() * FULL_ROTATION_IN_RADIANS;
    drawSculpture({ artwork, state });
  });
  intensityInput.addEventListener('input', () => {
    state.intensity = Number(intensityInput.value);
    intensityOutput.value = `${Math.round(state.intensity * 100)}%`;
    drawSculpture({ artwork, state });
  });
}
