const POINT_STRIDE = 8;
const FULL_ROTATION = Math.PI * 2;
const SHADE_GROUPS = Object.freeze(['.`', '.:', ':+', '*o', 's0', '0G', '8@']);
const LIGHT_CONTRAST = 2.25;

/** Allocate one fixed-resolution frame with shared depth across all surfaces.
 * @param {{columns: number, rows: number}} viewport
 * @returns {object}
 */
export function createSculptureFrame(viewport) {
  const size = viewport.columns * viewport.rows;
  return { columns: viewport.columns, rows: viewport.rows, characters: Array(size).fill(' '),
    tones: new Uint8Array(size), depths: new Float32Array(size).fill(-Infinity) };
}

/** Prepare a smooth, seed-specific pose without moving or zooming the camera.
 * @param {{time: number, variation: number, index: number, isOpenSurface?: boolean, isInterwoven?: boolean}} options
 * @returns {object}
 */
function createBodyPose({ time, variation, index, isOpenSurface = false, isInterwoven = false }) {
  const direction = index === 0 ? -1 : 1;
  const phase = variation * 3.7 + (isInterwoven ? 0 : index * Math.PI);
  const growth = 0.5 + 0.5 * Math.sin(time * 0.15 + variation);
  const separation = 0.28 + 0.52 * (0.5 + 0.5 * Math.sin(time * 0.18 + variation));
  const pitch = isOpenSurface ? 0.4 + Math.sin(time * 0.13 + phase) * 0.3 :
    0.55 + Math.sin(time * 0.13 + phase) * 0.65;
  const yaw = isOpenSurface ? Math.sin(time * 0.17 + phase) * 0.55 :
    time * (index === 0 ? 0.17 : -0.14) + phase;
  const roll = Math.sin(time * 0.09 + variation) * 0.5 + direction * 0.25;
  return { scale: (isInterwoven ? 0.8 : 0.62) + (isInterwoven ? 0.2 : 0.42) * (index === 0 ? growth : 1 - growth),
    center: [direction * separation * (isInterwoven ? 0.22 : 1), direction * 0.12 * Math.sin(time * 0.12), 0.14 * Math.sin(phase)],
    pitchCosine: Math.cos(pitch), pitchSine: Math.sin(pitch), yawCosine: Math.cos(yaw), yawSine: Math.sin(yaw),
    rollCosine: Math.cos(roll), rollSine: Math.sin(roll), phase, time };
}

/** Rotate positions and normals through the same orthogonal transform.
 * @param {number[]} point
 * @param {object} pose
 * @returns {number[]}
 */
function rotatePoint(point, pose) {
  const horizontal = point[0] * pose.yawCosine + point[2] * pose.yawSine;
  const turnedDepth = point[2] * pose.yawCosine - point[0] * pose.yawSine;
  const vertical = point[1] * pose.pitchCosine - turnedDepth * pose.pitchSine;
  const depth = point[1] * pose.pitchSine + turnedDepth * pose.pitchCosine;
  return [horizontal * pose.rollCosine - vertical * pose.rollSine,
    horizontal * pose.rollSine + vertical * pose.rollCosine, depth];
}

/** Resolve depth before choosing a glyph, preserving foreground intersections.
 * @param {{point: number[], brightness: number, texture: number}} sample
 * @param {object} frame
 * @param {object} viewport
 * @returns {void}
 */
function writeProjectedPoint({ point, brightness, texture }, frame, viewport) {
  const scale = Math.min(1, viewport.halfHeight / 1.45);
  const column = Math.floor((point[0] * scale / viewport.halfWidth + 1) * 0.5 * frame.columns);
  const row = Math.floor((1 - point[1] * scale / viewport.halfHeight) * 0.5 * frame.rows);
  if (column < 0 || column >= frame.columns || row < 0 || row >= frame.rows) return;
  const position = row * frame.columns + column;
  if (point[2] < frame.depths[position]) return;
  frame.depths[position] = point[2];
  const tone = Math.min(SHADE_GROUPS.length - 1, Math.floor(brightness * SHADE_GROUPS.length));
  const group = SHADE_GROUPS[tone];
  frame.tones[position] = tone;
  frame.characters[position] = group[Math.floor(texture * group.length) % group.length];
}

