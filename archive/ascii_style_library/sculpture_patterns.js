const FULL_ROTATION = Math.PI * 2;
const SURFACE_COLUMNS = 160;
const SURFACE_ROWS = 56;
const NORMAL_SAMPLE_OFFSET = 0.0005;
const ORBIT_COLUMNS = 240;
const ORBIT_ROWS = 16;
const CLASSIC_PATTERN = Object.freeze({ name: 'Classic fusion', firstSurface: 'fusion', secondSurface: 'fusion', orbitCount: 0 });

/** Reference-inspired compositions; each seed also varies their proportions. */
export const SCULPTURE_PATTERNS = Object.freeze([
  ['orbital duet', 'torus', 'sphere', 3],
  ['double helix', 'helix', 'helix', 2],
  ['twin vortices', 'spiral', 'spiral', 0],
  ['folded wings', 'ribbon', 'ribbon', 1],
  ['merging loops', 'fusion', 'fusion', 2],
  ['binary planets', 'sphere', 'sphere', 3],
  ['ribbon and lattice', 'helix', 'lattice', 1],
  ['infinity flow', 'infinity', 'infinity', 0],
  ['interlocked frames', 'cube', 'cube', 1],
  ['woven knot', 'knot', 'knot', 2],
  ['spiral galaxy', 'galaxy', 'galaxy', 0],
  ['porous worlds', 'porous', 'porous', 1],
  ['clover orbits', 'clover', 'clover', 2],
  ['crystal companions', 'crystal', 'crystal', 2],
  ['crescent satellite', 'crescent', 'sphere', 2],
  ['flowing fabric', 'fabric', 'fabric', 0],
].map(([name, firstSurface, secondSurface, orbitCount]) =>
  Object.freeze({ name, firstSurface, secondSurface, orbitCount })));

/** Keep the original renderer selectable alongside every reference-inspired family. */
export const SCULPTURE_STYLES = Object.freeze([
  Object.freeze({ value: 'random', label: 'Random mix' }),
  Object.freeze({ value: 'classic', label: 'Classic fusion' }),
  ...SCULPTURE_PATTERNS.map(pattern => Object.freeze({ value: pattern.name, label: pattern.name })),
]);

/** Select one of sixteen families reproducibly from the reset seed.
 * @param {number} variation
 * @returns {object}
 */
