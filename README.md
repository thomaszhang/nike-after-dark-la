# Nike After Dark LA 2026 Live Course

A phone-first live course tracker for the Nike After Dark Tour Los Angeles half marathon. It uses the official 834-point course polyline to show location, course progress, remaining distance, heading-up guidance, and safe rejoin directions.

This is a static progressive web app: there is no application server, account, or build step.

## Features

- Starts precise GPS tracking automatically after location permission is granted.
- Matches each location fix to the most plausible point on the course, including crossings and nearby parallel segments.
- Shows completed distance, distance remaining, elevation, and course status in a four-column summary.
- Selects and fits Route when status changes to Off course. A later Location press remains selected unless the status recovers and becomes Off course again.
- Separates opposing out-and-back passes into parallel Nike-red tracks with an arrow sequence for each travel direction.
- Includes a full-width elevation profile at the bottom. A fixed-size round dot and line show live progress; slide across it to preview the displayed route pass with a forward pointer, then release to return to live tracking.
- Shows actual GPS position as a blue dot with an uncertainty circle. Whenever GPS or compass heading is available, the blue dot also shows which way the runner is pointing, whether or not heading-up Direction mode is enabled.
- Rotates only the visual map panes for heading-up navigation, so touch dragging stays aligned with the screen.
- Smooths compass changes with a 1.5° dead zone and 220 ms response curve.
- Detects upcoming course turns from the route geometry.
- Follows the phone's light or dark appearance.
- Can be installed on an iPhone Home Screen.
- Caches the application shell and route data for offline startup.

## Control positions — Thomas, October 24, 2026

Thomas requested the existing scrubber at the bottom and directions/buttons at
the top (Management request 125533bc7cbee8c78d93, Agenda980). The same slider DOM,
pointer capture, keyboard preview, release restoration and Route/Location buttons
are retained. No duplicate controls, helper panel or GPS permission change.

The top cards use natural flow, so hidden off-course directions do not leave an
empty fixed slot. Short landscape screens put the same cards in two columns;
safe-area left/right insets protect notches. The same profile sits above the
bottom safe inset with a 52px touch area. Its progress dot is positioned relative
to the actual chart within that padding. Course-fit padding measures the current
controls instead of using their old positions. Very short screens allow the top
group to scroll rather than collide with the bottom profile. This is layout, not
a change to matching, safety thresholds, permission prompts or facility facts.

Checks for this layout: existing and added tests exercise the real dot-position
and course-padding functions, unique slider/button placement, pointer capture and
restore handlers, safe-area rules, landscape columns and cache versions. These
are fixtures/source checks, not screenshots or physical-iPhone acceptance.

Native acceptance is blocked by the existing exact Safari window 2895 and its
pending location sheet. Engineer's read-only diagnosis confirmed it still exists
after the one close receipt; no close replay, permission answer, navigation,
new-window or alternate-browser workaround is authorized by that diagnosis.
Agenda980 retains final narrow/landscape Safari visual and interaction checks;
Agenda979 retains its facility-specific checks. Resolve the exact window/prompt
with Thomas before the next supported browser check. Source deployment and HTTP
readback are independent and should not be left merely prepared.

## Navigation behavior

The top navigation card changes with distance from the route:

| Distance from course | Behavior |
| --- | --- |
| 0–30 m | Normal course and turn guidance |
| More than 30 m through 100 m | Direction and distance back to the nearest course point |
| More than 100 m (about 328 ft) | Navigation card hidden; top status reports off course while Distance, Remaining, and Elevation show `—` |

The card returns automatically after the location is again within 100 m of the course. Route and Location, including each view's Direction setting, remain available while the card is hidden.

These cues are a convenience, not authoritative race-day directions. Follow event staff, signs, closures, and official course updates.

## Run locally

Requirements:

- Node.js 18 or newer
- Python 3 with `pytest`

No package installation is needed. From this directory:

```sh
npm run serve
```

Open <http://127.0.0.1:8765>. Browsers permit geolocation on localhost. A non-local deployment must use HTTPS for location, orientation permission, service workers, and Home Screen installation to work reliably.

You can also run the server directly:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

## Use on iPhone

