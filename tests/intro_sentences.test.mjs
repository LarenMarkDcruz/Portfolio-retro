import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INTRO_SENTENCE_POOLS, selectIntroText } from '../dist/intro_sentences.js';

test('should offer thirty wordings without changing the supplied professional details', () => {
  assert.equal(INTRO_SENTENCE_POOLS.flat().length, 30);
  for (const sentence of INTRO_SENTENCE_POOLS[0]) assert.match(sentence, /software engineer/);
  for (const sentence of INTRO_SENTENCE_POOLS[1]) {
    for (const detail of ['K8s (Kubernetes)', 'Go', 'SRE/DevOps', 'Cisco/Splunk']) {
      assert.ok(sentence.includes(detail));
    }
  }
  for (const sentence of INTRO_SENTENCE_POOLS[2]) assert.ok(sentence.includes('Victoria, BC'));
});

test('should independently select exactly one sentence from each pool', () => {
  const baseline = selectIntroText([0, 0, 0]);
  assert.equal(baseline, INTRO_SENTENCE_POOLS.map(pool => pool[0]).join(' '));
  assert.equal(baseline.split('. ').length, 3);
  assert.equal(selectIntroText([0.99, 0, 0]),
    [INTRO_SENTENCE_POOLS[0][9], INTRO_SENTENCE_POOLS[1][0], INTRO_SENTENCE_POOLS[2][0]].join(' '));
  assert.equal(selectIntroText([0, 0.99, 0.99]),
    [INTRO_SENTENCE_POOLS[0][0], INTRO_SENTENCE_POOLS[1][9], INTRO_SENTENCE_POOLS[2][9]].join(' '));
});

test('should reject missing or invalid random values with context', () => {
  for (const values of [[], [0, 0], [0, 0, 1], [0, -1, 0], [NaN, 0, 0], [Infinity, 0, 0]]) {
    assert.throws(() => selectIntroText(values), { name: 'RangeError', message: /three finite random values/ });
  }
});
