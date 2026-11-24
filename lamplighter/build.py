#!/usr/bin/env python3
"""Bundle src/ into a single self-contained dist/Lamplighter.html (no network, no dependencies)."""
import pathlib, re, sys, urllib.parse

root = pathlib.Path(__file__).parent
css = (root / "src/css/app.css").read_text()
js_files = sorted((root / "src/js").glob("*.js"))
js = "\n".join(f"/* ---- {p.name} ---- */\n{p.read_text()}" for p in js_files)
js = js.replace("</script", "<\\/script")          # never terminate the inline script early

# drop the CommonJS test hooks from the browser bundle
js = re.sub(r"\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*", "", js)

# the release stamp: a date and a six-character code worked out from every file of the app and the library beside it (tools/stamp_lib.py); the same files always give the same stamp
sys.path.insert(0, str(root / "tools"))
import stamp_lib
release = stamp_lib.make(root, root.parent, css, js)
js = stamp_lib.bake(js, release)

# the favicon is the mark itself: web/icons/icon.svg (drawn by tools/make_icons.py), as a data: address
favicon = urllib.parse.quote((root / "web/icons/icon.svg").read_text().strip(), safe="/:=',.-_()")

html = f"""<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#070a11">
<meta name="description" content="A free library and research tool for studying human religion: more than 1,500 texts to read, a timeline, a map and a way to compare traditions. No account, no ads, no tracking.">
<title>The Lamplighter Project</title>
<link rel="icon" href="data:image/svg+xml,{favicon}">
<style>
{css}
</style>
<script>
/* set theme before first paint */
try {{ var s = JSON.parse(localStorage.getItem('beatlab.v1.settings') || '{{}}'); var t = s.theme || 'auto';
  var light = t === 'light' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark'); }} catch (e) {{}}
</script>
</head>
<body>
<noscript>The Lamplighter Project needs JavaScript (and the Web Audio API) to run.</noscript>
<script>
(function () {{
{js}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
window.Beatlab = {{ AudioCore, Engine, Stats, Studio, Settings, Router, store, PRESETS, sha256, Viz, openOverlay, taskVAS, taskPVT, taskNBack, taskRAT, taskAUT, screenAudio, screenGuess, screenInfo, Exps, createExperiment, analyze, resultsHTML, runExperimentSession, seriesStats, seal, MEASURES, TEMPLATES, presetCfg, condAudio, J, LAB, RAT_ITEMS, SCENES, ZENER, Bell, Speech, buildCues, pacerAt, PACERS, PLAN, PRACTICES, runSit, openSheet, MED, medStats, quickOpts, bedCfg, PATH_STATIONS, LIB, LIB_GROUPS, THEMES, ERAS, PATH_PRACTICES, buildPathCues, PATH, YEAR_WHEEL, INT, intentionStats, intentionVerdict, sealIntention, verifyIntention, pairAssign, ECHO_LINKS, ECHO_KINDS, contemporaries, axisX, STATION_TIME, TXT }};   // handy for debugging & the test page
}})();
</script>
</body>
</html>
"""
out = root / "dist/Lamplighter.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html)
top = root.parent / "Lamplighter.html"          # one-click copy next to the project folder
top.write_text(html)
print(f"built {out}  ({len(html)/1024:.0f} KB, {len(js_files)} script files)")
print(f"release stamp {release['stamp']}  (app {release['app']}, library {release['library']})")
print(f"copied {top}")

# the website extras next to Lamplighter.html: service worker (stamped with this build), web app manifest, icons, and the list of library files with their sizes
web = root / "web"
if web.is_dir():
    import hashlib, shutil, subprocess
    build_id = hashlib.sha256(html.encode("utf-8")).hexdigest()[:10]
    (top.parent / "sw.js").write_text((web / "sw.js").read_text().replace("__BUILD__", build_id))
    shutil.copy2(web / "manifest.webmanifest", top.parent / "manifest.webmanifest")
    if (web / "icons").is_dir():
        shutil.copytree(web / "icons", top.parent / "icons", dirs_exist_ok=True)
    subprocess.run([sys.executable, "-I", str(root / "tools" / "make_offline_manifest.py"), str(top.parent)], check=False)
    print(f"web extras: sw.js (build {build_id}), manifest.webmanifest, icons/, offline-manifest.json")
