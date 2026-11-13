import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateSculptureMotionSpeed, createSculptureViewport, renderAsciiSculpture } from '../dist/ascii_sculpture.js';

test('should ease smoothly between 1.96875 and 2.625 motion speed', () => {
  const speeds = [];
  for (let time = 0; time < 100; time += 0.1) {
    const speed = calculateSculptureMotionSpeed({ time, variation: 2 });
    assert.ok(speed >= 1.96875 && speed <= 2.625);
    if (speeds.length) assert.ok(Math.abs(speed - speeds.at(-1)) < 0.0065625);
    speeds.push(speed);
  }
  assert.ok(Math.min(...speeds) < 1.981875);
  assert.ok(Math.max(...speeds) > 2.611875);
  assert.notEqual(calculateSculptureMotionSpeed({ time: 5, variation: 2 }),
    calculateSculptureMotionSpeed({ time: 5, variation: 3 }));
});

test('should preserve repeatable frame dimensions for a given time and seed', () => {
  const options = { time: 5, variation: 2 };
  const frame = renderAsciiSculpture(options);
  assert.equal(frame, renderAsciiSculpture(options));
  assert.notEqual(frame, renderAsciiSculpture({ ...options, variation: 3 }));
  assert.equal(frame.split('\n').length, 96);
  assert.ok(frame.split('\n').every(row => row.length === 160));
});

test('should retain the camera and character grid while shapes grow and merge', () => {
  const viewport = createSculptureViewport({ width: 575, height: 218 });
  const frames = [0, 5, 12, 20].map(time =>
    renderAsciiSculpture({ time, variation: 2, viewport }).split('\n'));
  for (const rows of frames) {
    assert.equal(rows.length, viewport.rows);
    assert.ok(rows.every(row => row.length === 160));
    assert.ok(rows.some(row => row.trim().length > 0));
  }
  const tallerViewport = createSculptureViewport({ width: 575, height: 320 });
  assert.equal(viewport.halfWidth, tallerViewport.halfWidth);
  assert.ok(Math.abs(viewport.halfHeight / viewport.rows - tallerViewport.halfHeight / tallerViewport.rows) < 1e-12);
  assert.ok(tallerViewport.rows > viewport.rows);
});
