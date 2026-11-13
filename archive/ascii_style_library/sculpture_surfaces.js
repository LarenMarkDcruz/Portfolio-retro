const FULL_ROTATION_IN_RADIANS = Math.PI * 2;
const NORMAL_SAMPLE_OFFSET = 0.006;

/** Derive stable proportions and motion offsets from a random seed.
 * @param {number} seed
 * @returns {{phase: number, ripple: number, tilt: number}}
 */
function createSculpturePattern(seed) {
  const randomAt = position => {
    const value = Math.sin(seed * 127.1 + position * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  return { phase: randomAt(1) * FULL_ROTATION_IN_RADIANS,
    ripple: 0.035 + randomAt(2) * 0.055, tilt: randomAt(3) * FULL_ROTATION_IN_RADIANS };
}

/** Prepare two independently rotating bodies that approach, fuse, and separate.
 * @param {{time: number, variation: number}} options
 * @returns {{bodies: object[], blendRadius: number}}
 */
export function createSculptureScene({ time, variation }) {
  const pattern = createSculpturePattern(variation);
  const separation = 0.12 + 1.65 * (0.5 + 0.5 * Math.sin(time * 0.32 + pattern.phase));
  const growth = 0.5 + 0.5 * Math.sin(time * 0.23 + pattern.phase + 1);
  const orbit = Math.sin(time * 0.11 + pattern.tilt) * 0.65;
  const bodies = [0, 1].map(index => {
    const direction = index === 0 ? -1 : 1;
    const phase = pattern.phase + index * 2.4;
    const pitch = time * (index === 0 ? 0.19 : -0.16) + phase;
    const yaw = time * 0.14 + pattern.tilt + index;
    const scale = 0.5 + 0.75 * (index === 0 ? growth : 1 - growth);
    return { center: [direction * separation * Math.cos(orbit), direction * separation * Math.sin(orbit),
      direction * 0.22 * Math.sin(time * 0.21 + phase)], scale, boundRadius: scale * 1.5 + 0.2,
      pitchCosine: Math.cos(pitch), pitchSine: Math.sin(pitch), yawCosine: Math.cos(yaw), yawSine: Math.sin(yaw),
      phase, ripple: pattern.ripple, morph: 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(time * 0.17 + phase)) };
  });
  return { bodies, blendRadius: 0.36 + 0.12 * Math.sin(time * 0.15 + pattern.phase) };
}

/** Measure a softly rippling body that evolves between a loop and a rounded lobe.
 * @param {number[]} point
 * @param {object} body
 * @returns {number}
 */
function sampleBodyDistance(point, body) {
  const horizontal = (point[0] - body.center[0]) / body.scale;
  const vertical = (point[1] - body.center[1]) / body.scale;
  const depth = (point[2] - body.center[2]) / body.scale;
  const turnedHorizontal = horizontal * body.yawCosine - depth * body.yawSine;
  const turnedDepth = depth * body.yawCosine + horizontal * body.yawSine;
  const localVertical = vertical * body.pitchCosine + turnedDepth * body.pitchSine;
  const localDepth = turnedDepth * body.pitchCosine - vertical * body.pitchSine;
  const warpedHorizontal = turnedHorizontal + 0.1 * Math.sin(localVertical * 3 + body.phase);
  const warpedDepth = localDepth + 0.08 * Math.sin(turnedHorizontal * 3 - body.phase);
  const angle = Math.atan2(localVertical, warpedHorizontal);
  const contour = 0.64 + 0.1 * Math.sin(angle * 3 + body.phase) + 0.045 * Math.cos(angle * 2 - body.phase);
  const ringRadius = Math.hypot(warpedHorizontal, localVertical) - contour;
  const tubeRadius = 0.28 + 0.065 * Math.sin(angle * 2 + localVertical * 3 + body.phase);
  const loop = Math.sqrt(ringRadius ** 2 + warpedDepth ** 2) - tubeRadius;
  const lobe = Math.sqrt(turnedHorizontal ** 2 + (localVertical * 0.86) ** 2 + (localDepth * 1.08) ** 2) - 0.86;
  const ripple = body.ripple * Math.sin(turnedHorizontal * 3 + body.phase) *
    Math.sin(localVertical * 3 - body.phase) * Math.sin(localDepth * 3 + body.phase);
  return (loop * (1 - body.morph) + lobe * body.morph + ripple) * body.scale;
}

/** Smoothly unite both distance fields so contact becomes an actual shared surface.
 * @param {number[]} point
 * @param {{bodies: object[], blendRadius: number}} scene
 * @returns {number}
 */
export function sampleSculptureDistance(point, scene) {
  const first = sampleBodyDistance(point, scene.bodies[0]);
  const second = sampleBodyDistance(point, scene.bodies[1]);
  const overlap = Math.max(scene.blendRadius - Math.abs(first - second), 0) / scene.blendRadius;
  return Math.min(first, second) - overlap * overlap * scene.blendRadius * 0.25;
}

/** Calculate normals on the fused surface, including the connecting neck.
 * @param {number[]} point
 * @param {object} scene
 * @returns {{point: number[], normal: number[]}}
 */
export function sampleSculptureSurface(point, scene) {
  const normal = point.map((coordinate, index) => {
    const before = [...point];
    const after = [...point];
    before[index] = coordinate - NORMAL_SAMPLE_OFFSET;
    after[index] = coordinate + NORMAL_SAMPLE_OFFSET;
    return sampleSculptureDistance(after, scene) - sampleSculptureDistance(before, scene);
  });
  const length = Math.hypot(...normal) || 1;
  return { point, normal: normal.map(coordinate => coordinate / length) };
}
