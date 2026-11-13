import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sampleSculptureMaterial } from '../dist/sculpture_material.js';
import { createSculptureScene, sampleSculptureSurface } from '../dist/sculpture_surfaces.js';
import { traceSculptureRay, calculateSurfaceLight } from '../dist/sculpture_raymarcher.js';

/** Isolate a front-facing loop from its companion for material checks.
 * @returns {object}
 */
function createFrontFacingRingScene() {
  const scene = createSculptureScene({ time: 0, variation: 0 });
  scene.bodies = scene.bodies.map((body, index) => ({ ...body,
    center: [index * 5, 0, 0], scale: 1, boundRadius: 1.5, stretch: 1, voidRadius: 0.43, phase: 0, ripple: 0,
    pitchCosine: 1, pitchSine: 0, yawCosine: 1, yawSine: 0 }));
  return scene;
}

test('should produce repeatable bounded grain that changes smoothly across the surface', () => {
  for (let horizontal = -2; horizontal <= 2; horizontal += 0.1) {
    const point = [horizontal, 0.4, -0.7];
    const material = sampleSculptureMaterial(point);
    const nearby = sampleSculptureMaterial([horizontal + 0.0001, 0.4, -0.7]);
    assert.deepEqual(material, sampleSculptureMaterial(point));
    for (const value of Object.values(material)) assert.ok(value >= 0 && value <= 1);
    assert.ok(Math.abs(material.grain - nearby.grain) < 0.01);
    assert.ok(Math.abs(material.glyphVariation - nearby.glyphVariation) < 0.01);
  }
});

test('should keep the same material grain attached to a point when its body rotates', () => {
  const scene = createFrontFacingRingScene();
  const before = sampleSculptureSurface([0.8, 0, 0], scene);
  const angle = 0.7;
  const rotated = { ...scene, bodies: scene.bodies.map((body, index) => index === 0 ?
    { ...body, yawCosine: Math.cos(angle), yawSine: Math.sin(angle) } : body) };
  const after = sampleSculptureSurface([0.8 * Math.cos(angle), 0, -0.8 * Math.sin(angle)], rotated);
  before.materialPoint.forEach((coordinate, index) => {
    assert.ok(Math.abs(coordinate - after.materialPoint[index]) < 1e-12);
  });
  assert.ok(Math.abs(sampleSculptureMaterial(before.materialPoint).grain -
    sampleSculptureMaterial(after.materialPoint).grain) < 1e-12);
});

test('should render both bright highlights and deep shadows on the curved loop', () => {
  const scene = createFrontFacingRingScene();
  const brightness = [];
  for (let horizontal = -1.1; horizontal < 1.1; horizontal += 0.1) {
    for (let vertical = -1.1; vertical < 1.1; vertical += 0.1) {
      const surface = traceSculptureRay([horizontal, vertical, 4], scene);
      if (surface) brightness.push(calculateSurfaceLight(surface, scene));
    }
  }
  assert.ok(brightness.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
  assert.ok(brightness.filter(value => value > 0.85).length > 10);
  assert.ok(brightness.filter(value => value < 0.1).length > 10);
});