1. Open the HTTPS deployment in Safari.
2. Allow precise location when prompted.
3. Press the selected **Location** button again if you need to enable Direction and Safari asks separately for motion/orientation access.
4. Optionally choose **Share → Add to Home Screen**.
5. Keep the page visible during the run. iOS may pause browser location updates after the screen locks, even though the app requests a screen wake lock where supported.

Controls:

- **Route** fits and centers the complete course. Press selected Route again to toggle its remembered Direction setting; that setting rotates the map to the course bearing only while scrubbing the elevation profile.
- **Location** returns the map to the current location after Route or manual dragging. Press selected Location again to toggle its remembered heading-up Direction setting; GPS accuracy remains beside the label.
- Route and Location are mutually exclusive. Dragging the map leaves both unselected without changing either Direction setting.
- Location Direction starts on; Route Direction starts off. Switching views preserves both settings.
- Rotate the map manually with two fingers. Manual rotation turns Direction off for the current view and preserves the chosen bearing.
- Green dots show the selected view and each view's Direction state.
- **More info** opens the in-app usage notes and official race link.

## Privacy and network use

Raw GPS and compass readings stay in browser memory. The app has no analytics, account system, location API, or application backend, and it does not persist location history.

The browser requests OpenStreetMap tiles for the visible map plus enough surrounding area to cover the screen while it rotates. As with any web map, the tile provider receives normal request metadata and the requested tile coordinates, which identify the displayed map area. OpenStreetMap credit is available under More info rather than over the map. The service worker caches same-origin application files; it does not add location storage.

## Offline behavior

After one successful online load, the service worker caches HTML, CSS, JavaScript, route data, Leaflet, icons, and marker images. The tracker can then start without a network connection.

OpenStreetMap tiles are hosted separately. Previously viewed tiles may remain in the browser cache, but uncached areas need network access and can appear blank offline. Course geometry, progress calculations, navigation, and GPS processing do not depend on a remote API.

## Verified facilities · October 24, 2026

The published app is <https://thomaszhang.github.io/nike-after-dark-la/>.
The repository was renamed from `nike-after-dark-la-live-route`; do not publish
or link the old 404 Pages URL. Deployment is a push to this repository's `main`
branch, followed by verification of the actual Pages files (not just Git source).

