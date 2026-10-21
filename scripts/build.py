#!/usr/bin/env python3
"""Render the GitHub Pages entry point using only Python's standard library."""
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
            template = Template((root / f'templates/items/{name}.html').read_text(encoding='utf-8'))
            fields[key] = ''.join(template.substitute(render_fields(item, name, root)) for item in value)
        elif isinstance(value, (str, int, float)) and not isinstance(value, bool):
            fields[key] = escape(str(value), quote=True)
        else:
            raise ValueError(f'{name}: expected text, number, or array of records')
    return fields


class PageCheck(HTMLParser):
    def __init__(self, root):
        super().__init__()
        self.root = root
        self.ids = set()
        self.anchors = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                raise ValueError(f'Duplicate HTML id: {attrs["id"]}')
            self.ids.add(attrs['id'])
        for key in ('href', 'src', 'data-img'):
            value = attrs.get(key, '') if key != 'data-img' or tag == 'li' else ''
            if not value:
                continue
            url = urlsplit(value)
            if url.scheme or url.netloc:
                if url.scheme not in ('http', 'https') or not url.netloc:
                    raise ValueError(f'Unsupported URL: {value}')
            elif url.path:
                path = (self.root / unquote(url.path)).resolve()
                if path.is_dir():
                    path = path / 'index.html'
                if not path.is_relative_to(self.root.resolve()) or not path.is_file():
                    raise ValueError(f'Missing or invalid local file: {value}')
            elif url.fragment:
                self.anchors.append(url.fragment)
        if tag == 'img' and 'alt' not in attrs:
            raise ValueError('Image missing alt attribute')

    handle_startendtag = handle_starttag


def reject_constant(value):
    raise ValueError(f'Invalid JSON number: {value}')


def build(root=ROOT):
    data = {name: json.loads((root / f'data/{name}.json').read_text(encoding='utf-8'),
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
    context['sections'] = ''.join(Template((root / f'templates/{name}.html').read_text(encoding='utf-8')).substitute(context)
                                  for name in SECTIONS)
    page = Template((root / 'templates/index.html').read_text(encoding='utf-8')).substitute(context)
    check = PageCheck(root)
    check.feed(page)
    if missing := set(check.anchors) - check.ids:
        raise ValueError(f'Unknown section links: {sorted(missing)}')
    return page


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if index.html needs rebuilding')
    args = parser.parse_args()
    try:
        page = build()
        output = ROOT / 'index.html'
        if args.check:
            if output.read_text(encoding='utf-8') != page:
                raise ValueError('index.html is out of date; run python3 scripts/build.py')
            print('JSON, templates, local assets and index.html are valid and up to date.')
        else:
            temporary = output.with_suffix('.html.tmp')
            temporary.write_text(page, encoding='utf-8')
            temporary.replace(output)
            print('Built index.html')
    except (ValueError, KeyError, TypeError, AttributeError, OSError) as error:
        parser.exit(1, f'Build failed: {error}\n')


if __name__ == '__main__':
    main()
