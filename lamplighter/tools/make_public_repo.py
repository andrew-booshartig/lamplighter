#!/usr/bin/env python3
"""Prepare a clean copy of the project for publishing on GitHub: a folder, one commit, nothing sent anywhere.

The working repository is a working notebook as much as a code base: its top folder holds the notes the sessions write for each other (the project manager's log, the workflow, status pages written for
the maker, audits addressed to the project manager). They are accurate and harmless, but they are not what a visitor to a public repository came for, and some quote the maker's chat. This tool copies
every TRACKED file (the data folders texts/ atlas/ bibles/ similar/ dictionary/ and the built page are git-ignored: they are far too large, and they are rebuilt or come in the release kits) except those
notes, checks what it copied, and makes the one commit a first push needs. It never touches the working repository, never deletes anything it did not make, and never uploads.

    python3 -I lamplighter/tools/make_public_repo.py [--out=DIR] [--author="Name <email>"] [--include-internal] [--no-commit] [--check]
    python3 -I lamplighter/tools/make_public_repo.py --sync=DIR [--include-internal]
        --out=DIR            where to write (default: ~/Lamplighter-github, in the home folder, NOT on the Desktop: macOS syncs the Desktop with iCloud, which makes "name 2" copies of files that are re-made quickly, in .git as well); a folder that is not empty is refused unless this tool made it (git's own folder holds the marker), and then it is made again
        --include-internal   keep the internal notes too (the public copy then holds everything the working repository holds)
        --author="Name <email>"  the commit's author and committer (default: the project's own noreply identity below); for a copy that is to be credited to a GitHub account, give that account's name and its
                             users.noreply.github.com address (github.com/settings/emails), never a personal one
        --no-commit          copy and check, but do not run git init and git commit
        --check              copy to a scratch folder, report, delete it (for the test)
        --sync=DIR           bring a copy this tool made EARLIER up to date (or a fresh clone of it, with the marker added: echo ok > DIR/.git/lamplighter-public-export), after it has been pushed and has a history of its own: files that changed are copied over, files that are no longer tracked (or are now
                             internal) are removed, and nothing is committed: look at `git status` and `git diff` in DIR, then commit and push as you like

The commit's author is "Lamplighter Project <noreply@lamplighter.invalid>", the one the working repository already uses, so no personal e-mail address enters the history; a person who wants the commit
credited to their GitHub account amends it with their own identity (git commit --amend --reset-author)."""
import os, pathlib, re, shutil, subprocess, sys, tempfile

here = pathlib.Path(__file__).resolve().parent
root = here.parent.parent                                  # the project folder (the git root)
args = sys.argv[1:]
opt = lambda name: next((a[len(name) + 3:] for a in args if a.startswith('--' + name + '=')), None)
MARK = 'lamplighter-public-export'                          # a file in the made folder (moved into .git/ once there is a repository, so it is never committed)
AUTHOR = ('Lamplighter Project', 'noreply@lamplighter.invalid')

# notes written for the maker and for the working sessions; kept out of the public copy unless --include-internal
INTERNAL = {
    'WORKFLOW.md': 'how the working sessions share the project',
    'BACKLOG.md': 'the project manager\'s log, with the maker\'s words quoted',
    'ALPHA_STATUS.md': 'the end-of-week page written for the maker',
    'ALPHA_HANDOUT.md': 'the draft handout for testers, with the maker\'s choices still in brackets',
    'OUTREACH.md': 'a draft of notes to outside bodies, with contact routes from web searches',
    'ALPHA_AUDIT.md': 'an audit addressed to the project manager',
    'UX_AUDIT.md': 'an audit addressed to the project manager',
    'STRUCTURE_AUDIT.md': 'an audit addressed to the project manager',
    'FINAL_AUDIT.md': 'an audit addressed to the project manager',
    'AUDIT_FLAGS.md': 'generated soft flags for a human look',
    'GITHUB_PREP.md': 'the preparation note for the maker',
}
REQUIRED = ['README.md', 'LICENSE', 'LICENSE-CONTENT.txt', 'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md', '.gitignore',
            '.github/ISSUE_TEMPLATE/config.yml', '.github/pull_request_template.md']
SECRET = re.compile(r'ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{12,}|sk-ant-[A-Za-z0-9-]{10,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|xox[baprs]-[A-Za-z0-9-]{10,}')
HOMEPATH = re.compile(r'/Users/[A-Za-z0-9._-]+/')
EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
OK_EMAIL = re.compile(r'@(?:lamplighter\.invalid|users\.noreply\.github\.com|example\.(?:org|com)|pluralism\.org)$|^(?:noreply|name|you|someone|user)@|^[a-z]@[a-z]\.(?:org|com)$')      # the last pattern is the one-letter addresses test fixtures use (a@b.org)
BIG = 50 * 1024 * 1024                                       # GitHub warns at 50 MB and blocks at 100 MB

def git(*a, cwd=root):
    return subprocess.run(['git', *a], cwd=cwd, check=True, capture_output=True, text=True).stdout

def made_here(d):
    return (d / '.git' / MARK).exists() or (d / MARK).exists()

