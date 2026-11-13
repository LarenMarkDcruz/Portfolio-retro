import { sampleSculptureDistance, sampleSculptureSurface } from './sculpture_surfaces.js?v=carved-texture';

import { sampleSculptureMaterial } from './sculpture_material.js?v=carved-texture';

const KEY_LIGHT_DIRECTION = Object.freeze([-0.45, 0.62, 0.642]);
const HIGHLIGHT_HALF_DIRECTION = Object.freeze([-0.248, 0.342, 0.907]);
const CONTACT_SAMPLE_OFFSETS = Object.freeze([0.08, 0.24]);
const SHADOW_SAMPLE_OFFSETS = Object.freeze([0.12, 0.32, 0.7]);
const SHADOW_SURFACE_OFFSET = 0.035;
const MAXIMUM_RAY_STEPS = 80;
const SURFACE_HIT_DISTANCE = 0.009;
const SAFE_DISTANCE_STEP_FACTOR = 0.6;
const SURFACE_LIGHT_CONTRAST_EXPONENT = 2.25;

/** Restrict a viewing ray to the conservative bounds of both animated bodies.
 * @param {number[]} origin
 * @param {object} scene
 * @returns {{entry: number, exit: number} | null}
 */
function findRayInterval(origin, scene) {
  let entry = -Infinity;
  let exit = Infinity;
  let hasIntersection = false;
  for (const body of scene.bodies) {
    const horizontal = origin[0] - body.center[0];
    const vertical = origin[1] - body.center[1];
    const squaredDepth = body.boundRadius ** 2 - horizontal ** 2 - vertical ** 2;
    if (squaredDepth <= 0) continue;
    const depth = Math.sqrt(squaredDepth);
    entry = Math.max(entry, body.center[2] + depth);
    exit = Math.min(exit, body.center[2] - depth);
    hasIntersection = true;
  }
  return hasIntersection ? { entry, exit } : null;
}

/** Trace the frontmost fused surface without gaps from sparse point sampling.
 * @param {number[]} origin
 * @param {object} scene
 * @returns {{point: number[], normal: number[]} | null}
 */
export function traceSculptureRay(origin, scene) {
  const interval = findRayInterval(origin, scene);
  if (!interval) return null;
  const point = [origin[0], origin[1], interval.entry];
  for (let step = 0; step < MAXIMUM_RAY_STEPS && point[2] >= interval.exit; step++) {
    const distance = sampleSculptureDistance(point, scene);
    if (distance < SURFACE_HIT_DISTANCE) return sampleSculptureSurface(point, scene);
    point[2] -= Math.max(distance * SAFE_DISTANCE_STEP_FACTOR, SURFACE_HIT_DISTANCE * 0.5);
  }
  return null;
}

/** Sample nearby occlusion so inner walls and joins have visible depth.
 * @param {{point: number[], normal: number[]}} surface
 * @param {object} scene
 * @returns {number}
 */
function calculateContactVisibility(surface, scene) {
  let occlusion = 0;
  CONTACT_SAMPLE_OFFSETS.forEach((offset, index) => {
    const outside = surface.point.map((coordinate, axis) => coordinate + surface.normal[axis] * offset);
    const distance = sampleSculptureDistance(outside, scene);
    occlusion += Math.max(0, 1 - distance / offset) * (index === 0 ? 0.65 : 0.35);
  });
  return 1 - Math.min(0.85, occlusion * 0.85);
}

/** Let one curved surface cast a soft shadow onto the other.
 * @param {{point: number[], normal: number[]}} surface
 * @param {object} scene
 * @returns {number}
 */
function calculateKeyLightVisibility(surface, scene) {
  let visibility = 1;
  for (const offset of SHADOW_SAMPLE_OFFSETS) {
    const sample = surface.point.map((coordinate, axis) => coordinate +
      surface.normal[axis] * SHADOW_SURFACE_OFFSET + KEY_LIGHT_DIRECTION[axis] * offset);
    const distance = sampleSculptureDistance(sample, scene);
    visibility = Math.min(visibility, Math.max(0.14, distance / offset * 6));
  }
  return visibility;
}

/** Model a lit, slightly rough material rather than a flat brightness ramp.
 * @param {{point: number[], normal: number[], materialPoint?: number[]}} surface
 * @param {object} scene
 * @returns {number}
 */
export function calculateSurfaceLight(surface, scene) {
  const [horizontal, vertical, depth] = surface.normal;
  const material = sampleSculptureMaterial(surface.materialPoint ?? surface.point);
  const diffuse = Math.max(0, surface.normal.reduce((sum, coordinate, axis) =>
    sum + coordinate * KEY_LIGHT_DIRECTION[axis], 0));
  const reflection = Math.max(0, surface.normal.reduce((sum, coordinate, axis) =>
    sum + coordinate * HIGHLIGHT_HALF_DIRECTION[axis], 0));
  const fill = Math.max(0, horizontal * 0.65 - vertical * 0.2 + depth * 0.73) * 0.07;
  const rim = Math.pow(1 - Math.max(0, depth), 3) * Math.max(0, vertical * 0.4 + 0.6) * 0.1;
  const highlight = Math.pow(reflection, 12 + material.roughness * 24) * 0.85;
  const shadow = calculateKeyLightVisibility(surface, scene);
  const illumination = 0.015 + fill + rim + shadow *
    (Math.pow(diffuse, SURFACE_LIGHT_CONTRAST_EXPONENT) * 1.2 + highlight);
  return Math.min(1, illumination * calculateContactVisibility(surface, scene) * (0.9 + material.grain * 0.2));
}
