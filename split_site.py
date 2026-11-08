#!/usr/bin/env python3
"""
split_site.py - turn SingleFile (.htm) page saves into a local multi-page site.

Usage:
    python split_site.py page1.htm page2.htm ... --out bohurup-site

For every saved page it
  * pulls the CSS out into css/, fonts into assets/fonts/, images into assets/images/
    (identical files are shared between pages)
  * writes the page to a path taken from its own URL (/products -> products.html,
    /product/slug -> product/slug.html, / or /home -> index.html)
  * rewrites links that point to the live site so they open the local pages instead
  * creates a small placeholder for pages that are linked but not saved yet,
    so Live Server never shows a 404. Save that page with SingleFile, run the
    script again with it included, and the placeholder is replaced.
"""
import argparse, base64, hashlib, html, os, re, shutil, sys
from urllib.parse import urlparse

SITE = "https://bohurup.com"
EXT = {"image/jpeg": "jpg", "image/png": "png", "image/svg+xml": "svg",
       "image/webp": "webp", "image/gif": "gif", "font/woff2": "woff2", "font/woff": "woff"}
DATA = re.compile(r'data:([a-z0-9/+.\-]+);base64,([A-Za-z0-9+/=]+)')

def local_path(url_path):
    p = url_path.strip("/")
    if p in ("", "home"):
        return "index.html"
    return p + ".html"

def rel(from_file, to_file):
    return os.path.relpath(to_file, os.path.dirname(from_file) or ".").replace(os.sep, "/")

