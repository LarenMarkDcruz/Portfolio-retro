import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SCULPTURE_PATTERNS, SCULPTURE_STYLES, createPatternGeometry, selectSculpturePattern } from '../dist/sculpture_patterns.js';
import { createSculptureViewport, renderAsciiSculpture } from '../dist/ascii_sculpture.js';
import { renderPatternSculpture } from '../dist/sculpture_point_renderer.js';

test('should select all sixteen distinct families from equally spaced random seeds', () => {
  const selections = SCULPTURE_PATTERNS.map((pattern, index) => {
    const variation = (index + 0.5) / SCULPTURE_PATTERNS.length * Math.PI * 2;
    assert.equal(selectSculpturePattern(variation), pattern);
    return pattern.name;
  });
  assert.equal(new Set(selections).size, 16);
  assert.equal(selectSculpturePattern(-Math.PI), selectSculpturePattern(Math.PI));
});

test('should generate finite paired geometry and recognizable nonempty frames for every family', () => {
  const viewport = createSculptureViewport({ width: 390, height: 219 });
  const snapshots = new Set();
  SCULPTURE_PATTERNS.forEach((pattern, index) => {
    const variation = (index + 0.37) / SCULPTURE_PATTERNS.length * Math.PI * 2;
    const geometry = createPatternGeometry(variation);
    assert.equal(geometry.pattern, pattern);
    for (const body of geometry.bodies) {
      assert.ok(body.points.length > 1000, pattern.name);
      assert.ok(body.points.every(Number.isFinite), pattern.name);
    }
    const frame = renderAsciiSculpture({ time: 4, variation, geometry, viewport });
    assert.ok(frame.replace(/\s/g, '').length > 150, pattern.name);
    assert.equal(frame.split('\n').length, viewport.rows);
    assert.ok(frame.split('\n').every(row => row.length === 128));
    snapshots.add(frame);
  });
  assert.equal(snapshots.size, 16);
});

test('should preserve seeded geometry, depth ordering, and framing as an interwoven pair moves', () => {
  const variation = 1.5 / SCULPTURE_PATTERNS.length * Math.PI * 2;
  const geometry = createPatternGeometry(variation);
  const viewport = createSculptureViewport({ width: 607, height: 320 });
  assert.deepEqual(geometry, createPatternGeometry(variation));
  const before = renderPatternSculpture({ geometry, time: 1, viewport });
  const after = renderPatternSculpture({ geometry, time: 2, viewport });
  assert.notDeepEqual(before.characters, after.characters);
  assert.equal(before.columns, after.columns);
  assert.equal(before.rows, after.rows);
  before.characters.forEach((character, position) => {
    if (character === ' ') return;
    assert.ok(Number.isFinite(before.depths[position]));
    assert.ok(before.tones[position] <= 6);
  });
  assert.deepEqual(geometry, createPatternGeometry(variation));
});

test('should retain the original fusion algorithm and explicitly selected families across seeds', () => {
  const original = createPatternGeometry(2, 'classic');
  assert.equal(original.pattern.name, 'Classic fusion');
  assert.equal(original.pattern.firstSurface, 'fusion');
  assert.equal(original.orbits.length, 0);
  const viewport = createSculptureViewport({ width: 575, height: 218 });
  const frame = renderAsciiSculpture({ time: 3, variation: 2, geometry: original, viewport });
  assert.ok(frame.replace(/\s/g, '').length > 150);
  assert.equal(SCULPTURE_STYLES.length, 18);
  for (const variation of [0, 2, 6]) {
    assert.equal(createPatternGeometry(variation, 'double helix').pattern.name, 'double helix');
  }
  assert.throws(() => createPatternGeometry(2, 'missing style'), /Unknown sculpture style: missing style/);
});
