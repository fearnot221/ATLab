#!/usr/bin/env python3
"""Build all GitHub Pages routes using only Python's standard library."""
import argparse
import json
import math
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from string import Template
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = ('hero', 'mission', 'flight', 'parts', 'at2', 'join', 'closing')


def render_fields(values, prefix, root):
    fields = {}
    for key, value in values.items():
        if not re.fullmatch(r'[a-z][a-z0-9_]*', key):
            raise ValueError(f'{prefix}: invalid field name {key!r}')
        name = f'{prefix}_{key}'
        if isinstance(value, list):
            template = Template((root / f'src/templates/items/{name}.html').read_text(encoding='utf-8'))
            fields[key] = ''.join(template.substitute(render_fields(item, name, root)) for item in value)
        elif isinstance(value, (str, int, float)) and not isinstance(value, bool):
            fields[key] = escape(str(value), quote=True)
        else:
            raise ValueError(f'{name}: expected text, number, or array of records')
    return fields


class PageCheck(HTMLParser):
    def __init__(self, root, page, pages):
        super().__init__()
        self.root = root.resolve()
        self.page = page
        self.pages = pages
        self.ids = set()
        self.anchors = []

    def check_url(self, value, anchor=False):
        url = urlsplit(value)
        if url.scheme or url.netloc:
            if url.scheme not in ('http', 'https') or not url.netloc:
                raise ValueError(f'Unsupported URL: {value}')
            return
        base = self.root if url.path.startswith('/') else (self.root / self.page).parent
        path = (base / unquote(url.path).lstrip('/')).resolve() if url.path else self.root / self.page
        if path.is_dir() or url.path.endswith('/'):
            path = path / 'index.html'
        if not path.is_relative_to(self.root.resolve()):
            raise ValueError(f'Invalid local path: {value}')
        target = path.relative_to(self.root.resolve()).as_posix()
        if target not in self.pages and not path.is_file():
            raise ValueError(f'{self.page}: missing local file: {value}')
        if anchor and url.fragment and target in self.pages:
            self.anchors.append((target, unquote(url.fragment)))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                raise ValueError(f'Duplicate HTML id: {attrs["id"]}')
            self.ids.add(attrs['id'])
        for key in ('href', 'src', 'data-img'):
            value = attrs.get(key, '') if key != 'data-img' or tag in ('li', 'a') else ''
            if not value:
                continue
            self.check_url(value, anchor=key == 'href')
        if tag == 'meta' and attrs.get('property') == 'og:image':
            self.check_url(attrs.get('content', ''))
        if tag == 'img' and 'alt' not in attrs:
            raise ValueError('Image missing alt attribute')

    handle_startendtag = handle_starttag


def reject_constant(value):
    raise ValueError(f'Invalid JSON number: {value}')


def build(root=ROOT):
    data = {name: json.loads((root / f'src/data/{name}.json').read_text(encoding='utf-8'),
                            parse_constant=reject_constant)
            for name in ('site', *SECTIONS)}
    site, flight = data['site'], data['flight']
    teams = site.pop('teams')
    site['team_dropdown'] = site['team_mobile'] = data['join']['teams'] = teams
    steps = site.pop('boot_sequence')
    if not isinstance(steps, list) or len(steps) != 4 or not all(isinstance(s, str) and s for s in steps):
        raise ValueError('site.boot_sequence must contain four nonempty labels')
    site['boot_initial'], site['boot_steps'] = steps[0], json.dumps(steps, ensure_ascii=False)
    peak = flight['peak_altitude']
    if type(peak) not in (int, float) or not math.isfinite(peak) or peak <= 0:
        raise ValueError('flight.peak_altitude must be a positive finite number')
    flight['peak_formatted'] = f'{peak:,.0f}'
    progress = [phase['progress'] for phase in flight['phases']]
    if not progress or any(type(p) not in (int, float) or not 0 <= p <= 1 for p in progress) or progress != sorted(progress):
        raise ValueError('flight.phases progress must be ordered numbers between 0 and 1')
    for key in ('altitude_label', 'trajectory_label'):
        flight[key] = flight[key].replace('{peak}', flight['peak_formatted'])
    for phase in flight['phases']:
        phase['title'] = phase['title'].replace('{peak}', flight['peak_formatted'])
    context = {}
    for name, values in data.items():
        context.update({f'{name}_{key}': value for key, value in render_fields(values, name, root).items()})
    context['sections'] = ''.join(Template((root / f'src/templates/home/{name}.html').read_text(encoding='utf-8')).substitute(context)
                                  for name in SECTIONS)
    pages = {'index.html': Template((root / 'src/templates/home/index.html').read_text(encoding='utf-8')).substitute(context)}
    page_sources = root / 'src/templates/pages'
    for template in sorted(page_sources.rglob('*.html')):
        route = template.relative_to(page_sources).with_suffix('').as_posix() + '/index.html'
        pages[route] = Template(template.read_text(encoding='utf-8')).substitute(context)
    checks = {}
    for route, page in pages.items():
        check = PageCheck(root, route, pages)
        check.feed(page)
        checks[route] = check
    for route, check in checks.items():
        for target, fragment in check.anchors:
            if fragment not in checks[target].ids:
                raise ValueError(f'Unknown section link in {route}: {target}#{fragment}')
    for stylesheet in (root / 'assets/css').glob('*.css'):
        check = PageCheck(root, stylesheet.relative_to(root).as_posix(), pages)
        for url in re.findall(r'url\([\'\"]?([^\)\'\"]+)[\'\"]?\)', stylesheet.read_text(encoding='utf-8')):
            check.check_url(url)
    return pages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if any published page needs rebuilding')
    args = parser.parse_args()
    try:
        pages = build()
        if args.check:
            for route, page in pages.items():
                if (ROOT / route).read_text(encoding='utf-8') != page:
                    raise ValueError(f'{route} is out of date; run python3 scripts/build.py')
            print(f'All {len(pages)} pages, JSON, links and local assets are valid and up to date.')
        else:
            for route, page in pages.items():
                output = ROOT / route
                output.parent.mkdir(parents=True, exist_ok=True)
                temporary = output.with_suffix('.html.tmp')
                temporary.write_text(page, encoding='utf-8')
                temporary.replace(output)
            print(f'Built {len(pages)} pages')
    except (ValueError, KeyError, TypeError, AttributeError, OSError) as error:
        parser.exit(1, f'Build failed: {error}\n')


if __name__ == '__main__':
    main()
