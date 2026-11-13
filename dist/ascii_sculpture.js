const FRAME_COLUMNS = 72;
const FRAME_ROWS = 38;
const FRAME_INTERVAL_IN_MILLISECONDS = 1000 / 24;
const SHADE_CHARACTERS = '.,:;irsXA253hMHGS#9B&@';
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

/** Sample a continuous tube that folds between a ring and an infinity loop.
 * @param {{longitude: number, latitude: number, time: number}} sample
 * @returns {{point: number[], normal: number[]}}
 */
function sampleSurface({ longitude, latitude, time }) {
  const fold = (1 - Math.cos(time * 0.31)) / 2;
  const ripple = Math.sin(longitude * 3 + time * 0.43) * 0.09;
  const radius = 0.43 + ripple;
  const normal = [Math.cos(longitude) * Math.cos(latitude),
    Math.sin(longitude) * Math.cos(latitude), Math.sin(latitude)];
  const center = [1.2 * Math.cos(longitude),
    1.2 * Math.sin(longitude) * (1 - fold + fold * Math.cos(longitude)),
    fold * 0.55 * Math.sin(longitude)];
  return { point: center.map((coordinate, index) => coordinate + radius * normal[index]), normal };
}

/** Write a lit surface sample into a character buffer using depth testing.
 * @param {{point: number[], normal: number[]}} surface
 * @param {{characters: string[], depths: Float32Array, angles: number[]}} frame
 * @returns {void}
 */
function projectSurface(surface, frame) {
  const [horizontal, vertical, depth] = rotatePoint(surface.point, frame.angles);
  const projectionScale = 5 / (5 - depth);
  const column = Math.round(FRAME_COLUMNS / 2 + horizontal * projectionScale * 17);
  const row = Math.round(FRAME_ROWS / 2 - vertical * projectionScale * 9);
  if (column < 0 || column >= FRAME_COLUMNS || row < 0 || row >= FRAME_ROWS) return;
  const position = row * FRAME_COLUMNS + column;
  if (depth <= frame.depths[position]) return;
  const [normalHorizontal, normalVertical, normalDepth] = rotatePoint(surface.normal, frame.angles);
  const light = Math.max(0, normalHorizontal * -0.35 + normalVertical * 0.45 + normalDepth * 0.7);
  const shade = Math.min(SHADE_CHARACTERS.length - 1, Math.floor((0.15 + light * 0.85) * (SHADE_CHARACTERS.length - 1)));
  frame.depths[position] = depth;
  frame.characters[position] = SHADE_CHARACTERS[shade];
}

/** Render one deterministic ASCII frame; time is measured in seconds.
 * @param {{time: number, variation: number}} options
 * @returns {string}
 */
export function renderAsciiSculpture({ time, variation }) {
  const frame = { characters: Array(FRAME_COLUMNS * FRAME_ROWS).fill(' '),
    depths: new Float32Array(FRAME_COLUMNS * FRAME_ROWS).fill(-Infinity),
    angles: [time * 0.29 + variation, time * 0.41 + Math.sin(time * 0.17) * 0.4] };
  for (let longitude = 0; longitude < FULL_ROTATION_IN_RADIANS; longitude += 0.035) {
    for (let latitude = 0; latitude < FULL_ROTATION_IN_RADIANS; latitude += 0.09) {
      projectSurface(sampleSurface({ longitude, latitude, time }), frame);
    }
  }
  return Array.from({ length: FRAME_ROWS }, (_, row) =>
    frame.characters.slice(row * FRAME_COLUMNS, (row + 1) * FRAME_COLUMNS).join('')).join('\n');
}

/** Build a frame callback around an isolated playback state.
 * @param {{artwork: HTMLElement, state: object, variation: number}} options
 * @returns {(timestamp: number) => void}
 */
function createFrameRenderer({ artwork, state, variation }) {
  const drawFrame = timestamp => {
    const elapsed = timestamp - state.lastFrame;
    if (elapsed >= FRAME_INTERVAL_IN_MILLISECONDS) {
      state.time += Math.min(elapsed, 100) / 1000;
      artwork.textContent = renderAsciiSculpture({ time: state.time, variation });
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
 * @param {{artwork: HTMLElement, button: HTMLButtonElement}} elements
 * @returns {void}
 */
export function initializeAsciiSculpture({ artwork, button }) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const variation = Math.random() * FULL_ROTATION_IN_RADIANS;
  const state = { isVisible: false, isPaused: false, frameRequest: 0, lastFrame: 0, time: variation * 3 };
  const drawFrame = createFrameRenderer({ artwork, state, variation });
  const synchronizePlayback = createPlaybackSynchronizer({ button, state, motionPreference, drawFrame });
  artwork.textContent = renderAsciiSculpture({ time: state.time, variation });
  observeSculpturePlayback({ artwork, button, state, synchronizePlayback, motionPreference });
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
