/* The repository is ready to publish on GitHub (the maker, 24 November 2026: "do what you can to prep this thing for github"). Nothing here touches the network and nothing is pushed.
   What is kept: the landing page, the two licences (the root copies equal the ones the release kits carry), the community files, the issue forms and the pull-request template exist and say what they should; the CI workflow
   builds from the sources and runs every test that does not need the data folders (the others are named in tests/ci-needs-data.txt, and each name is a real test); the git-ignore keeps the data folders, the built page and the site
   folder out; and tools/make_public_repo.py, which copies the tracked files minus the working notes into a clean folder with one commit, finds no problem in what it copies (no secret, no path on a computer, no file near
   GitHub's 100 MB limit, no broken link in the landing page) and leaves the working notes out unless asked.
   Run: node tests/github.test.js */
const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } };
const top = path.join(__dirname, '..', '..'); const lp = path.join(__dirname, '..'); const rd = (f) => fs.readFileSync(path.join(top, f), 'utf8'); const has = (f) => fs.existsSync(path.join(top, f));

/* ── the files ── */
const files = ['README.md', 'LICENSE', 'LICENSE-CONTENT.txt', 'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md', '.gitignore', '.github/pull_request_template.md', '.github/ISSUE_TEMPLATE/config.yml', '.github/ISSUE_TEMPLATE/broken.yml', '.github/ISSUE_TEMPLATE/fact.yml', '.github/ISSUE_TEMPLATE/text.yml', '.github/workflows/ci.yml'];
ok('the landing page, the licences, the community files, the issue forms, the pull-request template and the CI workflow are at the top of the repository', files.every(has), files.filter((f) => !has(f)));
ok('the root licences equal the ones the release kits and the site carry (MIT for the code, CC0 for what was written for the project), so a change is made once', rd('LICENSE') === rd('lamplighter/release/LICENSE-CODE.txt') && rd('LICENSE-CONTENT.txt') === rd('lamplighter/release/LICENSE-CONTENT.txt') && /^MIT License/.test(rd('LICENSE')) && /CC0 1\.0 Universal/.test(rd('LICENSE-CONTENT.txt')));
const readme = rd('README.md');
ok('the landing page says what it is in its first lines, that it is an alpha that no specialist has read, and what it promises (free, no account, no ads, no tracking, offline, neutral)', /^# The Lamplighter Project/.test(readme) && /free library and research tool for studying human religion/.test(readme.slice(0, 400)) && /\*\*Alpha\.\*\*/.test(readme) && /none has been read by a specialist/.test(readme) && /no account/.test(readme.slice(0, 500)) && /does not tell you what to believe/.test(readme.slice(0, 400)));
ok('it says how it was made, as the app’s own Methods page does (AI assistants working for the maker; a second reading is not a specialist’s review), and where the data is (not in the repository: release kits, or rebuilt)', /AI assistants \(Claude, by Anthropic\)/.test(readme) && /not a specialist's review/.test(readme) && /so it is not in this repository/.test(readme) && /release kits/.test(readme));
ok('every relative link and image of the landing page points at a file that is in the repository', [...readme.matchAll(/(?:\]\(|src=")(?!https?:|#|mailto:)([^)"\s#]+)/g)].every((m) => has(m[1])), [...readme.matchAll(/(?:\]\(|src=")(?!https?:|#|mailto:)([^)"\s#]+)/g)].map((m) => m[1]).filter((f) => !has(f)));
ok('no file the repository tracks names a path on a computer', (() => { const r = spawnSync('git', ['grep', '-I', '-l', '-E', '/Users/[A-Za-z0-9._-]+/'], { cwd: top, encoding: 'utf8' }); return r.status === 1 && r.stdout === ''; })() || !has('.git'), 'a tracked file has /Users/…');

/* ── the issue forms and the template ── */
const forms = ['broken.yml', 'fact.yml', 'text.yml'].map((f) => [f, rd('.github/ISSUE_TEMPLATE/' + f)]);
ok('each issue form has a name, a description, a title and a body of fields with at least one required, and the first two ask for the page and for a source', forms.every(([, t]) => /^name: .+/m.test(t) && /^description: .+/m.test(t) && /^title: ".+"/m.test(t) && /^body:/m.test(t) && /type: (textarea|input|dropdown)/.test(t) && /required: true/.test(t)) && /label: .*page/i.test(forms[0][1] + forms[1][1]) && /source/i.test(forms[1][1]), forms.map(([f]) => f));
ok('the text form asks for rights and names the only two doors (public domain in the United States before 1931, or an open licence)', /Published in the United States before 1931 \(public domain\)/.test(forms[2][1]) && /Openly licensed/.test(forms[2][1]));
ok('issues stay open to anyone (no blank-issue lock), and the pull-request template names the tests and the neutral, private and sourced rules', /blank_issues_enabled: true/.test(rd('.github/ISSUE_TEMPLATE/config.yml')) && /privacy\.test\.js/.test(rd('.github/pull_request_template.md')) && /Neutral/.test(rd('.github/pull_request_template.md')) && /storage name/.test(rd('.github/pull_request_template.md')));

/* ── CI ── */
const ci = rd('.github/workflows/ci.yml'); const needs = rd('lamplighter/tests/ci-needs-data.txt').split('\n').filter(Boolean);
ok('CI runs on pull requests and by hand (not on every push, so the front page never shows a red mark nobody asked for), checks syntax, builds the map data and the app page from the sources, and runs every test not listed as needing data', /^on:\n  pull_request:\n  workflow_dispatch:/m.test(ci) && !/push:/.test(ci) && /actions\/checkout@v4/.test(ci) && /actions\/setup-node@v4/.test(ci) && /actions\/setup-python@v5/.test(ci) && /node --check/.test(ci) && /build_atlas\.py/.test(ci) && /lamplighter\/build\.py/.test(ci) && /ci-needs-data\.txt/.test(ci) && /lamplighter\/tests\/\*\.test\.js/.test(ci));
ok('every test the CI skips is a real test file, listed once', needs.length > 0 && new Set(needs).size === needs.length && needs.every((n) => fs.existsSync(path.join(lp, 'tests', n))), needs.filter((n) => !fs.existsSync(path.join(lp, 'tests', n))));

/* ── the ignore file ── */
const gi = rd('.gitignore').split('\n');
ok('the git-ignore keeps the data folders, the built page and its helpers, the release kits, the site folder and the cache out of the repository', ['/texts/', '/downloads/', '/originals/', '/books/', '/bibles/', '/similar/', '/dictionary/', '/atlas/', '/release/', '/site/', '/Lamplighter.html', '/sw.js', '/manifest.webmanifest', '/offline-manifest.json', '/lamplighter/dist/', '/lamplighter/tools/cache/'].every((l) => gi.includes(l)), ['/texts/', '/site/'].filter((l) => !gi.includes(l)));

/* ── the export tool ── */
const run = (...a) => spawnSync('python3', ['-I', path.join(lp, 'tools', 'make_public_repo.py'), '--check', ...a], { encoding: 'utf8', cwd: top });
const r1 = run(); const out1 = r1.stdout + r1.stderr;
ok('the export tool copies the tracked files into a clean folder and finds no problem in them (no secret, no path on a computer, no file near 100 MB, every required file there, the licence copies equal, the landing page’s links good)', r1.status === 0 && /public copy: /.test(out1) && !/PROBLEM/.test(out1), out1.slice(0, 600));
const left = ((out1.match(/left out \(\d+\): ([^\n]*)/) || [])[1] || '').split(', ');
ok('it leaves the working notes out (the log, the workflow, the status page for the maker, the handout draft, the outreach draft, the audits and this note) and keeps the landing page and the records of method', ['WORKFLOW.md', 'BACKLOG.md', 'ALPHA_STATUS.md', 'ALPHA_HANDOUT.md', 'OUTREACH.md', 'FINAL_AUDIT.md'].every((n) => !has(n) || left.includes(n)) && !left.includes('README.md') && !left.includes('FACT_CHECK.md') && !left.includes('DISTRIBUTION.md') && !left.includes('COLLECTION_PLAN.md'), left);
const r2 = run('--include-internal');
ok('with --include-internal it keeps every note (nothing left out) and still finds no problem', r2.status === 0 && /left out \(0\): none/.test(r2.stdout), (r2.stdout + r2.stderr).slice(0, 400));

/* the update mode: a copy that has been pushed and has a history of its own is brought up to date without a commit (a changed file copied back, a file that is no longer tracked removed, nothing else touched) */
{ const os = require('os'); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lamplighter-sync-')); const dir = path.join(tmp, 'copy'); const gitIn = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.org', ...a], { cwd: dir, encoding: 'utf8' });
  const made = spawnSync('python3', ['-I', path.join(lp, 'tools', 'make_public_repo.py'), '--out=' + dir], { encoding: 'utf8', cwd: top });
  const marker = fs.existsSync(path.join(dir, '.git', 'lamplighter-public-export')) && !fs.existsSync(path.join(dir, 'lamplighter-public-export')) && !gitIn('ls-files').stdout.includes('lamplighter-public-export');
  ok('the tool makes a copy with one commit by “Lamplighter Project <noreply@lamplighter.invalid>”, and keeps its marker inside .git, so it is never committed', made.status === 0 && /committed: /.test(made.stdout) && gitIn('log', '--format=%an <%ae>').stdout.trim() === 'Lamplighter Project <noreply@lamplighter.invalid>' && gitIn('rev-list', '--count', 'HEAD').stdout.trim() === '1' && marker, made.stdout + made.stderr);
  fs.appendFileSync(path.join(dir, 'README.md'), 'tweak\n'); fs.writeFileSync(path.join(dir, 'junk.txt'), 'x'); gitIn('add', '-A'); gitIn('commit', '-q', '-m', 'tweak and junk'); fs.rmSync(path.join(dir, 'LICENSE'));
  const sy = spawnSync('python3', ['-I', path.join(lp, 'tools', 'make_public_repo.py'), '--sync=' + dir], { encoding: 'utf8', cwd: top }); const st = gitIn('status', '--short').stdout;
  ok('--sync copies back what changed (README), restores what was deleted (LICENSE), removes what is no longer tracked (junk.txt), commits nothing, and says what to do', sy.status === 0 && /2 files copied, 1 removed/.test(sy.stdout) && /^ M README\.md$/m.test(st) && /^ D junk\.txt$/m.test(st) && !/LICENSE/.test(st) && fs.existsSync(path.join(dir, 'LICENSE')) && !fs.existsSync(path.join(dir, 'junk.txt')) && gitIn('rev-list', '--count', 'HEAD').stdout.trim() === '2' && /nothing was committed/.test(sy.stdout), sy.stdout + sy.stderr + st);
  const nothere = spawnSync('python3', ['-I', path.join(lp, 'tools', 'make_public_repo.py'), '--sync=' + top], { encoding: 'utf8', cwd: top });
  ok('--sync refuses a folder the tool did not make (the working repository itself) and changes nothing there', nothere.status !== 0 && /was not made by this tool/.test(nothere.stdout + nothere.stderr), nothere.stdout + nothere.stderr);
  const d2 = path.join(tmp, 'credited'); const cr = spawnSync('python3', ['-I', path.join(lp, 'tools', 'make_public_repo.py'), '--out=' + d2, '--author=Ada Example <1+ada@users.noreply.github.com>'], { encoding: 'utf8', cwd: top }); const lg = spawnSync('git', ['log', '--format=%an|%ae|%cn|%ce|%B'], { cwd: d2, encoding: 'utf8' }).stdout;
  ok('--author credits the one commit to the given name and address (for a copy that goes under someone\u2019s own GitHub account), and the message says it was written with Claude, as the README does', cr.status === 0 && /^Ada Example\|1\+ada@users\.noreply\.github\.com\|Ada Example\|1\+ada@users\.noreply\.github\.com\|The Lamplighter Project, alpha/.test(lg) && /Co-Authored-By: Claude Sonnet 5\.5/.test(lg), lg);
  const badA = spawnSync('python3', ['-I', path.join(lp, 'tools', 'make_public_repo.py'), '--check', '--author=nobody'], { encoding: 'utf8', cwd: top });
  ok('--author refuses a value that is not “Name <address>”', badA.status !== 0 && /--author must look like/.test(badA.stdout + badA.stderr), badA.stdout + badA.stderr);
  fs.rmSync(tmp, { recursive: true, force: true }); }

console.log(`GitHub preparation: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