class Builder:
    def __init__(self, out):
        self.out = out
        self.css_names = {}      # (kind, hash) -> filename
        self.css_count = {}
        self.linked = set()      # local files that pages link to
        self.written = set()     # local files that were really generated
        for d in ("css", "js", "assets/fonts", "assets/images"):
            os.makedirs(os.path.join(out, d), exist_ok=True)

    def asset(self, mime, b64, prefix):
        raw = base64.b64decode(b64)
        h = hashlib.md5(raw).hexdigest()[:8]
        folder = "fonts" if mime.startswith("font/") else "images"
        name = f"{prefix}-{h}.{EXT.get(mime, 'bin')}"
        path = f"assets/{folder}/{name}"
        full = os.path.join(self.out, path)
        if not os.path.exists(full):
            with open(full, "wb") as f: f.write(raw)
        return path

    def css(self, kind, text):
        h = hashlib.md5(text.encode()).hexdigest()[:8]
        key = (kind, h)
        if key not in self.css_names:
            n = self.css_count.get(kind, 0) + 1
            self.css_count[kind] = n
            name = f"{kind}.css" if n == 1 else f"{kind}-{n}.css"
            self.css_names[key] = name
            with open(os.path.join(self.out, "css", name), "w", encoding="utf-8") as f:
                f.write(text.strip() + "\n")
        return "css/" + self.css_names[key]

    def page_target(self, s):
        m = re.search(r'<link rel=canonical href="?([^"\s>]+)', s) or re.search(r'^\s*url: (\S+)', s, re.M)
        if not m: sys.exit("Cannot work out the page URL (no canonical link / SingleFile url comment).")
        return local_path(urlparse(m.group(1)).path)

    def process(self, src):
        s = open(src, encoding="utf-8", errors="replace").read()
        target = self.page_target(s)
        styles = list(re.finditer(r'<style>(.*?)</style>', s, re.S))
        links = []
        for i, m in enumerate(styles):
            body = m.group(1)
            if ".sf-hidden{display:none!important}" in body and len(body) < 100:
                s = s.replace(m.group(0), "", 1); continue
            faces = re.findall(r'@font-face\{.*?\}', body, re.S)
            if faces:
                for f in faces: body = body.replace(f, "")
                fcss = "\n".join(DATA.sub(lambda d: "../" + self.asset(d[1], d[2], "font"), f) for f in faces)
                links.append(self.css("fonts", fcss))
            if body.strip():
                body = DATA.sub(lambda d: "../" + self.asset(d[1], d[2], "img"), body)
                links.append(self.css("toast" if "data-sonner" in body[:400] else "style", body))
            s = s.replace(m.group(0), "", 1)
        prefix = rel(target, "x").replace("x", "")           # "" or "../"
        tags = "\n".join(f'<link rel="stylesheet" href="{prefix}{l}">' for l in links)
        s = re.sub(r'^<!DOCTYPE html>\s*<html([^>]*)><!--.*?-->', '<!DOCTYPE html>\n<html lang="en" class="dark">\n<head>', s, flags=re.S)
        s = s.replace("<head>\n<meta charset=utf-8>", '<head>\n<meta charset="utf-8">', 1)
        s = re.sub(r'<meta http-equiv=content-security-policy[^>]*>', '', s)
        s = s.replace("</head>", tags + "\n</head>", 1)
        s = DATA.sub(lambda d: prefix + self.asset(d[1], d[2], "image"), s)
        s = re.sub(r'\s__processed_[0-9a-f-]+__=true', '', s)
        s = s.replace("sf-hidden", "hidden-by-capture")
        s = re.sub(r'<script></script>', f'<script src="{prefix}js/script.js" defer></script>', s)
        s = re.sub(r'<body class=select-none\s*>', '<body class="select-none">', s)
        s = self.fix_links(s, target)
        path = os.path.join(self.out, target)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "w", encoding="utf-8").write(s)
        self.written.add(target)
        print("wrote", target)

    def fix_links(self, s, current):
        def sub(m):
            q, url = m.group(1), m.group(2)
            u = urlparse(url)
            if u.netloc and u.netloc not in ("bohurup.com", "www.bohurup.com"): return m.group(0)
            if u.scheme in ("mailto", "tel", "javascript") or url.startswith("#"): return m.group(0)
            if "canonical" in s[max(0, m.start()-30):m.start()]: return m.group(0)
            if not u.netloc and not url.startswith("/"): return m.group(0)
            t = local_path(u.path)
            if t.startswith(("assets/", "css/", "js/")): return m.group(0)
            self.linked.add(t)
            r = rel(current, t) + (("?" + u.query) if u.query else "")
            return f'href={q}{r}{q}'
        return re.sub(r'href=(["\']?)((?:https://(?:www\.)?bohurup\.com)?/[^"\'\s>]*|https://(?:www\.)?bohurup\.com)\1(?=[\s>])', sub, s)

    def stubs(self):
        todo = sorted(t for t in self.linked if t not in self.written and not os.path.exists(os.path.join(self.out, t)))
        for t in todo:
            path = os.path.join(self.out, t); os.makedirs(os.path.dirname(path), exist_ok=True)
            live = SITE + "/" + t[:-5].replace("index", "").strip("/")
            open(path, "w", encoding="utf-8").write(
                '<!DOCTYPE html><html lang="en"><meta charset="utf-8"><title>Not saved yet</title>'
                '<body style="font-family:system-ui;background:#0b1220;color:#e5e7eb;padding:3rem">'
                f'<h1>{html.escape(t)}</h1><p>This page has not been saved yet.</p>'
                f'<p>Open <code>{html.escape(live)}</code>, save it with SingleFile, then run '
                '<code>split_site.py</code> again with that file.</p>')
        if todo:
            print("\nPlaceholders created for pages you still need to save:")
            for t in todo: print("  ", t)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+"); ap.add_argument("--out", default="bohurup-site")
    a = ap.parse_args()
    b = Builder(a.out)
    for f in a.files: b.process(f)
    open(os.path.join(a.out, "js/script.js"), "a").close()
    if os.path.getsize(os.path.join(a.out, "js/script.js")) == 0:
        open(os.path.join(a.out, "js/script.js"), "w").write("// Your own JavaScript goes here.\n")
    b.stubs()
