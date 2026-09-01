---
title: Vehicle Tracker
tagline: Decodes a VIN into a maintenance schedule that only lists parts the vehicle actually has.
order: 3
year: "2025"
platform: iOS · SwiftUI
icon: vehicle-tracker.png
demo: vin
constraint: The catalog is filtered by what the VIN actually decodes to. An EV never shows spark plugs, and a front-wheel-drive car never shows differential fluid.
shots:
  - src: vehicle-tracker-components.png
    alt: "The maintenance list for a 2013 Ford F-150, sorted overdue first, each row carrying a coloured status dot and the mileage it is next due at."
    caption: "The catalogue filtered to one truck and sorted by urgency. No EV battery check, because a combustion vehicle does not have one."
  - src: vehicle-tracker-detail.png
    alt: "The detail sheet for an engine oil and filter change, showing the DIY difficulty, cost against a shop, the tools required, and numbered steps."
    caption: "Every item carries the DIY route: what it costs against a shop, which tools it needs, and the order to do it in."
spec:
  - label: Platform
    value: SwiftUI, iOS 17+, XcodeGen
  - label: VIN decode
    value: NHTSA vPIC API — free, public, no key
  - label: Storage
    value: One JSON file on device. No server.
  - label: Tested
    value: Decode normalization, due-date math, and applicability rules
---

Enter a 17-character VIN and an odometer reading, and get a per-vehicle maintenance
checklist: what is due or overdue, how to service each item yourself, and what it
should cost DIY against a shop.

The part worth building carefully is the applicability filter. A generic
maintenance list is close to useless because most of it does not apply to your car,
and the items that do get buried. So the VIN is decoded through the NHTSA vPIC API
into concrete attributes — fuel type, drive type, transmission type — and those
attributes filter a static rules catalog down to only the components the vehicle
actually has. An EV never sees spark plugs or a timing belt. A front-wheel-drive
car never sees differential fluid.

## Due dates from what you logged

For each applicable component, the engine computes the next service point from a
logged last-service mileage where one exists. Where nothing has been logged yet it
falls back to an estimate from the current odometer, and for time-based items like
brake fluid it uses an assumed annual mileage. Flagging a vehicle as driven under
severe conditions — short trips, towing, dust, temperature extremes — shortens
several intervals accordingly.

## What it deliberately does not claim

The intervals are widely-used engineering-standard rules filtered by vehicle
attributes, not a licensed per-trim OEM schedule, and some manufacturer schedules
differ by as much as 30%. The DIY instructions describe the component-level
procedure rather than your exact engine bay, because sourcing real per-model
imagery would mean licensing OEM manual content. Both are surfaced as planning
estimates with a pointer back to the owner's manual, rather than presented as
warranty-compliance guarantees.

VIN-based history reports and resale valuations are the obvious next additions and
are deliberately absent: unlike the decode step, those are paid APIs with no free
tier, so they belong behind a metered feature rather than bolted into a local-first
app.
