/* ═══════════════════════════ 2k · Lessons: attach each lesson to its station ═══════════════════════════
   A lesson is keyed by a prefix of its station title (the same prefixes as STATION_TIME). Exactly one station may match each key. */
Object.entries(PATH_LESSONS).forEach(([key, lesson]) => {
  const hits = PATH_STATIONS.filter((s) => s.title.startsWith(key));
  if (hits.length === 1) hits[0].lesson = lesson;
});
const lessonKeysUnmatched = () => Object.keys(PATH_LESSONS).filter((k) => PATH_STATIONS.filter((s) => s.title.startsWith(k)).length !== 1);

if (typeof module !== 'undefined' && module.exports) module.exports = { PATH_LESSONS, lessonKeysUnmatched };
