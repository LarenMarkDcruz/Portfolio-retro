import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateSculptureMotionSpeed, createSculptureViewport, renderAsciiSculpture } from '../dist/ascii_sculpture.js';

test('should ease smoothly between 2.25 and triple motion speed', () => {
  const speeds = [];
  for (let time = 0; time < 100; time += 0.1) {
    const speed = calculateSculptureMotionSpeed({ time, variation: 2 });
    assert.ok(speed >= 2.25 && speed <= 3);
    if (speeds.length) assert.ok(Math.abs(speed - speeds.at(-1)) < 0.0075);
    speeds.push(speed);
  }
  assert.ok(Math.min(...speeds) < 2.265);
  assert.ok(Math.max(...speeds) > 2.985);
  assert.notEqual(calculateSculptureMotionSpeed({ time: 5, variation: 2 }),
    calculateSculptureMotionSpeed({ time: 5, variation: 3 }));
});

test('should preserve repeatable frame dimensions for a given time and seed', () => {
  const options = { time: 5, variation: 2 };
  const frame = renderAsciiSculpture(options);
  assert.equal(frame, renderAsciiSculpture(options));
  assert.notEqual(frame, renderAsciiSculpture({ ...options, variation: 3 }));
  assert.equal(frame.split('\n').length, 64);
  assert.ok(frame.split('\n').every(row => row.length === 104));
});

test('should retain the camera and character grid while shapes grow and merge', () => {
  const viewport = createSculptureViewport({ width: 575, height: 218 });
  const frames = [0, 5, 12, 20].map(time =>
    renderAsciiSculpture({ time, variation: 2, viewport }).split('\n'));
  for (const rows of frames) {
    assert.equal(rows.length, viewport.rows);
    assert.ok(rows.every(row => row.length === 104));
    assert.ok(rows.some(row => row.trim().length > 0));
  }
  const tallerViewport = createSculptureViewport({ width: 575, height: 320 });
  assert.equal(viewport.halfWidth, tallerViewport.halfWidth);
  assert.equal(viewport.halfHeight / viewport.rows, tallerViewport.halfHeight / tallerViewport.rows);
  assert.ok(tallerViewport.rows > viewport.rows);
});