def check(base, kept):
    """What a person publishing this folder would want to know first: (problems, warnings, total bytes)."""
    problems, warnings, total = [], [], 0
    for f in REQUIRED:
        if not (base / f).exists(): problems.append(f'missing: {f}')
    for f in kept:
        p = base / f; n = p.stat().st_size; total += n
        if n >= BIG: problems.append(f'{f} is {n/1048576:.0f} MB (GitHub blocks 100 MB)')
        try: text = p.read_text(encoding='utf8')
        except (UnicodeDecodeError, OSError): continue
        if SECRET.search(text): problems.append(f'{f} looks like it holds a secret')
        if HOMEPATH.search(text): problems.append(f'{f} names a path on a computer ({HOMEPATH.search(text).group(0)})')
        bad = sorted({m for m in EMAIL.findall(text) if not OK_EMAIL.search(m)})
        if bad and not f.startswith('lamplighter/tools/atlas_src/') and f != 'OUTREACH.md': warnings.append(f'{f}: e-mail addresses {", ".join(bad[:3])}{" ..." if len(bad) > 3 else ""} (check they are meant to be public)')
    if (base / 'LICENSE').exists() and (base / 'lamplighter/release/LICENSE-CODE.txt').exists():      # the root file is the plain MIT text (so that GitHub names the licence); the kit copy adds a paragraph about the content and the texts
        if not (base / 'lamplighter/release/LICENSE-CODE.txt').read_text(encoding='utf8').startswith((base / 'LICENSE').read_text(encoding='utf8').rstrip()): problems.append('LICENSE is not the start of lamplighter/release/LICENSE-CODE.txt')
    if (base / 'LICENSE-CONTENT.txt').exists() and (base / 'lamplighter/release/LICENSE-CONTENT.txt').exists() and (base / 'LICENSE-CONTENT.txt').read_bytes() != (base / 'lamplighter/release/LICENSE-CONTENT.txt').read_bytes(): problems.append('LICENSE-CONTENT.txt differs from lamplighter/release/LICENSE-CONTENT.txt')
    readme = base / 'README.md'
    if readme.exists():                                      # relative links in the landing page must point at something in the copy
        for m in re.finditer(r'(?:\]\(|src=")(?!https?:|#|mailto:)([^)"\s#]+)', readme.read_text(encoding='utf8')):
            if not (base / m.group(1)).exists(): problems.append(f'README.md links to {m.group(1)}, which is not in the copy')
    return problems, warnings, total

def main():
    include_internal = '--include-internal' in args
    author = AUTHOR
    if opt('author'):
        m = re.fullmatch(r'\s*(.+?)\s*<([^<>\s]+@[^<>\s]+)>\s*', opt('author'))
        if not m: sys.exit('--author must look like: Name <address@example.org>')
        author = (m.group(1), m.group(2))
    tracked = [f for f in git('ls-files', '-z').split('\0') if f]
    left = [f for f in tracked if f in INTERNAL and not include_internal]
    kept = [f for f in tracked if f not in left]
    sync = opt('sync')
    if sync:
        dst = pathlib.Path(sync).expanduser().resolve()
        if not (dst / '.git').is_dir() or not made_here(dst): sys.exit(f'{dst} was not made by this tool (no .git/{MARK}): make a copy with --out first')
        had = [f for f in git('ls-files', '-z', cwd=dst).split('\0') if f]
        removed = [f for f in had if f not in set(kept)]
        for f in removed: (dst / f).unlink(missing_ok=True)
        copied = 0
        for f in kept:
            src, d = root / f, dst / f
            if d.exists() and d.read_bytes() == src.read_bytes(): continue
            d.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(src, d); copied += 1
        problems, warnings, total = check(dst, kept)
        print(f'synced: {dst}\n  {copied} files copied, {len(removed)} removed; {len(kept)} files, {total/1048576:.1f} MiB; left out ({len(left)}): {", ".join(left) if left else "none"}')
        for w in warnings: print('  warning: ' + w)
        for p in problems: print('  PROBLEM: ' + p)
        print(git('status', '--short', cwd=dst).rstrip() or '  (nothing changed: the copy is up to date)')
        print('  nothing was committed: look at git status and git diff in that folder, then commit and push as you like')
        sys.exit(1 if problems else 0)
    check_only = '--check' in args
    out = pathlib.Path(opt('out')).expanduser() if opt('out') else pathlib.Path.home() / 'Lamplighter-github'
    if check_only:
        out = pathlib.Path(tempfile.mkdtemp(prefix='lamplighter-public-')); out.rmdir()
    if out.exists() and any(out.iterdir()):
        if not made_here(out): sys.exit(f'{out} exists and was not made by this tool: choose another --out or empty it yourself')
        for child in out.iterdir():                          # a folder this tool made: start again
            shutil.rmtree(child) if child.is_dir() and not child.is_symlink() else child.unlink()
    out.mkdir(parents=True, exist_ok=True); (out / MARK).write_text('made by lamplighter/tools/make_public_repo.py: safe to delete and make again\n')
    for f in kept:
        dst = out / f; dst.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(root / f, dst)
    problems, warnings, total = check(out, kept)
    committed = ''
    if not check_only and '--no-commit' not in args and not problems:
        subprocess.run(['git', 'init', '-q', '-b', 'main'], cwd=out, check=True)
        os.replace(out / MARK, out / '.git' / MARK)          # the marker lives inside .git, so it is never committed
        subprocess.run(['git', 'add', '-A'], cwd=out, check=True)
        env = dict(os.environ, GIT_AUTHOR_NAME=author[0], GIT_AUTHOR_EMAIL=author[1], GIT_COMMITTER_NAME=author[0], GIT_COMMITTER_EMAIL=author[1])
        subprocess.run(['git', 'commit', '-q', '-m', 'The Lamplighter Project, alpha\n\nA free library and research tool for studying human religion. See README.md.\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>'], cwd=out, check=True, env=env)
        committed = git('log', '--oneline', '-1', cwd=out).strip()
    print(f'public copy: {out}\n  {len(kept)} files, {total/1048576:.1f} MiB; left out ({len(left)}): {", ".join(left) if left else "none"}')
    for w in warnings: print('  warning: ' + w)
    for p in problems: print('  PROBLEM: ' + p)
    if committed: print(f'  committed: {committed}')
    if check_only: shutil.rmtree(out, ignore_errors=True)
    sys.exit(1 if problems else 0)

main()
