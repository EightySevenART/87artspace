#!/usr/bin/env python3
"""Build the German site in /de/ from the English pages in the root.

English is the source. After changing an English page run:
    python3 tools/build_de.py
New or changed English texts are listed as MISSING: add them to
tools/i18n_de.py (English -> German) and run the script again.
Never edit files in /de/ by hand, they are overwritten.
"""
import html, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from i18n_de import T, LD

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "about.html", "archive.html", "beyond-the-frame.html",
         "fake-fake.html", "beirat-bw.html", "confirmed.html", "unsubscribed.html"]
SITE = "https://87artspace.com/"
norm = lambda s: re.sub(r"\s+", " ", html.unescape(s)).strip()
TN = {norm(k): v for k, v in T.items()}
missing = {}

def tr(s, page):
    k = norm(s)
    if not k or not re.search(r"[A-Za-z]", k): return None
    if k in TN: return TN[k]
    missing.setdefault(k, page); return None

def url_of(page):
    return SITE + ("" if page == "index.html" else page)

def build(page):
    src = open(os.path.join(ROOT, page), encoding="utf-8").read()
    s = src.replace('<html lang="en">', '<html lang="de">', 1)
    s = s.replace('content="en_GB"', 'content="de_DE"')
    # canonical / og:url point to the German page
    s = re.sub(r'(<link rel="canonical" href=")' + re.escape(url_of(page)) + '"', r'\1' + url_of("de/" + page if page != "index.html" else "de/") + '"', s)
    s = s.replace('<link rel="canonical" href="' + SITE + 'de/index.html"', '<link rel="canonical" href="' + SITE + 'de/"')
    s = re.sub(r'(<meta property="og:url" content=")' + re.escape(url_of(page)) + '"', r'\1' + (SITE + "de/" + ("" if page == "index.html" else page)) + '"', s)
    # relative asset paths -> ../
    s = re.sub(r'((?:src|href|poster|data-src|data-poster)=")((?:assets/|favicon|apple-touch|icon-)[^"]*")', r'\1../\2', s)
    s = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + re.sub(r'(^|,\s*)(assets/)', r'\1../\2', m.group(1)) + '"', s)
    s = re.sub(r"url\((['\"]?)(assets/)", r"url(\1../\2", s)
    # JSON-LD descriptions
    for en, de in LD.items(): s = s.replace(en, de)
    # attributes
    def attr(m):
        name, q, val = m.group(1), m.group(2), m.group(3)
        if name == "content" and not re.search(r'name="(description|twitter:[a-z]+)"|property="og:(title|description)"', m.string[max(0, m.start()-120):m.start()]):
            return m.group(0)
        t = tr(val, page)
        return m.group(0) if t is None else f'{name}={q}{html.escape(t, quote=True)}{q}'
    s = re.sub(r'\b(alt|placeholder|aria-label|title|content|data-label)=(")([^"]*)"', attr, s)
    # text nodes (outside script/style/imprint/privacy, which are German already)
    parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<div class="(?:imprint|privacy)" lang="de">.*?</details>)', s, flags=re.S)
    for i in range(0, len(parts), 2):
        def text(m):
            raw = m.group(1)
            t = tr(raw, page)
            if t is None: return m.group(0)
            lead = re.match(r"\s*", raw).group(0); trail = re.search(r"\s*$", raw).group(0)
            return ">" + lead + html.escape(t, quote=False) + trail + "<"
        parts[i] = re.sub(r">([^<>]+)<", text, parts[i])
    s = "".join(parts)
    # language switch + hreflang
    s = s.replace('<a class="lang" href="de/' + page + '" hreflang="de" lang="de">DE</a>',
                  '<a class="lang" href="../' + page + '" hreflang="en" lang="en">EN</a>')
    open(os.path.join(ROOT, "de", page), "w", encoding="utf-8").write(s)

os.makedirs(os.path.join(ROOT, "de"), exist_ok=True)
for p in PAGES: build(p)
if missing:
    print("MISSING translations (add to tools/i18n_de.py):")
    for k, p in missing.items(): print(f"  [{p}] {k}")
    sys.exit(1)
print("de/ built:", len(PAGES), "pages")
