from pathlib import Path
import json, subprocess, re
ROOT = Path(__file__).resolve().parents[1]

def dataset():
    code = "global.window={};require('./course-facilities.js');console.log(JSON.stringify(window.NIKE_FACILITIES))"
    return json.loads(subprocess.check_output(['node', '-e', code], cwd=ROOT))

def test_matching_2026_stations_and_supplies():
    data = dataset()
    assert data['year'] == 2026
    assert [s['mile'] for s in data['stations']] == [1.7, 2.9, 4.2, 5.6, 7.1, 8.6, 9.9, 11.9]
    assert [s['number'] for s in data['stations']] == list(range(1, 9))
    assert all('Water' in s['supplies'] for s in data['stations'])
    assert [s['mile'] for s in data['stations'] if 'SIS electrolyte' in s['supplies']] == [2.9, 5.6, 8.6, 11.9]
    assert [s['mile'] for s in data['stations'] if 'SIS gel' in s['supplies']] == [7.1]
    assert '57e8d2e23eef11998a65a1a5523c516ea918a44d.pdf#page=2' in data['guide']

def test_no_fabricated_coordinates_or_toilet_stops():
    data = dataset()
    assert all(set(s) == {'number', 'mile', 'supplies'} for s in data['stations'])
    assert 'Approximate' in data['positioning'] and '13.32' in data['positioning']
    assert 'no individual locations' in data['restroomNote']
    js = (ROOT / 'app.js').read_text()
    assert 'pointAtCourse(station.mile * 1609.344)' in js
    assert 'Restroom at this stop: not confirmed.' in js
    assert 'not an exact toilet' in js
    assert 'autoPanPaddingTopLeft: [16, 150]' in js
    assert 'if (event.target.checked) facilityLayer.addTo(map); else map.removeLayer(facilityLayer)' in js

def test_facilities_load_and_cache_with_source_visible():
    html = (ROOT / 'index.html').read_text()
    sw = (ROOT / 'sw.js').read_text()
    assert html.index('course-facilities.js?v=1') < html.index('app.js?v=48')
    assert '"course-facilities.js?v=1"' in sw
    assert 'nike-la-route-v53' in sw
    assert 'WC · venue toilets' in html
    assert 'No unconfirmed restroom pins' in html
    assert 'id="aid-visible" type="checkbox" checked' in html
    assert not re.search(r'fetch\(', (ROOT / 'course-facilities.js').read_text())
