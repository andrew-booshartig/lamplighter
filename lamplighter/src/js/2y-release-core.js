/* ═══════════════════════════ 2y · the release stamp, as words ═══════════════════════════
   build.py bakes a stamp into APP.release (tools/stamp_lib.py): { date: '2026-11-16', id: '3fa9c1', stamp: '2026-11-16-3fa9c1', app: '…', library: '…' }. The id is worked out from every
   file of the app and the library of that release, so copies with the same stamp are the same release (a copy may leave optional packs out); the date is the day it last changed. A page run from the source has no stamp (APP.release is null).
   Pure functions, so tests can check the wording. */
const RELEASE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function releaseOk(rel) {
  return !!rel && typeof rel === 'object' && /^\d{4}-\d\d-\d\d$/.test(String(rel.date || '')) && /^[0-9a-f]{6}$/.test(String(rel.id || '')) && rel.stamp === rel.date + '-' + rel.id;
}

/* "release 16 Nov 2026 · 3fa9c1", or, for a page that was never stamped, a plain word for it */
function releaseLabel(rel) {
  if (!releaseOk(rel)) return 'a build from the source (no release stamp)';
  const p = rel.date.split('-').map(Number);
  return `release ${p[2]} ${RELEASE_MONTHS[p[1] - 1] || '?'} ${p[0]} · ${rel.id}`;
}

/* the line to send to someone ("which copy have you got?"): the same text is in the zip's name */
function releaseCopyLine(rel) { return releaseOk(rel) ? 'The Lamplighter Project release ' + rel.stamp : 'The Lamplighter Project (build from the source, no release stamp)'; }
