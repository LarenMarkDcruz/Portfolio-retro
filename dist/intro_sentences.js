/** Each pool covers one supplied fact: software work, current role, then location. */
export const INTRO_SENTENCE_POOLS = Object.freeze([
  [
    'I’m a software engineer building services, web applications, and the infrastructure that keeps them running.',
    'I’m a software engineer working across services, web applications, and the infrastructure behind them.',
    'As a software engineer, I build services and web applications and help keep their infrastructure running.',
    'I’m a software engineer connecting backend services, web applications, and dependable infrastructure.',
    'I’m a software engineer who enjoys building services, shaping web applications, and keeping systems running.',
    'I’m a software engineer with work spanning backend services, web applications, and infrastructure.',
    'I’m a software engineer bringing services, web applications, and the systems beneath them together.',
    'I’m a software engineer building for the web and working on the services and infrastructure behind it.',
    'I’m a software engineer focused on services, web applications, and the infrastructure they depend on.',
    'I’m a software engineer moving between application code, backend services, and the infrastructure that supports them.',
  ],
  [
    'Currently, I work with K8s (Kubernetes) and Go in an SRE/DevOps-focused role at Cisco/Splunk.',
    'At Cisco/Splunk, my current SRE/DevOps work brings together K8s (Kubernetes) and Go.',
    'My current role at Cisco/Splunk combines SRE/DevOps work with K8s (Kubernetes) and Go.',
    'These days, I work with K8s (Kubernetes) and Go as part of my SRE/DevOps role at Cisco/Splunk.',
    'Right now, K8s (Kubernetes) and Go are part of my SRE/DevOps-focused work at Cisco/Splunk.',
    'I currently put K8s (Kubernetes) and Go to work in an SRE/DevOps-focused role at Cisco/Splunk.',
    'My work at Cisco/Splunk currently centers on SRE/DevOps, with K8s (Kubernetes) and Go.',
    'Currently at Cisco/Splunk, I work across SRE/DevOps with K8s (Kubernetes) and Go.',
    'K8s (Kubernetes) and Go are part of my current SRE/DevOps toolkit at Cisco/Splunk.',
    'Today, my role at Cisco/Splunk has an SRE/DevOps focus, working with K8s (Kubernetes) and Go.',
  ],
  [
    'Based in Victoria, BC.',
    'I’m based in Victoria, BC.',
    'Home base: Victoria, BC.',
    'My home base is Victoria, BC.',
    'You’ll find me in Victoria, BC.',
    'Victoria, BC is where I’m based.',
    'My corner of the world is Victoria, BC.',
    'Calling Victoria, BC home.',
    'Based out of Victoria, BC.',
    'Victoria, BC is home.',
  ],
].map(pool => Object.freeze(pool)));

/** Pick one sentence per topic, using independent caller-supplied random values.
 * @param {number[]} randomValues
 * @returns {string}
 */
export function selectIntroText(randomValues) {
  if (randomValues.length !== INTRO_SENTENCE_POOLS.length || randomValues.some(value =>
    !Number.isFinite(value) || value < 0 || value >= 1)) {
    throw new RangeError('Intro selection requires three finite random values from zero up to, but excluding, one.');
  }
  return INTRO_SENTENCE_POOLS.map((pool, index) =>
    pool[Math.floor(randomValues[index] * pool.length)]).join(' ');
}
