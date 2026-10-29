#!/usr/bin/env python3
"""Check every page in site/ for links that point at files which don't exist.

Run it yourself before pushing:

    python3 tools/check_links.py

The deploy runs it too, so a broken link stops the deploy instead of shipping.
Links to other websites (http://, https://) are not checked, only your own files.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / "site"

EXTERNAL = ("http://", "https://", "mailto:", "tel:", "#", "data:", "//")

# Examples shown inside <code> or <pre> are text, not links. Skip them.
EXAMPLE_BLOCK = re.compile(r"<(code|pre)\b.*?</\1>", re.S | re.I)
LINK = re.compile(r'\b(href|src)\s*=\s*"([^"]+)"', re.I)


def broken_links_in(page):
    html = EXAMPLE_BLOCK.sub("", page.read_text(encoding="utf-8"))
    found = []

    for attr, url in LINK.findall(html):
        if url.startswith(EXTERNAL):
            continue

        clean = url.split("#", 1)[0].split("?", 1)[0]
        if not clean:
            continue

        target = ROOT / clean.lstrip("/") if clean.startswith("/") else page.parent / clean

        # A link ending in "/" means the folder's index page.
        if clean.endswith("/"):
            target = target / "index.html"

        if not target.exists():
            found.append(f'{page.relative_to(ROOT.parent)}: {attr}="{url}"')

    return found


def main():
    if not ROOT.is_dir():
        print(f"error: no {ROOT.name}/ folder found", file=sys.stderr)
        return 1

    if not (ROOT / "index.html").exists():
        print("error: site/index.html is missing. Every site needs a home page.", file=sys.stderr)
        return 1

    pages = sorted(ROOT.rglob("*.html"))
    broken = [item for page in pages for item in broken_links_in(page)]

    if broken:
        print("These links point at files that don't exist:", file=sys.stderr)
        for item in broken:
            print(f"  {item}", file=sys.stderr)
        return 1

    print(f"Checked {len(pages)} pages. All links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
