const FULL_ROTATION_IN_RADIANS = Math.PI * 2;
const NORMAL_SAMPLE_OFFSET = 0.006;
const FUSION_CYCLE_DURATION_IN_SECONDS = 32;
const JOINED_BODY_SEPARATION = 0.12;
const ALIGNMENT_TRAVEL_DISTANCE = 0.9;
const RING_MAJOR_RADIUS = 0.78;
const RING_TUBE_RADIUS = 0.22;
const MINIMUM_VOID_RADIUS = 0.43;
const VOID_HALF_DEPTH = 1.4;

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

/** Align two loops into one rotating oval as their centers approach.
 * @param {{index: number, time: number, pattern: object, separation: number, growth: number, connection: number}} options
 * @returns {object}
 */
function createSculptureBody({ index, time, pattern, separation, growth, connection }) {
  const direction = index === 0 ? -1 : 1;
  const phase = pattern.phase + index * 2.4;
  const independentPitch = direction * 0.9 + 0.6 * Math.sin(time * 0.19 + phase);
  const independentYaw = direction * 0.55 + 0.45 * Math.sin(time * 0.13 + phase);
  const pitch = time * 0.17 + pattern.phase + independentPitch * (1 - connection);
  const yaw = time * 0.14 + pattern.tilt + independentYaw * (1 - connection);
  const independentScale = 0.5 + 0.75 * (index === 0 ? growth : 1 - growth);
  const scale = independentScale * (1 - connection) + 0.875 * connection;
  const orbit = Math.sin(time * 0.11 + pattern.tilt) * 0.65;
  const shapePhase = phase * (1 - connection) + pattern.phase * connection;
  return { center: [direction * separation * Math.cos(orbit), direction * separation * Math.sin(orbit),
    direction * 0.22 * Math.sin(time * 0.21 + phase) * (1 - connection)], scale, boundRadius: scale * 1.5 + 0.2,
    pitchCosine: Math.cos(pitch), pitchSine: Math.sin(pitch), yawCosine: Math.cos(yaw), yawSine: Math.sin(yaw),
    phase: shapePhase, ripple: pattern.ripple, stretch: 1 + 0.25 * Math.sin(time * 0.12 + shapePhase),
    voidRadius: MINIMUM_VOID_RADIUS + 0.03 * (1 + Math.sin(time * 0.13 + shapePhase)) };
}

/** Prepare two hollow forms that align, join, rotate together, and separate.
 * @param {{time: number, variation: number}} options
 * @returns {{bodies: object[], blendRadius: number}}
 */
export function createSculptureScene({ time, variation }) {
  const pattern = createSculpturePattern(variation);
  const { separation } = sampleFusionMotion({ time, variation });
  const growth = 0.5 + 0.5 * Math.sin(time * 0.23 + pattern.phase + 1);
  const travel = Math.min(1, Math.max(0, (separation - JOINED_BODY_SEPARATION) / ALIGNMENT_TRAVEL_DISTANCE));
  const connection = 1 - easeFusionTransition(travel);
  const bodies = [0, 1].map(index => createSculptureBody({ index, time, pattern, separation, growth, connection }));
  return { bodies, blendRadius: 0.36 + 0.12 * Math.sin(time * 0.15 + pattern.phase) };
}

/** Transform a world-space point into a rotating loop's local coordinates.
 * @param {number[]} point
 * @param {object} body
 * @returns {number[]}
 */
function transformToBodyCoordinates(point, body) {
  const horizontal = (point[0] - body.center[0]) / body.scale;
  const vertical = (point[1] - body.center[1]) / body.scale;
  const depth = (point[2] - body.center[2]) / body.scale;
  const turnedHorizontal = horizontal * body.yawCosine - depth * body.yawSine;
  const turnedDepth = depth * body.yawCosine + horizontal * body.yawSine;
  return [turnedHorizontal, vertical * body.pitchCosine + turnedDepth * body.pitchSine,
    turnedDepth * body.pitchCosine - vertical * body.pitchSine];
}

/** Keep the loop and its central tunnel separate so fusion cannot fill the opening.
 * @param {number[]} point
 * @param {object} body
 * @returns {{surface: number, cavity: number}}
 */
function sampleBodyFields(point, body) {
  const [horizontal, vertical, depth] = transformToBodyCoordinates(point, body);
  const stretchedHorizontal = horizontal / body.stretch;
  const stretchedVertical = vertical * body.stretch;
  const warpedHorizontal = stretchedHorizontal + 0.08 * Math.sin(vertical * 3 + body.phase);
  const warpedDepth = depth + 0.06 * Math.sin(horizontal * 3 - body.phase);
  const angle = Math.atan2(stretchedVertical, warpedHorizontal);
  const contour = RING_MAJOR_RADIUS + 0.08 * Math.sin(angle * 3 + body.phase) + 0.04 * Math.cos(angle * 2 - body.phase);
  const ringRadius = Math.hypot(warpedHorizontal, stretchedVertical) - contour;
  const tubeRadius = RING_TUBE_RADIUS + 0.035 * Math.sin(angle * 2 + vertical * 3 + body.phase);
  const ripple = body.ripple * 0.7 * Math.sin(horizontal * 3 + body.phase) *
    Math.sin(vertical * 3 - body.phase) * Math.sin(depth * 3 + body.phase);
  const radialCavity = Math.hypot(stretchedHorizontal, stretchedVertical) - body.voidRadius;
  const depthCavity = Math.abs(depth) - VOID_HALF_DEPTH;
  const cavity = Math.hypot(Math.max(radialCavity, 0), Math.max(depthCavity, 0)) +
    Math.min(Math.max(radialCavity, depthCavity), 0);
  return { surface: (Math.hypot(ringRadius, warpedDepth) - tubeRadius + ripple) * body.scale,
    cavity: cavity * body.scale };
}

/** Unite neighboring surfaces or cavities with a rounded connection.
 * @param {{first: number, second: number, radius: number}} distances
 * @returns {number}
 */
function blendDistanceFields({ first, second, radius }) {
  const overlap = Math.max(radius - Math.abs(first - second), 0) / radius;
  return Math.min(first, second) - overlap * overlap * radius * 0.25;
}

/** Carve the central tunnels after joining both bodies, preserving a real void.
 * @param {number[]} point
 * @param {{bodies: object[], blendRadius: number}} scene
 * @returns {number}
 */
export function sampleSculptureDistance(point, scene) {
  const first = sampleBodyFields(point, scene.bodies[0]);
  const second = sampleBodyFields(point, scene.bodies[1]);
  const surface = blendDistanceFields({ first: first.surface, second: second.surface, radius: scene.blendRadius });
  const cavity = blendDistanceFields({ first: first.cavity, second: second.cavity, radius: scene.blendRadius * 0.25 });
  return Math.max(surface, -cavity);
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
