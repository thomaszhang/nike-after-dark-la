"""Thomas's requested control positions; no real GPS, permissions or browser mutation."""
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text()
CSS = (ROOT / 'styles.css').read_text()
JS = (ROOT / 'app.js').read_text()

class Parents(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.parents = {}
        self.counts = {}
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identity = attrs.get('id', attrs.get('class', tag))
        if 'id' in attrs:
            self.parents[identity] = tuple(self.stack)
            self.counts[identity] = self.counts.get(identity, 0) + 1
        if tag not in ('meta', 'link', 'input', 'br', 'img'):
            self.stack.append(identity)
    def handle_endtag(self, tag):
        if self.stack:
            self.stack.pop()

def test_one_existing_slider_outside_top_group_and_existing_buttons_inside():
    parser = Parents()
    parser.feed(HTML)
    for identity in ['direction', 'stats', 'map-mode', 'aid-visible']:
        assert 'top-controls' in parser.parents[identity]
        assert parser.counts[identity] == 1
    assert 'top-controls' not in parser.parents['elevation-profile']
    assert parser.counts['elevation-profile'] == 1
    for identity in ['distance', 'remaining', 'live-elevation', 'course-status', 'elevation-profile']:
        assert 'progress-card' in parser.parents[identity]
    assert 'stats' in parser.parents['direction']
    assert 'role="slider" tabindex="0"' in HTML

def test_safe_area_touch_and_short_landscape_layout():
    assert 'height:66px; min-height:44px' in CSS
    assert 'bottom:var(--safe-bottom)' in CSS
    assert 'env(safe-area-inset-left)' in CSS
    assert 'env(safe-area-inset-right)' in CSS
    assert '@media (min-width:480px) and (max-height:500px)' in CSS
    assert '.stats-card .navigation-card' in CSS
    assert 'grid-template-columns:minmax(0,1fr) auto' in CSS
    assert 'overflow-y:auto' in CSS
    assert 'courseViewPadding()' in JS
    assert 'paddingTopLeft: [20, 190]' not in JS

def test_pointer_and_keyboard_restore_handlers_remain():
    assert 'setPointerCapture(event.pointerId)' in JS
    assert 'hasPointerCapture(event.pointerId)' in JS
    for event in ['pointerup', 'pointercancel', 'blur']:
        assert f'addEventListener("{event}", endCoursePreview)' in JS
    assert '["ArrowLeft", "ArrowRight", "Home", "End"]' in JS
    assert 'previewSavedControls = { following, fullRouteMode }' in JS
    assert 'following = previewSavedControls.following' in JS
    assert 'previewSavedView.center' in JS
