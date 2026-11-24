/* ═══════════════════════════ 2c · The Journey: when and where (numeric dates & places for every station) ═══════════════════════════
   Approximate scholarly ranges (negative = BCE), one row per station in order. The title prefix guards alignment (tests/path.test.js).
   region: af Africa · eu Europe · me Middle East · sa South Asia · ea East & SE Asia · am Americas · oc Oceania & Australia · all = your own rule
   An "ongoing" tradition runs to the present (y1 = 2026). */
const ERA_BOUNDS = { e1: [-300000, -10000], e2: [-10000, -3500], e3: [-3500, -2000], e4: [-2000, -1200], e5: [-1200, -800], e6: [-800, -400], e7: [-400, 30], e8: [30, 325], e9: [325, 622], e10: [622, 1000], e11: [1000, 1500], e12: [1500, 1800], e13: [1800, 2026], e14: [2026, 2026] };
ERAS.forEach((e) => { e.y0 = ERA_BOUNDS[e.id][0]; e.y1 = ERA_BOUNDS[e.id][1]; });

const STATION_TIME = [
  ['The first dead', -100000, -40000, 'me'], ['Cave minds', -40000, -12000, 'eu'], ['The Dreaming', -50000, 2026, 'oc'], ['The trance dance', -20000, 2026, 'af'], ['Shaman', -30000, 2026, 'ea'],
  ['Göbekli Tepe', -9500, -5700, 'me'], ['Stone and sun', -4500, -2500, 'eu'], ['The goddess question', -7000, -3000, 'eu'],
  ['Sumer', -3500, -2000, 'me'], ['Enheduanna', -2300, -2250, 'me'], ['Inanna', -2000, -1800, 'me'], ['Egypt: the Pyramid', -2400, -2300, 'af'], ['Cities without words', -3000, -1800, 'sa'], ['Ptahhotep', -2400, -2000, 'af'], ['The ocean people', -3000, -1000, 'oc'],
  ['Hammurabi', -1800, -1700, 'me'], ['Atrahasis', -1750, -1650, 'me'], ['Gilgamesh', -1800, -1200, 'me'], ['Enūma Eliš', -1200, -1000, 'me'], ['Ugarit', -1400, -1200, 'me'], ['Amenemope', -1250, -1150, 'af'], ['The Coffin Texts', -2000, -1070, 'af'], ['Akhenaten', -1360, -1330, 'af'], ['The Rigveda', -1500, -1200, 'sa'], ['The oracle bones', -1250, -1050, 'ea'],
  ['Ludlul', -1200, -1000, 'me'], ['Merneptah', -1210, -1200, 'me'], ['Songs older', -1200, -900, 'me'], ['David, Solomon', -1000, -930, 'me'], ['Homer and Hesiod', -800, -700, 'eu'], ['The Zhou', -1046, -771, 'ea'], ['The Brahmanas', -900, -500, 'sa'], ['Olmec and Chavín', -1200, -200, 'am'],
  ['The Shabaka Stone', -710, -700, 'af'], ['The prophets of the 8th', -760, -700, 'me'], ['Prophets in crisis', -660, -586, 'me'], ['Deuteronomy', -700, -560, 'me'], ['The exile', -586, -539, 'me'], ['Second Isaiah', -550, -540, 'me'], ['Return and rebuilding', -538, -400, 'me'], ['Job', -600, -400, 'me'], ['The Psalms', -1000, -200, 'me'], ['Proverbs', -1000, -300, 'me'], ['Stories from the Persian', -500, -300, 'me'],
  ['Zoroaster', -1500, -600, 'me'], ['The Buddha', -500, -400, 'sa'], ['The Pali Canon', -500, -29, 'sa'], ['Mahavira', -550, -450, 'sa'], ['The Upanishads', -800, -200, 'sa'], ['Confucius', -551, -479, 'ea'], ['The Daoists', -400, -250, 'ea'], ['The mysteries of Eleusis', -650, 392, 'eu'], ['Heraclitus', -500, -350, 'eu'], ['The Torah takes shape', -600, -450, 'me'],
  ['Qohelet', -300, -250, 'me'], ['Alexandria', -300, -100, 'af'], ['Enoch I', -300, -200, 'me'], ['Jubilees', -200, -50, 'me'], ['Ben Sira', -180, 50, 'me'], ['The Maccabees', -170, -150, 'me'], ['Tales of the Diaspora', -225, -100, 'me'], ['Prayers and poems', -200, 100, 'me'], ['Qumran', -250, 68, 'me'], ['The Yahad', -150, 68, 'me'], ['War, hymns', -200, -1, 'me'], ['Rewritten scripture', -300, 100, 'me'], ['Enoch II', -165, 100, 'me'], ['Testaments, tales', -200, 200, 'me'], ['Philo', -20, 94, 'me'],
  ['India’s epics', -400, 400, 'sa'], ['The Stoics and Rome', -300, 8, 'eu'], ['The Warring States', -400, -139, 'ea'],
  ['Jesus and the first gospel', 30, 70, 'me'], ['Paul', 50, 64, 'me'], ['Matthew and Luke', 80, 90, 'me'], ['John and', 90, 110, 'me'], ['The disputed letters', 60, 130, 'me'], ['Hebrews, James', 60, 150, 'me'], ['Revelation', 90, 200, 'me'], ['After the Temple', 70, 150, 'me'], ['Odes, testaments', 50, 200, 'me'], ['The rabbis', 70, 220, 'me'], ['The earliest Christian', 50, 200, 'me'], ['The other gospels', 50, 250, 'me'], ['Thecla', 150, 250, 'me'], ['Gnostic and Hermetic', 100, 300, 'af'], ['Stoic voices', 65, 180, 'eu'], ['Isis and the Neoplatonists', 170, 270, 'eu'], ['Mahayana', 100, 400, 'sa'], ['Nagarjuna', 150, 250, 'sa'], ['Mani and', 216, 274, 'me'],
  ['How the Bible', 140, 400, 'eu'], ['The desert fathers', 270, 450, 'af'], ['Augustine and Benedict', 397, 540, 'eu'], ['The Talmud', 400, 500, 'me'], ['Sefer Yetzirah', 200, 600, 'me'], ['The Gupta age', 200, 500, 'sa'], ['Persia in late', 224, 651, 'me'], ['Arabia before', 400, 610, 'me'], ['Heavenly palaces', 400, 600, 'me'], ['Buddhism takes root', 150, 650, 'ea'], ['Teotihuacan', -100, 900, 'am'],
  ['The Qur’an', 610, 650, 'me'], ['Hadith', 800, 900, 'me'], ['Rabia', 715, 922, 'me'], ['Tang Buddhism', 618, 907, 'ea'], ['Tibet', 700, 1400, 'ea'], ['The Viking Age', 750, 1300, 'eu'],
  ['Al-Ghazālī', 1095, 1221, 'me'], ['Rumi', 1165, 1390, 'me'], ['Kabbalah', 1280, 1300, 'eu'], ['Christian mystics', 1260, 1420, 'eu'], ['Milarepa', 1052, 1228, 'ea'], ['Kabir', 1400, 1520, 'sa'], ['Celtic myth', 700, 1400, 'eu'], ['Snorri', 1220, 1241, 'eu'], ['Mali', 1200, 1400, 'af'], ['Polynesia', 1000, 1300, 'oc'], ['The Dresden', 1000, 1200, 'am'], ['The Haudenosaunee', 1142, 1450, 'am'],
  ['Guru Nanak', 1469, 1708, 'sa'], ['The Quakers', 1650, 1700, 'eu'], ['Conquest', 1550, 1750, 'am'], ['The Nahua', 1545, 1590, 'am'], ['The Andes', 1600, 1610, 'am'], ['The Philippines', 1521, 1900, 'oc'], ['The African diaspora', 1500, 1900, 'af'],
  ['Bahá’í', 1844, 1910, 'me'], ['Native voices', 1932, 2026, 'am'], ['Kalevala', 1835, 1909, 'eu'], ['The found libraries', 1896, 2006, 'me'], ['The laboratory', 1962, 2026, 'am'],
  ['Writing your rule', 2026, 2026, 'all'], ['Your year', 2026, 2026, 'all'], ['Testing your own', 2026, 2026, 'all'], ['Freedom of conscience', 2026, 2026, 'all'], ['The unfinished', 2026, 2026, 'all'],
];
PATH_STATIONS.forEach((s, i) => { const t = STATION_TIME[i]; if (t) { s.y0 = t[1]; s.y1 = t[2]; s.region = t[3]; s.ongoing = t[2] >= 2000 && t[2] - t[1] > 1500; } });

