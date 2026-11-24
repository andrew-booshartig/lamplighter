/* ═══════════════════════════ 2s · Common ground: how the traditions overlap, from the data ═══════════════════════════
   Every number on the Common ground page is computed from the echoes (113 classified connections between stations) and the traditions each station
   belongs to, so it can never claim more than the data shows. Pure functions, testable without a page. */
/* tradition pairs joined by at least one echo: { 'a|b': { a, b, n, kinds: {kind: count}, links: [echo…] } } */
function traditionOverlap(links, tradOf) {
  const pairs = {};
  links.forEach((e) => {
    const ta = tradOf[e.A.id] || []; const tb = tradOf[e.B.id] || []; const seen = new Set();
    ta.forEach((a) => tb.forEach((b) => {
      if (a === b) return; const k = [a, b].sort().join('|'); if (seen.has(k)) return; seen.add(k);
      const pr = pairs[k] || (pairs[k] = { a: k.split('|')[0], b: k.split('|')[1], n: 0, kinds: {}, links: [] });
      pr.n++; pr.kinds[e.kind] = (pr.kinds[e.kind] || 0) + 1; pr.links.push(e);
    }));
  });
  return pairs;
}
/* how connected is the whole: every tradition's links, whether all are reachable from each other, and the longest shortest path */
function overlapGraph(pairs, ids) {
  const adj = {}; ids.forEach((i) => { adj[i] = new Set(); });
  Object.values(pairs).forEach((p) => { if (adj[p.a] && adj[p.b]) { adj[p.a].add(p.b); adj[p.b].add(p.a); } });
  const degree = {}; ids.forEach((i) => { degree[i] = adj[i].size; });
  let diameter = 0; let connected = true; let sum = 0; let cnt = 0;
  ids.forEach((s) => {
    const dist = { [s]: 0 }; const q = [s];
    while (q.length) { const x = q.shift(); adj[x].forEach((y) => { if (dist[y] == null) { dist[y] = dist[x] + 1; q.push(y); } }); }
    ids.forEach((t) => { if (t === s) return; if (dist[t] == null) connected = false; else { diameter = Math.max(diameter, dist[t]); sum += dist[t]; cnt++; } });
  });
  return { degree, diameter, connected, avg: cnt ? sum / cnt : 0, minDegree: Math.min(...ids.map((i) => degree[i])), pairsPossible: ids.length * (ids.length - 1) / 2, pairsLinked: Object.keys(pairs).length };
}
/* the five kinds of echo, grouped by what they say about the overlap */
const COMMON_GROUPS = [
  { id: 'history', name: 'Shared history', kinds: ['borrowing', 'ancestry', 'contact'], text: 'One tradition drew on, grew out of, or met another. The overlap is inherited.' },
  { id: 'convergence', name: 'Independent convergence', kinds: ['parallel'], text: 'Similar ideas where no contact is known. The record shows none, so they are labelled independent; that is not proof that none happened.' },
  { id: 'disputed', name: 'Disputed', kinds: ['contested'], text: 'A connection is claimed and scholars disagree about whether, or how much.' },
];
function kindShares(links) {
  const total = links.length || 1; const counts = {}; links.forEach((e) => { counts[e.kind] = (counts[e.kind] || 0) + 1; });
  return COMMON_GROUPS.map((g) => { const n = g.kinds.reduce((a, k) => a + (counts[k] || 0), 0); return Object.assign({}, g, { n, pct: Math.round(100 * n / total) }); });
}
/* ideas that turn up in every tradition's texts, and the words that carry them in English translation (whole words only) */
const COMMON_CONCEPTS = [
  { id: 'compassion', label: 'Compassion and mercy', q: 'compassion|compassionate|mercy|merciful|pity' },
  { id: 'peace', label: 'Peace', q: 'peace|peaceful|peacemaker|peacemakers' },
  { id: 'truth', label: 'Truth', q: 'truth|truthful|truthfulness|honest' },
  { id: 'justice', label: 'Justice and righteousness', q: 'justice|righteous|righteousness|just' },
  { id: 'love', label: 'Love', q: 'love|loves|loved|loving|beloved' },
  { id: 'forgive', label: 'Forgiveness', q: 'forgive|forgives|forgiven|forgiveness|pardon' },
  { id: 'stranger', label: 'The stranger and the guest', q: 'stranger|strangers|guest|guests|foreigner|foreigners|wayfarer|sojourner' },
  { id: 'poor', label: 'The poor and the needy', q: 'poor|needy|beggar|beggars|alms|orphan|orphans|widow|widows' },
  { id: 'humble', label: 'Humility', q: 'humble|humility|meek|meekness' },
  { id: 'wisdom', label: 'Wisdom', q: 'wisdom|wise' },
  { id: 'pray', label: 'Prayer and praise', q: 'pray|prayer|prayers|praise|worship' },
  { id: 'death', label: 'Death and what follows', q: 'death|die|died|dying|resurrection|rebirth|reborn' },
];
/* what really does differ, said plainly */
const COMMON_DIFFERENCES = [
  ['What is ultimate', 'One God, many gods, no god, an impersonal absolute, the ancestors. These are not the same claim, and traditions that agree on a great deal else still disagree here.'],
  ['What follows death', 'Resurrection, rebirth, union, judgement, the ancestors, or silence. Even within one tradition the answers vary.'],
  ['Where authority lies', 'A book, a teacher, a lineage, a council, a community, or one’s own experience.'],
  ['How to live it out', 'Law, devotion, ritual, meditation, service. Some traditions ask for much of all of these, some for little of any.'],
  ['Claims about themselves', 'Some traditions say theirs is the only way; others say there are many ways, or that the question is mistaken.'],
];
if (typeof module !== 'undefined' && module.exports) module.exports = { traditionOverlap, overlapGraph, COMMON_GROUPS, kindShares, COMMON_CONCEPTS, COMMON_DIFFERENCES };