Nike's [2026 race page](https://www.afterdarktour.nike.com/en/la) links the
[2026 Race Weekend Guide](https://cdn.sanity.io/files/1g4896rs/production/57e8d2e23eef11998a65a1a5523c516ea918a44d.pdf#page=2).
Its page 2, **On course fueling**, lists:

| Aid | Mile | Supplies |
| --- | --- | --- |
| 1 | 1.7 | Water |
| 2 | 2.9 | Water, SIS electrolyte |
| 3 | 4.2 | Water |
| 4 | 5.6 | Water, SIS electrolyte |
| 5 | 7.1 | Water, SIS gel |
| 6 | 8.6 | Water, SIS electrolyte |
| 7 | 9.9 | Water |
| 8 | 11.9 | Water, SIS electrolyte |

These are **official mileages, not official coordinates**. Each pin is
interpolated at that mileage on the unchanged 834-point official course line.
The line measures about 13.32 miles rather than the advertised 13.1, so pins are
approximate; do not rescale or claim exact table positions/street sides. Each
pin says this and links the guide. One compact legend toggles the aid layer.

Nike says restrooms are on course “roughly every mile” but supplies no individual
locations in that section. No every-mile toilet pins are generated, and no aid
station is assumed to have toilets. The race FAQ confirms toilets at the start,
before/inside the venue, and for the finish/festival; it also confirms water
collected after finishing. These **area-level** facts share the existing Start
and Finish pins with a WC label and explicit details that the pin is not an
exact toilet/water location. This avoids inventing co-location.

Checked October 24, 2026: guide fueling crop visually read against all eight
rows; the live race JSON course equals the app's geometry. Nike's linked Atlist
maps list businesses, cheer zones and start/finish, not individual aid/toilet
coordinates. The interactive route JSON has only two start/finish markers;
no facility legend was substituted from another year. Follow race staff/signs.

Verification: 32 Python tests and 10 Node tests pass, including execution of the
actual facility creation block, supplies, coordinate range and hide/show toggle.
Pages deployment succeeded and its HTML/JS/CSS/facilities/service-worker bytes
were read back matching the release. A real Safari screenshot at 574 × 950 points
(2× pixels) and intended-page rendered HTML showed all eight aid DOM markers and
both WC labels. The screenshot was inspected: a location-permission prompt dimmed
and obscured the middle map, so this is not unobstructed visual or physical iPhone
acceptance. No location permission was granted/denied for testing. Aid badges were
then shifted beside mile discs to address the visible overlap; final offset still
needs an unobstructed screenshot. Offline shell strings/tests pass; an actual
network-disabled browser reload has not been verified.

The exact owned test window's single close returned success but window 2895 was
still in a fresh inventory. No close replay or personal-window operation was
attempted; the saved intent/identity/capture and current ownership were forwarded
for supported investigation. Keep this uncertainty separate from deployed assets.
Private evidence is under `~/Library/Application Support/Nike facilities979/`.

`course-facilities.js` stores the small source-annotated dataset locally, loaded
before `app.js` and cached in the versioned offline shell. No new service, runner
data, external API request or location upload is added.

## Course data

### Visual treatment

The map is intentionally presented like a compact race-day field guide rather than a perfectly uniform dashboard. Cards use warm paper or charcoal, subtle contained grain, slightly varied edges, and clear system typography. The course is drawn as layered red race ink over a warm under-stroke, with spaced white direction stitches, field-marker mile badges, and a dimensional blue location compass.

All visual variation is deterministic. It does not move or simplify Nike's official coordinates, and it does not change course matching, mileage, elevation, or turn calculations. Overview mile badges may shift a few screen pixels around their exact map anchor to remain readable where the course doubles back; street-level markers and the underlying route stay attached to the same official geometry.

`route-data.js` contains the official source polyline and mile-marker metadata from:

<https://www.afterdarktour.nike.com/en/la>

`course-elevation.js` contains 101 terrain samples along that polyline. Elevation is based on the Copernicus DEM 2021 GLO-90 dataset at 90 m resolution, retrieved through the Open-Meteo Elevation API on 2026-08-30:

<https://open-meteo.com/en/docs/elevation-api>

The sampled profile is stored locally. The live app does not send coordinates to an elevation service. A red line and fixed-size round dot show trusted live progress on the graph. While sliding, Route is selected temporarily, Location is deselected, and the map keeps the marker centered on the same right-of-travel pass used by the visible route. With Route Direction enabled, the map rotates smoothly around that fixed marker so the selected course bearing points toward the top of the screen; with Route Direction disabled, the preview remains north-up. Releasing restores the newest live values plus the previous controls, map view, and rotation. Mile labels are placed by exact course distance on that same displayed directional pass instead of using the original unshifted GPX marker coordinates.

The official page advertises 13.1 miles. Its current source polyline measures approximately 13.32 miles. Race-day closures and course revisions can differ, so re-check Nike's official page before the event.

## Development

Run all tests:

```sh
npm test
```

Run syntax checks and all tests:

```sh
npm run check
```

The test suite uses Node's built-in test runner for angle smoothing and navigation visibility, plus `pytest` for document, interface, service-worker, and asset contracts.

When changing a cached file:

1. Change the asset query version in `index.html`.
2. Put that exact versioned URL in `SHELL` in `sw.js`.
3. Increment the service-worker cache name.
4. Update the matching assertions in `tests/test_interface.py`.
5. Verify one online load followed by an offline reload.

See [DESIGN.md](DESIGN.md) for data flow, course matching, heading smoothing, safety behavior, and maintenance details.

## Project layout

| Path | Purpose |
| --- | --- |
| `README.md` | Setup, usage, privacy, offline behavior, and development workflow |
| `DESIGN.md` | Data flow, course matching, navigation rules, and maintenance constraints |
| `package.json` | Dependency-free serve, test, and check command aliases |
| `index.html` | Application structure, controls, accessibility text, and asset versions |
| `styles.css` | Responsive phone layout and system light/dark appearance |
| `app.js` | Course matching, GPS/compass handling, map rendering, and navigation |
| `heading-smoothing.js` | Testable shortest-angle smoothing module |
| `route-data.js` | Course polyline, start/finish, and mile markers |
| `sw.js` | Offline application-shell cache |
| `manifest.webmanifest` | Installable web-app metadata |
| `leaflet.js`, `leaflet.css` | Vendored Leaflet runtime and styles |
| `tests/` | Node and Python tests |

## Attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Leaflet is vendored locally so the application shell can start offline.
