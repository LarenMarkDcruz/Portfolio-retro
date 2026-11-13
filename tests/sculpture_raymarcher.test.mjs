import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSculptureScene, sampleSculptureDistance } from '../dist/sculpture_surfaces.js';
import { traceSculptureRay, calculateSurfaceLight } from '../dist/sculpture_raymarcher.js';

test('should hit the ring while leaving its center visibly hollow', () => {
  const scene = createSculptureScene({ time: 0, variation: 0 });
  scene.bodies = scene.bodies.map((body, index) => ({ ...body,
    center: [index * 5, 0, 0], scale: 1, boundRadius: 1.5, stretch: 1, voidRadius: 0.43, phase: 0, ripple: 0,
    pitchCosine: 1, pitchSine: 0, yawCosine: 1, yawSine: 0 }));
  const surface = traceSculptureRay([0.8, 0, 4], scene);
  assert.ok(surface);
  assert.ok(Math.abs(sampleSculptureDistance(surface.point, scene)) < 0.01);
  assert.ok(surface.normal[2] > 0.9);
  const light = calculateSurfaceLight(surface, scene);
  assert.ok(Number.isFinite(light) && light >= 0 && light <= 1);
  assert.equal(traceSculptureRay([0, 0, 4], scene), null);
  assert.equal(traceSculptureRay([10, 10, 4], scene), null);
});

test('should keep a through-hole clear even when another ring overlaps its center', () => {
  const scene = createSculptureScene({ time: 0, variation: 0 });
  scene.bodies = scene.bodies.map((body, index) => ({ ...body,
    center: [index * 0.8, 0, 0], scale: 1, boundRadius: 1.5, stretch: 1, voidRadius: 0.43,
    phase: 0, ripple: 0, pitchCosine: 1, pitchSine: 0, yawCosine: 1, yawSine: 0 }));
  assert.ok(sampleSculptureDistance([0, 0, 0], scene) > 0.4);
  assert.equal(traceSculptureRay([0, 0, 4], scene), null);
  assert.ok(traceSculptureRay([-0.8, 0, 4], scene));
});
