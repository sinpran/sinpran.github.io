---
title: Planit
tagline: Turns a multi-destination trip description into a scheduled, costed, day-by-day itinerary.
order: 2
year: "2025"
platform: iOS · SwiftUI
icon: planit.png
constraint: Constrained decoding or nothing. The itinerary comes back as schema-valid JSON, so there is no prose parsing anywhere in the app.
spec:
  - label: Platform
    value: SwiftUI, iOS 17+, XcodeGen
  - label: Storage
    value: One JSON file on device; API key in the iOS Keychain
  - label: Model
    value: Claude with structured outputs, 8192 max tokens
  - label: Export
    value: Paginated PDF and plain text, with version history
---

Describe a trip the way you would to a friend — three days in Delhi focused on food
and culture, then four in Jaipur for shopping and history — and get back a real
schedule: named activities, times, descriptions, a mode of transport for every
single one, and per-activity cost estimates running against a budget you set.

The engineering interest is almost entirely in refusing to parse prose. The request
is constrained with the API's structured-outputs feature, so the response is
guaranteed to be well-formed JSON matching the app's Swift types. There is no
regex, no "find the first line that looks like a time", and no half-parsed
itinerary silently missing its last day.

## Constraints that actually constrain

You can set a total budget in any of about fifteen currencies, and the model
estimates a cost per activity and favors options that keep the whole trip inside
it. You can give each destination a stay location and a maximum distance, and
activities stay near where you are sleeping. Every activity always carries a
transport mode, independent of whether you set a distance, because "how do I get
there" is not an optional detail.

## Being honest about the estimates

Both of those constraints are best-effort, and the app says so rather than
implying precision it does not have. Budget figures are the model's approximations
from general knowledge, not live pricing, so the total is a planning estimate and
not a quote. Distance is passed as plain text with no geocoding and no maps lookup,
which makes it a strong nudge rather than a measured radius. For anything you plan
to walk to, the app tells you to check it in Maps.

## Storage

There is no server. Trips and their generated itineraries live in a single JSON
file in the app's Documents directory, and the Anthropic API key lives in the
Keychain, never in that file and never transmitted anywhere except the
authorization header. Both are visible and clearable from Settings, with
confirmation prompts, because a destructive action behind an unlabelled button is
a bug waiting to happen.

That architecture is the right call for personal use and the wrong one for the App
Store: the key sits on the device, so shipping this to other people would mean
moving it behind a backend proxy first.
