import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSculptureScene, sampleSculptureDistance, sampleSculptureSurface } from '../dist/sculpture_surfaces.js';

test('should reproduce two bodies with the same time and seed', () => {
  const options = { time: 5, variation: 2 };
  const scene = createSculptureScene(options);
  assert.equal(scene.bodies.length, 2);
  assert.deepEqual(scene, createSculptureScene(options));
  assert.notDeepEqual(scene, createSculptureScene({ ...options, variation: 3 }));
  assert.ok(scene.bodies[0].scale > scene.bodies[1].scale * 1.5);
  const laterScene = createSculptureScene({ ...options, time: 20 });
  assert.ok(laterScene.bodies[1].scale > laterScene.bodies[0].scale * 1.5);
});

test('should create a connecting surface where separate bodies leave a gap', () => {
  const scene = createSculptureScene({ time: 0, variation: 0 });
  scene.bodies = scene.bodies.map((body, index) => ({ ...body,
    center: [index === 0 ? -0.93 : 0.93, 0, 0], scale: 1, morph: 1, ripple: 0,
    pitchCosine: 1, pitchSine: 0, yawCosine: 1, yawSine: 0 }));
  scene.blendRadius = 0.36;
  const midpoint = [0, 0, 0];
  assert.ok(sampleSculptureDistance(midpoint, { ...scene, blendRadius: 1e-9 }) > 0);
  assert.ok(sampleSculptureDistance(midpoint, scene) < 0);
  const separated = { ...scene, bodies: scene.bodies.map(body => ({ ...body,
    center: body.center.map(coordinate => coordinate * 2) })) };
  assert.ok(sampleSculptureDistance(midpoint, separated) > 0);
  const surface = sampleSculptureSurface([0, 0, 0.3], scene);
  assert.ok(surface.normal.every(Number.isFinite));
  assert.ok(Math.abs(Math.hypot(...surface.normal) - 1) < 1e-8);
});
