import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSculptureScene, sampleSculptureDistance } from '../dist/sculpture_surfaces.js';
import { traceSculptureRay, calculateSurfaceLight } from '../dist/sculpture_raymarcher.js';

test('should find the visible surface and skip rays outside both bodies', () => {
  const scene = createSculptureScene({ time: 0, variation: 0 });
  scene.bodies = scene.bodies.map((body, index) => ({ ...body,
    center: [index * 5, 0, 0], scale: 1, boundRadius: 1.5, morph: 1, ripple: 0,
    pitchCosine: 1, pitchSine: 0, yawCosine: 1, yawSine: 0 }));
  const surface = traceSculptureRay([0, 0, 4], scene);
  assert.ok(surface);
  assert.ok(Math.abs(sampleSculptureDistance(surface.point, scene)) < 0.01);
  assert.ok(surface.normal[2] > 0.99);
  const light = calculateSurfaceLight(surface, scene);
  assert.ok(Number.isFinite(light) && light >= 0 && light <= 1);
  assert.equal(traceSculptureRay([10, 10, 4], scene), null);
});