export function selectSculpturePattern(variation) {
  const progress = ((variation % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION / FULL_ROTATION;
  return SCULPTURE_PATTERNS[Math.min(SCULPTURE_PATTERNS.length - 1, Math.floor(progress * SCULPTURE_PATTERNS.length))];
}

/** Sample a ring, crescent, or orbiting sphere in local coordinates.
 * @param {{kind: string, horizontal: number, vertical: number, phase: number}} sample
 * @returns {number[]}
 */
function sampleRoundedSurface({ kind, horizontal, vertical, phase }) {
  if (kind === 'sphere' || kind === 'lattice' || kind === 'porous') {
    const latitude = vertical * Math.PI;
    const radius = 0.85 + (kind === 'porous' ? 0.1 * Math.cos(horizontal * 3) * Math.sin(latitude * 4) : 0);
    return [radius * Math.sin(latitude) * Math.cos(horizontal),
      radius * Math.cos(latitude), radius * Math.sin(latitude) * Math.sin(horizontal)];
  }
  const tube = kind === 'crescent' ? 0.12 + 0.24 * (0.5 + 0.5 * Math.cos(horizontal)) : 0.25;
  const radius = 0.83 + tube * Math.cos(vertical * FULL_ROTATION);
  return [radius * Math.cos(horizontal), radius * Math.sin(horizontal),
    tube * Math.sin(vertical * FULL_ROTATION) + 0.07 * Math.sin(horizontal * 3 + phase)];
}

/** Sweep a thin strip along an infinity loop, knot, helix, or clover.
 * @param {{kind: string, horizontal: number, vertical: number, phase: number}} sample
 * @returns {number[]}
 */
function sampleLoopSurface({ kind, horizontal, vertical, phase }) {
  const across = (vertical - 0.5) * 0.7;
  if (kind === 'helix') {
    const radius = 0.7 + across * 0.45;
    return [radius * Math.cos(horizontal * 1.25 + phase), (horizontal / Math.PI - 1) * 0.95,
      radius * Math.sin(horizontal * 1.25 + phase)];
  }
  if (kind === 'knot') {
    const radius = 0.78 + 0.26 * Math.cos(horizontal * 3 + phase) + across;
    return [radius * Math.cos(horizontal * 2), radius * Math.sin(horizontal * 2),
      0.38 * Math.sin(horizontal * 3 + phase) + across * Math.sin(horizontal * 2 + phase)];
  }
  const lobes = kind === 'clover' ? 3 : 2;
  const radius = 0.8 + 0.32 * Math.cos(horizontal * lobes) + across;
  return [radius * Math.cos(horizontal), (kind === 'infinity' ? 0.66 * Math.sin(horizontal * 2) :
    radius * Math.sin(horizontal)), 0.35 * Math.sin(horizontal * lobes + phase) + across * Math.cos(horizontal)];
}

/** Build open, flowing sheets rather than repeatedly deforming the same torus.
 * @param {{kind: string, horizontal: number, vertical: number, phase: number}} sample
 * @returns {number[]}
 */
function sampleOpenSurface({ kind, horizontal, vertical, phase }) {
  const across = (vertical - 0.5) * 2;
  if (kind === 'galaxy' || kind === 'spiral') {
    const radius = 0.08 + vertical * 1.2;
    const angle = horizontal + vertical * (kind === 'galaxy' ? 8 : 12);
    return [radius * Math.cos(angle), radius * Math.sin(angle),
      0.16 * Math.sin(horizontal * 2 + phase) * vertical + 0.18 * vertical ** 2];
  }
  if (kind === 'fabric') {
    const along = horizontal / Math.PI - 1;
    return [along * 1.15, across * 0.88,
      0.42 * Math.sin(along * 3 + phase) * Math.cos(across * 2) + 0.22 * across * along];
  }
  const radius = 0.9 + across * 0.44 * Math.cos(horizontal * 1.5 + phase);
  return [radius * Math.cos(horizontal), radius * Math.sin(horizontal),
    across * 0.6 * Math.sin(horizontal * 1.5 + phase) + 0.18 * Math.sin(horizontal * 2)];
}

/** Sample square and diamond frames with sharp, recognizable edges.
 * @param {{kind: string, horizontal: number, vertical: number}} sample
 * @returns {number[]}
 */
function sampleGeometricSurface({ kind, horizontal, vertical }) {
  const cosine = Math.cos(horizontal);
  const sine = Math.sin(horizontal);
  const denominator = kind === 'cube' ? Math.max(Math.abs(cosine), Math.abs(sine)) :
    Math.abs(cosine) + Math.abs(sine);
  const along = (vertical - 0.5) * 2;
  const radius = kind === 'cube' ? 0.7 + 0.2 * Math.cos(vertical * FULL_ROTATION) : 1 - Math.abs(along);
  return [radius * cosine / denominator, radius * sine / denominator,
    kind === 'cube' ? 0.2 * Math.sin(vertical * FULL_ROTATION) : along];
}

/** Dispatch a named surface without coupling the renderer to its mathematics.
 * @param {object} sample
 * @returns {number[]}
 */
function samplePatternSurface(sample) {
  if (['sphere', 'lattice', 'porous', 'torus', 'crescent'].includes(sample.kind)) return sampleRoundedSurface(sample);
  if (['helix', 'knot', 'infinity', 'clover'].includes(sample.kind)) return sampleLoopSurface(sample);
  if (['cube', 'crystal'].includes(sample.kind)) return sampleGeometricSurface(sample);
  return sampleOpenSurface(sample);
}

/** Cut deliberate lattice lines, spiral arms, and openings into the point fabric.
 * @param {{kind: string, horizontal: number, vertical: number}} sample
 * @returns {boolean}
 */
function shouldIncludeSurfacePoint({ kind, horizontal, vertical }) {
  if (kind === 'lattice') return Math.abs(Math.sin(horizontal * 6)) < 0.24 || Math.abs(Math.sin(vertical * Math.PI * 8)) < 0.24;
  if (kind === 'porous') return Math.cos(horizontal * 5 + Math.sin(vertical * 8)) * Math.sin(vertical * Math.PI * 6) < 0.35;
  if (kind === 'spiral' || kind === 'galaxy') return Math.abs(Math.sin(horizontal * 3)) < 0.5;
  return true;
}

/** Estimate the sheet normal once, leaving only transforms for animation frames.
 * @param {object} sample
 * @param {number[]} point
 * @returns {number[]}
 */
function calculatePatternNormal(sample, point) {
  const along = samplePatternSurface({ ...sample, horizontal: sample.horizontal + NORMAL_SAMPLE_OFFSET });
  const across = samplePatternSurface({ ...sample, vertical: sample.vertical + NORMAL_SAMPLE_OFFSET });
  const first = along.map((coordinate, index) => coordinate - point[index]);
  const second = across.map((coordinate, index) => coordinate - point[index]);
  const normal = [first[1] * second[2] - first[2] * second[1], first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0]];
  const length = Math.hypot(...normal) || 1;
  return normal.map(coordinate => coordinate / length);
}

/** Bake paired surfaces so reset does the expensive geometry work just once.
 * @param {{kind: string, phase: number}} options
 * @returns {object}
 */
function createPatternBody({ kind, phase }) {
  const points = [];
  for (let column = 0; column < SURFACE_COLUMNS; column++) {
    for (let row = 1; row < SURFACE_ROWS; row++) {
      const sample = { kind, phase, horizontal: column / SURFACE_COLUMNS * FULL_ROTATION, vertical: row / SURFACE_ROWS };
      if (!shouldIncludeSurfacePoint(sample)) continue;
      const point = samplePatternSurface(sample);
      const normal = calculatePatternNormal(sample, point);
      points.push(...point, ...normal, column / SURFACE_COLUMNS, row / SURFACE_ROWS);
    }
  }
  return { kind, phase, points: new Float32Array(points) };
}

/** Give orbital paths a rounded cross-section rather than a single character line.
 * @param {number} index
 * @returns {object}
 */
function createOrbitBand(index) {
  const points = [];
  const radius = 1.38 + index * 0.18;
  const thickness = 0.065 + index * 0.012;
  for (let column = 0; column < ORBIT_COLUMNS; column++) {
    const around = column / ORBIT_COLUMNS * FULL_ROTATION;
    for (let row = 0; row < ORBIT_ROWS; row++) {
      const across = row / ORBIT_ROWS * FULL_ROTATION;
      const normal = [Math.cos(around) * Math.cos(across), Math.sin(around) * Math.cos(across), Math.sin(across)];
      points.push((radius + thickness * Math.cos(across)) * Math.cos(around),
        (radius + thickness * Math.cos(across)) * Math.sin(around), thickness * Math.sin(across),
        ...normal, column / ORBIT_COLUMNS, row / ORBIT_ROWS);
    }
  }
  return { points: new Float32Array(points) };
}

/** Resolve an explicit style while surfacing invalid catalogue entries.
 * @param {number} variation
 * @param {string} style
 * @returns {object}
 */
function resolveSculpturePattern(variation, style) {
  if (style === 'random') return selectSculpturePattern(variation);
  if (style === 'classic') return CLASSIC_PATTERN;
  const pattern = SCULPTURE_PATTERNS.find(candidate => candidate.name === style);
  if (!pattern) throw new RangeError(`Unknown sculpture style: ${style}`);
  return pattern;
}

/** Create a repeatable, independently randomized pair for the selected family.
 * @param {number} variation
 * @param {string} style
 * @returns {{pattern: object, bodies: object[], orbits: object[], variation: number}}
 */
export function createPatternGeometry(variation, style = 'random') {
  const pattern = resolveSculpturePattern(variation, style);
  const orbits = Array.from({ length: Math.min(2, pattern.orbitCount) }, (_, index) => createOrbitBand(index));
  if (pattern.firstSurface === 'fusion') return { pattern, bodies: [], orbits, variation };
  const bodies = [pattern.firstSurface, pattern.secondSurface].map((kind, index) =>
    createPatternBody({ kind, phase: variation * 3.7 + index * Math.PI }));
  return { pattern, bodies, orbits, variation };
}
