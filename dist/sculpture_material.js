const GRAIN_CENTER = 0.5;
const BROAD_GRAIN_STRENGTH = 0.28;
const FINE_GRAIN_STRENGTH = 0.17;

/** Keep the character grain continuous in the rotating material's coordinates.
 * @param {number[]} point
 * @returns {{grain: number, glyphVariation: number, roughness: number}}
 */
export function sampleSculptureMaterial(point) {
  const [horizontal, vertical, depth] = point;
  const broadGrain = Math.sin(horizontal * 5.1 + Math.sin(vertical * 3.2)) *
    Math.sin(vertical * 4.3 + depth * 2.7);
  const fineGrain = Math.sin(horizontal * 19 + vertical * 13 + depth * 11) *
    Math.sin(depth * 17 - vertical * 9);
  const grain = GRAIN_CENTER + BROAD_GRAIN_STRENGTH * broadGrain + FINE_GRAIN_STRENGTH * fineGrain;
  const glyphVariation = 0.5 + 0.5 * Math.sin(horizontal * 31.3 +
    Math.sin(vertical * 21.7 + depth * 17.9) * 3.1) * Math.cos(vertical * 23.7 - depth * 19.5);
  return { grain, glyphVariation, roughness: 0.35 + 0.45 * grain };
}