/* piecewise-linear time axis for the world chart: [from, to, pixel width] — deep time is compressed, recent centuries stretched */
const TIME_AXIS = [[-100000, -10000, 110], [-10000, -3500, 150], [-3500, -2000, 130], [-2000, -1200, 150], [-1200, -800, 140], [-800, -400, 210], [-400, 30, 260], [30, 325, 200], [325, 622, 180], [622, 1000, 160], [1000, 1500, 230], [1500, 1800, 190], [1800, 2030, 150]];
const TIME_AXIS_W = TIME_AXIS.reduce((a, s) => a + s[2], 0);
function axisX(y) { let x = 0; for (const [a, b, w] of TIME_AXIS) { if (y <= a) return x; if (y < b) return x + (w * (y - a)) / (b - a); x += w; } return x; }
const fmtYear = (y) => (y < 0 ? Math.abs(y).toLocaleString('en-US') + ' BCE' : y === 0 ? '1 BCE' : y + ' CE');

/* stations from other regions that were around at the same time (long-lived traditions are left out of both sides) */
function contemporaries(s, max = 8) {
  if (s.region === 'all' || s.y1 - s.y0 > 3000) return [];
  const pad = Math.min(300, Math.max(50, (s.y1 - s.y0) * 0.25)); const mid = (s.y0 + s.y1) / 2;
  return PATH_STATIONS.filter((o) => o !== s && o.region !== s.region && o.region !== 'all' && o.y1 - o.y0 <= 3000 && o.y0 <= s.y1 + pad && o.y1 >= s.y0 - pad)
    .sort((a, b) => Math.abs((a.y0 + a.y1) / 2 - mid) - Math.abs((b.y0 + b.y1) / 2 - mid)).slice(0, max);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { ERA_BOUNDS, STATION_TIME, TIME_AXIS, TIME_AXIS_W, axisX, fmtYear, contemporaries };
