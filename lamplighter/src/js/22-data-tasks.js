/* ═══════════════════════════ 22 · task banks: word-association items, objects, scenes, symbols ═══════════════════════════ */

/* Remote-Associates-style items: three cue words that each combine with one answer word */
const RAT_ITEMS = [
  ['cream', 'skate', 'water', 'ice'], ['fish', 'mine', 'rush', 'gold'], ['flower', 'shine', 'burn', 'sun'], ['ball', 'flake', 'man', 'snow'],
  ['light', 'shine', 'walk', 'moon'], ['hole', 'board', 'note', 'key'], ['place', 'work', 'fly', 'fire'], ['fall', 'melon', 'proof', 'water'],
  ['bow', 'coat', 'drop', 'rain'], ['back', 'weight', 'clip', 'paper'], ['ache', 'line', 'phone', 'head'], ['port', 'plane', 'line', 'air'],
  ['dream', 'light', 'break', 'day'], ['mare', 'fall', 'club', 'night'], ['pack', 'bone', 'yard', 'back'], ['walk', 'line', 'kick', 'side'],
  ['time', 'guard', 'style', 'life'], ['ground', 'mate', 'house', 'play'], ['work', 'made', 'sick', 'home'], ['ball', 'lash', 'brow', 'eye'],
  ['ball', 'print', 'step', 'foot'], ['shake', 'bag', 'cuff', 'hand'], ['paste', 'brush', 'pick', 'tooth'], ['shell', 'side', 'food', 'sea'],
  ['fish', 'light', 'ship', 'star'], ['walk', 'road', 'word', 'cross'], ['pecker', 'work', 'land', 'wood'], ['bell', 'knob', 'mat', 'door'],
  ['box', 'paper', 'storm', 'sand'], ['house', 'cage', 'song', 'bird'], ['house', 'fight', 'tag', 'dog'], ['walk', 'nap', 'fish', 'cat'],
  ['room', 'time', 'bug', 'bed'], ['trap', 'pad', 'hole', 'mouse'], ['shoe', 'back', 'power', 'horse'], ['shake', 'man', 'maid', 'milk'],
  ['spoon', 'pot', 'cup', 'tea'], ['blue', 'cottage', 'cream', 'cheese'], ['sleeping', 'bean', 'trash', 'bag'], ['wheel', 'high', 'arm', 'chair'],
  ['fountain', 'baking', 'pop', 'soda'], ['cracker', 'union', 'rabbit', 'jack'], ['dew', 'comb', 'bee', 'honey'], ['pine', 'crab', 'sauce', 'apple'],
  ['sage', 'paint', 'hair', 'brush'], ['fur', 'rack', 'tail', 'coat'], ['bump', 'egg', 'step', 'goose'], ['stick', 'light', 'birthday', 'candle'],
  ['credit', 'playing', 'report', 'card'],
].map((a, i) => ({ id: i, words: a.slice(0, 3), answer: a[3] }));

const AUT_OBJECTS = ['brick', 'paperclip', 'newspaper', 'shoe', 'bucket', 'blanket', 'spoon', 'car tyre', 'rubber band', 'coat hanger', 'cup', 'umbrella', 'book', 'sock'];