/** Shade both sides of open sheets with bright edges and pronounced shadows.
 * @param {number[]} normal
 * @param {{horizontal: number, vertical: number}} texture
 * @returns {number}
 */
function calculatePointBrightness(normal, texture) {
  const facing = normal[2] < 0 ? -1 : 1;
  const diffuse = Math.max(0, facing * (normal[0] * -0.38 + normal[1] * 0.58 + normal[2] * 0.72));
  const sheen = Math.pow(Math.max(0, facing * (normal[0] * -0.2 + normal[1] * 0.3 + normal[2] * 0.932)), 18);
  const weave = 0.84 + 0.16 * Math.cos(texture.horizontal * 80) * Math.cos(texture.vertical * 60);
  const rim = Math.pow(1 - Math.abs(normal[2]), 2) * 0.2;
  return Math.min(1, 0.18 + Math.pow(diffuse, LIGHT_CONTRAST) * 1.05 * weave +
    Math.abs(normal[2]) * 0.12 + sheen * 0.55 + rim);
}

/** Draw a cached surface with gently breathing proportions and a shared depth map.
 * @param {{body: object, pose: object}} surface
 * @param {object} frame
 * @param {object} viewport
 * @returns {void}
 */
function drawPatternBody({ body, pose }, frame, viewport) {
  const points = body.points;
  for (let position = 0; position < points.length; position += POINT_STRIDE) {
    const horizontal = points[position + 6];
    const vertical = points[position + 7];
    const breathing = 1 + 0.07 * Math.sin(horizontal * FULL_ROTATION * 3 + pose.time * 0.2 + pose.phase);
    const localPoint = [points[position] * breathing, points[position + 1], points[position + 2] * breathing];
    const point = rotatePoint(localPoint, pose).map((coordinate, index) => coordinate * pose.scale + pose.center[index]);
    const normal = rotatePoint([points[position + 3], points[position + 4], points[position + 5]], pose);
    writeProjectedPoint({ point, brightness: calculatePointBrightness(normal, { horizontal, vertical }),
      texture: (horizontal * 113 + vertical * 47) % 1 }, frame, viewport);
  }
}

/** Draw curved orbital bands with volume, shading, and the shared depth buffer.
 * @param {{geometry: object, time: number}} options
 * @param {object} frame
 * @param {object} viewport
 * @returns {void}
 */
export function drawSculptureOrbits({ geometry, time }, frame, viewport) {
  geometry.orbits.forEach((body, index) => {
    const pose = createBodyPose({ time: time * 0.4, variation: geometry.variation + index * 0.6, index: 0 });
    drawPatternBody({ body, pose: { ...pose, scale: 1, center: [0, 0, 0] } }, frame, viewport);
  });
}

/** Render a parametric pair and its orbital traces at a stable camera scale.
 * @param {{geometry: object, time: number, viewport: object}} options
 * @returns {object}
 */
export function renderPatternSculpture({ geometry, time, viewport }) {
  const frame = createSculptureFrame(viewport);
  geometry.bodies.forEach((body, index) => {
    const isOpenSurface = ['spiral', 'galaxy', 'fabric', 'ribbon', 'infinity', 'clover', 'knot'].includes(body.kind);
    const isInterwoven = ['helix', 'ribbon', 'infinity', 'knot', 'clover', 'fabric'].includes(geometry.pattern.firstSurface);
    const pose = createBodyPose({ time, variation: geometry.variation, index, isOpenSurface, isInterwoven });
    drawPatternBody({ body, pose }, frame, viewport);
  });
  drawSculptureOrbits({ geometry, time }, frame, viewport);
  return frame;
}
