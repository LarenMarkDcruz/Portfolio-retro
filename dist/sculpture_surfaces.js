const FULL_ROTATION_IN_RADIANS = Math.PI * 2;
const NORMAL_SAMPLE_OFFSET = 0.006;
const FUSION_CYCLE_DURATION_IN_SECONDS = 32;
const JOINED_BODY_SEPARATION = 0.12;

/** Derive repeatable random values without storing animation state.
 * @param {number} seed
 * @param {number} position
 * @returns {number}
 */
function sampleSculptureSeed(seed, position) {
  const value = Math.sin(seed * 127.1 + position * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Stop smoothly at either end of an approach or separation.
 * @param {number} progress
 * @returns {number}
 */
function easeFusionTransition(progress) {
  return progress ** 3 * (progress * (progress * 6 - 15) + 10);
}

/** Alternate randomized contact and separation holds without jumping between cycles.
 * @param {{time: number, variation: number}} options
 * @returns {{separation: number, phase: string}}
 */
export function sampleFusionMotion({ time, variation }) {
  const elapsed = time + sampleSculptureSeed(variation, 1) * FUSION_CYCLE_DURATION_IN_SECONDS;
  const cycle = Math.floor(elapsed / FUSION_CYCLE_DURATION_IN_SECONDS);
  const position = elapsed - cycle * FUSION_CYCLE_DURATION_IN_SECONDS;
  const joinedDuration = 4 + sampleSculptureSeed(variation, cycle * 4 + 10) * 6;
  const separatedDuration = 2 + sampleSculptureSeed(variation, cycle * 4 + 11) * 4;
  const travelDuration = FUSION_CYCLE_DURATION_IN_SECONDS - joinedDuration - separatedDuration;
  const departingDuration = travelDuration * (0.4 + sampleSculptureSeed(variation, cycle * 4 + 12) * 0.2);
  const maximumSeparation = 1.65 + sampleSculptureSeed(variation, cycle * 4 + 13) * 0.2;
  const distance = maximumSeparation - JOINED_BODY_SEPARATION;
  if (position < joinedDuration) return { separation: JOINED_BODY_SEPARATION, phase: 'joined' };
  if (position < joinedDuration + departingDuration) {
    const progress = (position - joinedDuration) / departingDuration;
    return { separation: JOINED_BODY_SEPARATION + distance * easeFusionTransition(progress), phase: 'separating' };
  }
  const returningStart = joinedDuration + departingDuration + separatedDuration;
  if (position < returningStart) return { separation: maximumSeparation, phase: 'separated' };
  const progress = (position - returningStart) / (travelDuration - departingDuration);
  return { separation: maximumSeparation - distance * easeFusionTransition(progress), phase: 'merging' };
}

/** Derive stable proportions and motion offsets from a random seed.
 * @param {number} seed
 * @returns {{phase: number, ripple: number, tilt: number}}
 */
function createSculpturePattern(seed) {
  const randomAt = position => sampleSculptureSeed(seed, position);
  return { phase: randomAt(1) * FULL_ROTATION_IN_RADIANS,
    ripple: 0.035 + randomAt(2) * 0.055, tilt: randomAt(3) * FULL_ROTATION_IN_RADIANS };
}

/** Prepare two independently rotating bodies that approach, fuse, and separate.
 * @param {{time: number, variation: number}} options
 * @returns {{bodies: object[], blendRadius: number}}
 */
export function createSculptureScene({ time, variation }) {
  const pattern = createSculpturePattern(variation);
  const { separation } = sampleFusionMotion({ time, variation });
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