/* classic five-symbol set for forced-choice trials */
const ZENER = [
  { id: 'circle', name: 'Circle', svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="15"/></svg>' },
  { id: 'cross', name: 'Cross', svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8v32M8 24h32"/></svg>' },
  { id: 'waves', name: 'Waves', svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14q4.75-5 9.5 0t9.5 0 9.5 0 9.5 0M5 24q4.75-5 9.5 0t9.5 0 9.5 0 9.5 0M5 34q4.75-5 9.5 0t9.5 0 9.5 0 9.5 0"/></svg>' },
  { id: 'square', name: 'Square', svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="30" height="30" rx="1.5"/></svg>' },
  { id: 'star', name: 'Star', svg: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6l5.2 11.2 12.2 1.4-9 8.4 2.4 12.1L24 33.2 13.2 39.1l2.4-12.1-9-8.4 12.2-1.4z"/></svg>' },
];

/* sixteen small illustrated scenes for free-response (picture ranking) trials */
const SCENES = (() => {
  const wrap = (id, inner, defs = '') => `<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${id}"><defs>${defs}</defs>${inner}</svg>`;
  const grad = (id, stops, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const list = [];
  list.push({ id: 'sunset-sea', name: 'Sunset over the sea', svg: wrap('sunset-sea',
    `<rect width="240" height="160" fill="url(#a1)"/><circle cx="120" cy="94" r="27" fill="#fff0b3"/><rect y="98" width="240" height="62" fill="url(#b1)"/><g stroke="#ffe2a6" stroke-width="2.2" stroke-linecap="round" opacity=".65"><path d="M92 106h56M100 114h40M108 122h24"/></g>`,
    grad('a1', [[0, '#3a2a6e'], [.55, '#ff7a59'], [1, '#ffd27a']]) + grad('b1', [[0, '#ff9a5a'], [1, '#1b2a5c']])) });
  list.push({ id: 'snow-peaks', name: 'Snowy mountains', svg: wrap('snow-peaks',
    `<rect width="240" height="160" fill="url(#a2)"/><path d="M-10 160L70 40l45 70 25-35 80 85z" fill="#6f86a8"/><path d="M20 160L95 28l70 132z" fill="#9db3d1"/><path d="M95 28l-22 34 12-6 10 10 10-9 11 14z" fill="#fff"/><path d="M0 160l60-48 46 48z" fill="#e8f0fa"/><path d="M110 160l70-55 60 55z" fill="#f3f7fc"/>`,
    grad('a2', [[0, '#5aa3e8'], [1, '#cfe6fb']])) });
  list.push({ id: 'pine-forest', name: 'Pine forest', svg: wrap('pine-forest',
    `<rect width="240" height="160" fill="url(#a3)"/>${[[20, 120, 26], [60, 126, 34], [105, 118, 30], [150, 128, 36], [195, 120, 28], [230, 126, 30]].map(([x, y, s]) => `<path d="M${x} ${y - s * 2.4}l${s * .8} ${s * 1.1}h-${s * .45}l${s * .7} ${s}h-${s * .5}l${s * .8} ${s * 1.1}h-${s * 2.7}l${s * .8}-${s * 1.1}h-${s * .5}l${s * .7}-${s}h-${s * .45}z" fill="#1f6b46"/><rect x="${x - 2.5}" y="${y}" width="5" height="14" fill="#5a3b24"/>`).join('')}<rect y="138" width="240" height="22" fill="#174d33"/>`,
    grad('a3', [[0, '#bfe3f0'], [1, '#e9f6ee']])) });
  list.push({ id: 'city-night', name: 'City skyline at night', svg: wrap('city-night',
    `<rect width="240" height="160" fill="url(#a4)"/><circle cx="196" cy="34" r="14" fill="#f6f1cf"/>${[[10, 70, 32], [42, 50, 28], [72, 84, 24], [98, 40, 34], [134, 66, 28], [164, 58, 30], [196, 82, 34]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${160 - y}" fill="#141c3a"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${x + 5 + (i % 3) * 9}" y="${y + 6 + Math.floor(i / 3) * 12}" width="4" height="6" fill="${(i * 7 + x) % 5 === 0 ? '#2a3768' : '#ffd36b'}"/>`).join('')}`).join('')}`,
    grad('a4', [[0, '#080d24'], [1, '#2b2f6b']])) });
  list.push({ id: 'desert', name: 'Desert dunes and cactus', svg: wrap('desert',
    `<rect width="240" height="160" fill="url(#a5)"/><circle cx="52" cy="44" r="20" fill="#fff2b0"/><path d="M0 110q50-34 110-8t130-4v62H0z" fill="#e9a853"/><path d="M0 128q70-32 130-6t110-8v46H0z" fill="#d68a3a"/><g fill="#2f7d4a"><rect x="170" y="86" width="9" height="46" rx="4"/><rect x="156" y="98" width="7" height="22" rx="3"/><rect x="156" y="112" width="20" height="6" rx="3"/><rect x="186" y="92" width="7" height="18" rx="3"/><rect x="176" y="104" width="16" height="6" rx="3"/></g>`,
    grad('a5', [[0, '#79c4f2'], [1, '#fde7b4']])) });
  list.push({ id: 'lighthouse', name: 'Lighthouse on the rocks', svg: wrap('lighthouse',
    `<rect width="240" height="160" fill="url(#a6)"/><path d="M120 44L40 26v36zM120 44l80-18v36z" fill="#fff6b8" opacity=".5"/><rect y="118" width="240" height="42" fill="#2a5f93"/><path d="M0 160V136q30-22 70-4t60 2 40-12 70 14v24z" fill="#3b3f4d"/><path d="M110 120l4-62h12l4 62z" fill="#f3f1ec"/><path d="M111.5 96h17l-1 14h-15zM113 70h14l-1 12h-12z" fill="#d6453d"/><rect x="112" y="50" width="16" height="10" fill="#ffe27a"/><path d="M110 50h20l-10-12z" fill="#d6453d"/>`,
    grad('a6', [[0, '#1d3560'], [1, '#6d99cf']])) });
  list.push({ id: 'balloons', name: 'Hot-air balloons', svg: wrap('balloons',
    `<rect width="240" height="160" fill="url(#a7)"/><ellipse cx="60" cy="150" rx="70" ry="22" fill="#fff" opacity=".7"/><ellipse cx="190" cy="154" rx="80" ry="22" fill="#fff" opacity=".7"/>${[[70, 70, 30, '#e8505b', '#fff'], [150, 52, 22, '#f2a93b', '#fff'], [188, 100, 18, '#4ba3e8', '#fff']].map(([x, y, r, c, c2]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${c}"/><path d="M${x - r * .5} ${y - r * 1.1}q${r * .3} ${r * 1.2} 0 ${r * 2.25}M${x + r * .5} ${y - r * 1.1}q-${r * .3} ${r * 1.2} 0 ${r * 2.25}" stroke="${c2}" stroke-width="2.4" fill="none" opacity=".7"/><path d="M${x - r * .5} ${y + r * 1.05}L${x - r * .22} ${y + r * 1.6}M${x + r * .5} ${y + r * 1.05}L${x + r * .22} ${y + r * 1.6}" stroke="#5a3b24" stroke-width="1.3"/><rect x="${x - r * .26}" y="${y + r * 1.6}" width="${r * .52}" height="${r * .36}" rx="2" fill="#7a4f2c"/>`).join('')}`,
    grad('a7', [[0, '#69b4f0'], [1, '#d7ecfb']])) });
  list.push({ id: 'bridge', name: 'Red suspension bridge', svg: wrap('bridge',
    `<rect width="240" height="160" fill="url(#a8)"/><rect y="112" width="240" height="48" fill="#2f6aa3"/><g fill="#d1402f"><rect x="62" y="38" width="7" height="82"/><rect x="170" y="38" width="7" height="82"/><rect x="0" y="104" width="240" height="6"/></g><path d="M0 98Q65 34 65.5 38Q118 112 171 38Q178 34 240 98" stroke="#d1402f" stroke-width="2.6" fill="none"/><g stroke="#d1402f" stroke-width="1">${Array.from({ length: 22 }, (_, i) => `<path d="M${10 + i * 10} ${104 - Math.max(0, 40 - Math.abs(i * 10 - 100) * .42)}V104"/>`).join('')}</g><ellipse cx="120" cy="116" rx="130" ry="12" fill="#fff" opacity=".35"/>`,
    grad('a8', [[0, '#9db7d3'], [1, '#f1d9c0']])) });
  list.push({ id: 'fireworks', name: 'Fireworks over a skyline', svg: wrap('fireworks',
    `<rect width="240" height="160" fill="#0a0d26"/>${[[70, 56, 30, '#ff6b81'], [158, 44, 24, '#ffd35a'], [190, 84, 18, '#6bd7ff']].map(([x, y, r, c]) => `<g stroke="${c}" stroke-width="2.2" stroke-linecap="round">${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return `<path d="M${x + Math.cos(a) * r * .35} ${y + Math.sin(a) * r * .35}L${x + Math.cos(a) * r} ${y + Math.sin(a) * r}"/>`; }).join('')}</g><circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`).join('')}<path d="M0 160V126h20v-14h18v22h16v-30h22v20h20v-10h24v30h22v-18h26v-22h20v30h18v-12h20v28z" fill="#050713"/>`) });
  list.push({ id: 'sailboat', name: 'Sailboat on a lake', svg: wrap('sailboat',
    `<rect width="240" height="160" fill="url(#a10)"/><ellipse cx="190" cy="34" rx="30" ry="9" fill="#fff" opacity=".85"/><ellipse cx="170" cy="40" rx="22" ry="7" fill="#fff" opacity=".85"/><rect y="96" width="240" height="64" fill="url(#b10)"/><path d="M118 28v62L70 90zM122 38v52h40z" fill="#fff"/><path d="M82 96h84l-12 14H94z" fill="#b7472f"/><g stroke="#cfe9ff" stroke-width="2" opacity=".6"><path d="M20 120h40M150 128h60M80 140h50"/></g>`,
    grad('a10', [[0, '#7cc2f5'], [1, '#e3f3fd']]) + grad('b10', [[0, '#3d8fd1'], [1, '#1d4f8a']])) });
  list.push({ id: 'autumn-tree', name: 'Autumn tree', svg: wrap('autumn-tree',
    `<rect width="240" height="160" fill="url(#a11)"/><rect y="132" width="240" height="28" fill="#8a5a2b"/><path d="M114 134q4-32 2-52l8 0q-2 22 3 52z" fill="#5b3a22"/><path d="M120 92l-26-18M122 84l24-22" stroke="#5b3a22" stroke-width="5" stroke-linecap="round"/>${[[120, 56, 40, '#e8772e'], [90, 72, 26, '#d9482e'], [152, 66, 28, '#f2a93b'], [120, 36, 24, '#f2c14b']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}${Array.from({ length: 16 }, (_, i) => `<circle cx="${(i * 37 + 12) % 240}" cy="${138 + (i * 11) % 18}" r="3" fill="${['#e8772e', '#d9482e', '#f2a93b'][i % 3]}"/>`).join('')}`,
    grad('a11', [[0, '#f6dcb4'], [1, '#fbf0dc']])) });
  list.push({ id: 'windmill', name: 'Windmill and tulips', svg: wrap('windmill',
    `<rect width="240" height="160" fill="url(#a12)"/><path d="M104 130l8-52h16l8 52z" fill="#a8532f"/><path d="M110 78h20l-10-16z" fill="#5a3b24"/><g stroke="#e9e2d2" stroke-width="4" stroke-linecap="round"><path d="M120 76L82 44M120 76l38 32M120 76l-32 38M120 76l32-38"/></g><circle cx="120" cy="76" r="4" fill="#3b2a1a"/><rect y="128" width="240" height="32" fill="#3f9a45"/>${Array.from({ length: 36 }, (_, i) => `<g><path d="M${6 + i * 6.6} 152v-10" stroke="#2b7a35" stroke-width="1.5"/><ellipse cx="${6 + i * 6.6}" cy="140" rx="3" ry="4" fill="${['#e8505b', '#f2c14b', '#c14fb5', '#ff8a3d'][i % 4]}"/></g>`).join('')}`,
    grad('a12', [[0, '#8fcbf2'], [1, '#e8f5fb']])) });
  list.push({ id: 'campfire', name: 'Tent and campfire under stars', svg: wrap('campfire',
    `<rect width="240" height="160" fill="url(#a13)"/>${Array.from({ length: 34 }, (_, i) => `<circle cx="${(i * 53 + 11) % 240}" cy="${(i * 29 + 7) % 90}" r="${i % 5 === 0 ? 1.7 : 1}" fill="#fff" opacity="${.5 + (i % 4) * .12}"/>`).join('')}<path d="M0 160V126q40-14 80-4t80-6 80 10v34z" fill="#0f1a2d"/><path d="M52 138l34-56 34 56z" fill="#e9893b"/><path d="M86 82l-18 56h18zM86 82l18 56H86z" fill="#c76a22"/><path d="M80 138l6-22 6 22z" fill="#3a1d0a"/><path d="M158 140q-8-16 0-30 4 12 12 6-2 12 6 24z" fill="#ffb02e"/><path d="M162 140q-4-10 0-18 4 6 8 10z" fill="#fff0a0"/><path d="M148 142l24 0M152 146l16-6" stroke="#5a3b24" stroke-width="3" stroke-linecap="round"/>`,
    grad('a13', [[0, '#050a1c'], [1, '#1d2d5a']])) });
  list.push({ id: 'castle', name: 'Castle on a hill', svg: wrap('castle',
    `<rect width="240" height="160" fill="url(#a14)"/><path d="M0 160V132q60-40 120-30t120 22v36z" fill="#4c8f4f"/><g fill="#9aa1ad"><rect x="86" y="64" width="68" height="52"/><rect x="72" y="50" width="22" height="66"/><rect x="146" y="50" width="22" height="66"/><rect x="104" y="40" width="32" height="76"/></g><g fill="#6a7180"><path d="M70 50h26l-13-18zM144 50h26l-13-18zM102 40h36l-18-22z"/></g><g fill="#2a2f3b"><rect x="114" y="94" width="12" height="22" rx="6"/><rect x="111" y="56" width="6" height="12" rx="3"/><rect x="123" y="56" width="6" height="12" rx="3"/></g><path d="M120 18V6l10 4-10 4" fill="#d6453d"/>`,
    grad('a14', [[0, '#8cc8ee'], [1, '#f7e8c8']])) });
  list.push({ id: 'train', name: 'Train through green hills', svg: wrap('train',
    `<rect width="240" height="160" fill="url(#a15)"/><path d="M0 120q40-52 90-26t90-30 60 20v76H0z" fill="#58a560"/><path d="M0 138q60-30 120-8t120-10v40H0z" fill="#3f8c4c"/><rect y="132" width="240" height="4" fill="#4a3a2c"/><g><rect x="46" y="104" width="50" height="26" rx="3" fill="#2f4f87"/><rect x="96" y="112" width="26" height="18" rx="2" fill="#d6453d"/><rect x="104" y="98" width="10" height="16" fill="#2a2f3b"/><rect x="126" y="108" width="50" height="22" rx="3" fill="#2f4f87"/><rect x="176" y="108" width="50" height="22" rx="3" fill="#2f4f87"/><g fill="#f4f0e6"><rect x="54" y="110" width="10" height="9" rx="1.5"/><rect x="70" y="110" width="10" height="9" rx="1.5"/><rect x="134" y="113" width="10" height="8" rx="1.5"/><rect x="150" y="113" width="10" height="8" rx="1.5"/><rect x="184" y="113" width="10" height="8" rx="1.5"/><rect x="200" y="113" width="10" height="8" rx="1.5"/></g><g fill="#fff" opacity=".85"><circle cx="109" cy="90" r="6"/><circle cx="120" cy="80" r="8"/><circle cx="134" cy="70" r="10"/></g><g fill="#1a1a1f"><circle cx="58" cy="132" r="4"/><circle cx="84" cy="132" r="4"/><circle cx="106" cy="132" r="4"/><circle cx="116" cy="132" r="4"/></g></g>`,
    grad('a15', [[0, '#a7d4f5'], [1, '#e8f4fd']])) });
  list.push({ id: 'beach-palm', name: 'Palm tree on a beach', svg: wrap('beach-palm',
    `<rect width="240" height="160" fill="url(#a16)"/><circle cx="190" cy="36" r="17" fill="#fff4b8"/><rect y="84" width="240" height="34" fill="url(#b16)"/><path d="M0 160V112q60-12 120 0t120-4v52z" fill="#f2d79a"/><path d="M96 128q10-40 4-66" stroke="#8a5a2b" stroke-width="7" fill="none" stroke-linecap="round"/><g fill="#2f9a56"><path d="M100 62q-30-6-46 14 24-8 46-6zM100 62q-8-26-30-30 14 10 20 34zM100 62q18-24 46-18-22 4-38 24zM100 62q30 0 44 24-22-14-44-12z"/></g><path d="M20 140q50-8 100 0" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>`,
    grad('a16', [[0, '#5ec0f0'], [1, '#c9eefb']]) + grad('b16', [[0, '#3fb7d8'], [1, '#1f8db5']])) });
  return list;
})();
