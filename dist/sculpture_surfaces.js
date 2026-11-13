const SHAPE_DURATION_IN_SECONDS = 12;
const SHAPE_COUNT = 4;
const NORMAL_SAMPLE_OFFSET = 0.002;

/** Sculpt a cranium, eye sockets, nose, and a narrow toothed jaw.
 * @param {{longitude: number, latitude: number}} sample
 * @returns {number[]}
 */
function sampleSkull({ longitude, latitude }) {
  const elevation = latitude / 2 - Math.PI / 2;
  const height = Math.sin(elevation);
  const jawWidth = height < -0.15 ? 0.66 + (height + 1) * 0.3 : 1;
  const horizontal = Math.sin(longitude) * Math.cos(elevation) * jawWidth;
  const vertical = height * 1.45;
  let depth = Math.cos(longitude) * Math.cos(elevation) * 0.87;
  if (depth <= 0) return [horizontal, vertical, depth];
  const eyeSockets = Math.exp(-Math.pow((Math.abs(horizontal) - 0.43) / 0.22, 2) - Math.pow((vertical - 0.22) / 0.27, 2));
  const nose = Math.exp(-Math.pow(horizontal / 0.14, 2) - Math.pow((vertical + 0.17) / 0.23, 2));
  const mouth = Math.exp(-Math.pow(horizontal / 0.54, 6) - Math.pow((vertical + 0.65) / 0.085, 2));
  const teeth = Math.cos(horizontal * 36) * 0.07 * Math.exp(-Math.pow((vertical + 0.8) / 0.14, 2));
  depth -= eyeSockets * 0.72 + nose * 0.5 + mouth * 0.24 + teeth;
  return [horizontal, vertical, depth];
}

/** Sample related ring, infinity, and rippling orbital surfaces.
 * @param {{longitude: number, latitude: number, shape: number}} sample
 * @returns {number[]}
 */
function sampleOrbit({ longitude, latitude, shape }) {
  const fold = shape === 2 ? 1 : 0;
  const ripple = shape === 3 ? Math.sin(longitude * 3) * 0.25 : 0;
  const radius = 0.4 + ripple;
  return [Math.cos(longitude) * (1.1 + radius * Math.cos(latitude)),
    1.1 * Math.sin(longitude) * (1 - fold + fold * Math.cos(longitude)) + radius * Math.sin(longitude) * Math.cos(latitude),
    fold * 0.55 * Math.sin(longitude) + radius * Math.sin(latitude)];
}

/** Blend between four forms, holding each briefly before its next transition.
 * @param {{longitude: number, latitude: number, time: number}} sample
 * @returns {number[]}
 */
function sampleMorphingPoint({ longitude, latitude, time }) {
  const progress = ((time / SHAPE_DURATION_IN_SECONDS) % SHAPE_COUNT + SHAPE_COUNT) % SHAPE_COUNT;
  const shape = Math.floor(progress);
  const transition = Math.max(0, (progress - shape - 0.45) / 0.55);
  const blend = transition * transition * (3 - 2 * transition);
  const nextShape = (shape + 1) % SHAPE_COUNT;
  const current = shape === 0 ? sampleSkull({ longitude, latitude }) : sampleOrbit({ longitude, latitude, shape });
  const next = nextShape === 0 ? sampleSkull({ longitude, latitude }) : sampleOrbit({ longitude, latitude, shape: nextShape });
  return current.map((coordinate, index) => coordinate * (1 - blend) + next[index] * blend);
}

/** Calculate surface normals from the same geometry used to draw each form.
 * @param {{longitude: number, latitude: number, time: number}} sample
 * @returns {{point: number[], normal: number[]}}
 */
export function sampleSculptureSurface(sample) {
  const point = sampleMorphingPoint(sample);
  const longitudeNeighbor = sampleMorphingPoint({ ...sample, longitude: sample.longitude + NORMAL_SAMPLE_OFFSET });
  const latitudeNeighbor = sampleMorphingPoint({ ...sample, latitude: sample.latitude + NORMAL_SAMPLE_OFFSET });
  const across = longitudeNeighbor.map((coordinate, index) => coordinate - point[index]);
  const down = latitudeNeighbor.map((coordinate, index) => coordinate - point[index]);
  const normal = [across[1] * down[2] - across[2] * down[1],
    across[2] * down[0] - across[0] * down[2], across[0] * down[1] - across[1] * down[0]];
  const length = Math.hypot(...normal) || 1;
  return { point, normal: normal.map(coordinate => coordinate / length) };
}
