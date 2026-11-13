import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSculptureScene, sampleFusionMotion, sampleSculptureDistance, sampleSculptureSurface } from '../dist/sculpture_surfaces.js';

test('should reproduce two bodies with the same time and seed', () => {
  const options = { time: 5, variation: 2 };
  const scene = createSculptureScene(options);
  assert.equal(scene.bodies.length, 2);
  assert.deepEqual(scene, createSculptureScene(options));
  assert.notDeepEqual(scene, createSculptureScene({ ...options, variation: 3 }));
  assert.ok(scene.bodies.every(body => body.voidRadius >= 0.43));
});

test('should create a connecting surface where separate bodies leave a gap', () => {
  const scene = createSculptureScene({ time: 0, variation: 0 });
  scene.bodies = scene.bodies.map((body, index) => ({ ...body,
    center: [index === 0 ? -1.08 : 1.08, 0, 0], scale: 1, stretch: 1, voidRadius: 0.43, phase: 0, ripple: 0,
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

test('should hold the forms together and apart for varying durations without position jumps', () => {
  const phases = new Set();
  const joinedRuns = [];
  let joinedSamples = 0;
  let previous = sampleFusionMotion({ time: 0, variation: 2 });
  for (let time = 0; time < 256; time += 0.05) {
    const motion = sampleFusionMotion({ time, variation: 2 });
    assert.deepEqual(motion, sampleFusionMotion({ time, variation: 2 }));
    assert.ok(Math.abs(motion.separation - previous.separation) < 0.04);
    if (motion.phase === 'joined') {
      assert.equal(motion.separation, 0.12);
      joinedSamples++;
    } else if (joinedSamples) {
      joinedRuns.push(joinedSamples);
      joinedSamples = 0;
    }
    phases.add(motion.phase);
    previous = motion;
  }
  assert.deepEqual(phases, new Set(['joined', 'separating', 'separated', 'merging']));
  assert.ok(joinedRuns.length >= 6);
  assert.ok(new Set(joinedRuns).size > 1);
  assert.notDeepEqual(sampleFusionMotion({ time: 10, variation: 2 }), sampleFusionMotion({ time: 10, variation: 3 }));
});

test('should rotate as one hollow oval while joined and regain independent proportions when separated', () => {
  const joined = createSculptureScene({ time: 8, variation: 2 });
  assert.equal(sampleFusionMotion({ time: 8, variation: 2 }).phase, 'joined');
  const [first, second] = joined.bodies;
  for (const property of ['scale', 'pitchCosine', 'pitchSine', 'yawCosine', 'yawSine', 'stretch']) {
    assert.equal(first[property], second[property]);
  }
  assert.ok(sampleSculptureDistance([0, 0, 0], joined) > 0);
  const rotated = createSculptureScene({ time: 12, variation: 2 });
  assert.equal(sampleFusionMotion({ time: 12, variation: 2 }).phase, 'joined');
  assert.notEqual(first.pitchCosine, rotated.bodies[0].pitchCosine);
  assert.notEqual(first.stretch, rotated.bodies[0].stretch);
  const separated = createSculptureScene({ time: 24, variation: 2 });
  assert.equal(sampleFusionMotion({ time: 24, variation: 2 }).phase, 'separated');
  assert.ok(separated.bodies[1].scale > separated.bodies[0].scale * 1.5);
  assert.notEqual(separated.bodies[0].pitchCosine, separated.bodies[1].pitchCosine);
});
