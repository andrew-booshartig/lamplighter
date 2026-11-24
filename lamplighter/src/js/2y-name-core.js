/* ═══════════════════════════ The name, and the name it had before ═══════════════════════════
   Pure functions (tests/rename.test.js). The app was called Beatlab before it became The Lamplighter Project. A backup file made under the old name still imports,
   and a new backup says the new name. `app` is { name, legacy: [older names] } (APP in 00-util.js). */
function backupOk(d, app) {
  if (!d || typeof d !== 'object' || !app) return false;
  const names = [app.name].concat(Array.isArray(app.legacy) ? app.legacy : []);
  return names.includes(d.app) && !!d.data && typeof d.data === 'object';
}
if (typeof module !== 'undefined' && module.exports) module.exports = { backupOk };
