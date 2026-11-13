const FULL_ROTATION_IN_RADIANS = Math.PI * 2;
const NORMAL_SAMPLE_OFFSET = 0.002;

/** Derive repeatable proportions for one continuous, abstract surface.
 * @param {number} seed
 * @returns {{lobes: number, ripple: number, thickness: number, stretch: number, phase: number}}
 */
export function createSculpturePattern(seed) {
  const randomAt = position => {
    const value = Math.sin(seed * 127.1 + position * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  return { lobes: 2 + Math.floor(randomAt(1) * 2), ripple: 0.12 + randomAt(2) * 0.16,
    thickness: 0.25 + randomAt(3) * 0.1, stretch: 0.85 + randomAt(4) * 0.25,
    phase: randomAt(5) * FULL_ROTATION_IN_RADIANS };
}

/** Follow a closed, undulating path whose lobes evolve together.
 * @param {{longitude: number, time: number, pattern: object}} sample
 * @returns {number[]}
 */
function sampleLoopCenter({ longitude, time, pattern }) {
  const breathing = Math.sin(time * 0.17 + pattern.phase);
  const radius = 1 + pattern.ripple * Math.cos(longitude * pattern.lobes + time * 0.12 + pattern.phase);
  return [Math.cos(longitude) * radius,
    Math.sin(longitude) * radius * pattern.stretch,
    (0.25 + breathing * 0.13) * Math.sin(longitude * 2 + time * 0.09 + pattern.phase)];
}

/** Calculate a stable perpendicular frame around the closed curve.
 * @param {{longitude: number, time: number, pattern: object}} sample
 * @returns {{center: number[], outward: number[], across: number[]}}
 */
function sampleLoopFrame(sample) {
  const center = sampleLoopCenter(sample);
  const neighbor = sampleLoopCenter({ ...sample, longitude: sample.longitude + NORMAL_SAMPLE_OFFSET });
  const direction = neighbor.map((coordinate, index) => coordinate - center[index]);
  const directionLength = Math.hypot(...direction);
  const tangent = direction.map(coordinate => coordinate / directionLength);
  const radial = [Math.cos(sample.longitude), Math.sin(sample.longitude), 0];
  const projection = radial.reduce((total, coordinate, index) => total + coordinate * tangent[index], 0);
  const perpendicular = radial.map((coordinate, index) => coordinate - projection * tangent[index]);
  const perpendicularLength = Math.hypot(...perpendicular);
  const outward = perpendicular.map(coordinate => coordinate / perpendicularLength);
  const across = [outward[1] * tangent[2] - outward[2] * tangent[1],
    outward[2] * tangent[0] - outward[0] * tangent[2], outward[0] * tangent[1] - outward[1] * tangent[0]];
  return { center, outward, across };
}

/** Sweep a swelling tube around the curve, preserving a connected surface.
 * @param {{longitude: number, latitude: number, time: number, pattern: object}} sample
 * @returns {number[]}
 */
function sampleContinuousPoint(sample) {
  const { longitude, latitude, time, pattern } = sample;
  const { center, outward, across } = sampleLoopFrame(sample);
  const swelling = 1 + 0.3 * Math.cos(longitude * 2 - time * 0.2 + pattern.phase);
  const thickness = pattern.thickness * swelling;
  const flattening = 0.85 + 0.15 * Math.sin(time * 0.13 + pattern.phase);
  return center.map((coordinate, index) => coordinate + thickness *
    (Math.cos(latitude) * outward[index] + Math.sin(latitude) * across[index] * flattening));
}

/** Calculate lighting normals from the same continuous geometry being drawn.
 * @param {{longitude: number, latitude: number, time: number, pattern?: object}} sample
 * @returns {{point: number[], normal: number[]}}
 */
export function sampleSculptureSurface(sample) {
  const configuredSample = { ...sample, pattern: sample.pattern ?? createSculpturePattern(0) };
  const point = sampleContinuousPoint(configuredSample);
  const longitudeNeighbor = sampleContinuousPoint({ ...configuredSample, longitude: sample.longitude + NORMAL_SAMPLE_OFFSET });
  const latitudeNeighbor = sampleContinuousPoint({ ...configuredSample, latitude: sample.latitude + NORMAL_SAMPLE_OFFSET });
  const across = longitudeNeighbor.map((coordinate, index) => coordinate - point[index]);
  const down = latitudeNeighbor.map((coordinate, index) => coordinate - point[index]);
  const normal = [across[1] * down[2] - across[2] * down[1],
    across[2] * down[0] - across[0] * down[2], across[0] * down[1] - across[1] * down[0]];
  const length = Math.hypot(...normal) || 1;
  return { point, normal: normal.map(coordinate => coordinate / length) };
}
