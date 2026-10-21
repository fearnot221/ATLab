import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ('src', 'assets'):
            shutil.copytree(ROOT / directory, self.root / directory)

    def edit(self, name, change):
        path = self.root / f'src/data/{name}.json'
        values = json.loads(path.read_text(encoding='utf-8'))
        change(values)
        path.write_text(json.dumps(values, ensure_ascii=False), encoding='utf-8')

    def test_generated_page_is_current(self):
        pages = builder.build(self.root)
        self.assertEqual(len(pages), 5)
        for route, page in pages.items():
            self.assertEqual(page, (ROOT / route).read_text(encoding='utf-8'), route)

    def test_json_updates_collections_links_and_shared_altitude(self):
        self.edit('parts', lambda data: data['systems'].append({
            'src': 'assets/images/team.jpg', 'alt': '團隊', 'category': 'New',
            'title': '<新系統> & 測試', 'description': '新增資料'}))
        self.edit('site', lambda data: data.update(apply_url='https://example.com/form?a=1&b=2'))
        self.edit('flight', lambda data: data.update(peak_altitude=3200))
        page = builder.build(self.root)['index.html']
        self.assertIn('&lt;新系統&gt; &amp; 測試', page)
        self.assertEqual(page.count('https://example.com/form?a=1&amp;b=2'), 4)
        self.assertIn('data-peak="3200"', page)
        self.assertIn('最高高度 3,200 公尺', page)
        self.assertIn('遠地點 3,200 m', page)
        self.assertNotIn('2,713', page.replace('AT1ax 飛抵 2,713 公尺', ''))
        self.edit('parts', lambda data: data.update(systems=[]))
        self.assertNotIn('<article class="panel">', builder.build(self.root)['index.html'])

    def test_upstream_navigation_and_pages_are_preserved(self):
        self.edit('site', lambda d: d['teams'][0].update(title='航電測試組'))
        page = builder.build(self.root)['index.html']
        self.assertEqual(page.count('航電測試組'), 3)
        for marker in ('id="mbtn"', 'id="mnav"', 'id="ddTeams"', 'id="mTeams"', 'href="sponsor/"', 'assets/js/navigation.js'):
            self.assertIn(marker, page)

    def test_invalid_data_fails_before_output_is_written(self):
        cases = [
            ('site', lambda d: d.update(apply_url='javascript:alert(1)'), ValueError),
            ('site', lambda d: d.pop('page_title'), KeyError),
            ('join', lambda d: d.update(image='assets/images/missing.jpg'), ValueError),
            ('flight', lambda d: d.update(peak_altitude='3200'), ValueError),
            ('flight', lambda d: d['phases'][0].update(progress=-1), ValueError),
        ]
        for name, change, error in cases:
            with self.subTest(name=name, change=change):
                original = (self.root / f'src/data/{name}.json').read_bytes()
                self.edit(name, change)
                with self.assertRaises(error):
                    builder.build(self.root)
                (self.root / f'src/data/{name}.json').write_bytes(original)
        self.assertFalse((self.root / 'index.html').exists())

    def test_subpage_links_and_css_assets_are_checked(self):
        path = self.root / 'src/templates/pages/teams/avionics.html'
        original = path.read_text(encoding='utf-8')
        path.write_text(original.replace('../../#flight', '../../#missing'), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Unknown section link'):
            builder.build(self.root)
        path.write_text(original, encoding='utf-8')
        (self.root / 'assets/images/frame.webp').unlink()
        with self.assertRaisesRegex(ValueError, 'missing local file'):
            builder.build(self.root)

    def test_missing_assets_and_broken_navigation_are_rejected(self):
        self.edit('site', lambda d: d['navigation'].append({'href': '#missing', 'label': '無效區塊'}))
        with self.assertRaisesRegex(ValueError, 'Unknown section'):
            builder.build(self.root)


if __name__ == '__main__':
    unittest.main()
