import { sampleSculptureDistance, sampleSculptureSurface } from './sculpture_surfaces.js?v=abstract-contours';

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

/** Light the actual merged geometry with crisp highlights and contact shadows.
 * @param {{point: number[], normal: number[]}} surface
 * @param {object} scene
 * @returns {number}
 */
export function calculateSurfaceLight(surface, scene) {
  const [horizontal, vertical, depth] = surface.normal;
  const diffuse = Math.max(0, horizontal * -0.4 + vertical * 0.55 + depth * 0.73);
  const reflection = Math.max(0, horizontal * -0.21 + vertical * 0.29 + depth * 0.934);
  const outside = surface.point.map((coordinate, index) => coordinate + surface.normal[index] * 0.18);
  const contactLight = Math.min(1, Math.max(0.35, sampleSculptureDistance(outside, scene) / 0.18));
  return Math.min(1, (Math.pow(diffuse, SURFACE_LIGHT_CONTRAST_EXPONENT) * 0.85 +
    Math.pow(reflection, 24) * 0.6) * contactLight);
}
