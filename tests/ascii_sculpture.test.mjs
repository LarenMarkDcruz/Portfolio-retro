import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateSculptureMotionSpeed, renderAsciiSculpture } from '../dist/ascii_sculpture.js';

test('should ease smoothly between one-and-a-half and double motion speed', () => {
  const speeds = [];
  for (let time = 0; time < 100; time += 0.1) {
    const speed = calculateSculptureMotionSpeed({ time, variation: 2 });
    assert.ok(speed >= 1.5 && speed <= 2);
    if (speeds.length) assert.ok(Math.abs(speed - speeds.at(-1)) < 0.005);
    speeds.push(speed);
  }
  assert.ok(Math.min(...speeds) < 1.51);
  assert.ok(Math.max(...speeds) > 1.99);
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
