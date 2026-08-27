---
title: FitAI
tagline: Macro tracking and progressive-overload lifting in one app, built so the model can never invent a number.
order: 1
year: "2026"
platform: iOS · SwiftUI
icon: fitai.png
constraint: The app computes every number and hands it to the model as fact. The model reads and interprets. It never originates a figure.
spec:
  - label: Platform
    value: SwiftUI, iOS 17+, XcodeGen
  - label: Storage
    value: Three JSON files on device. No server, no account, no sync.
  - label: Model
    value: Claude, structured outputs, streaming, per-call effort
  - label: Tests
    value: 429 passing on Linux via a custom SwiftPM harness
  - label: Works offline
    value: Barcode scanning, all logging, and the entire progression engine
---

Nutrition trackers and lifting apps both have an obvious place to bolt a language
model on, and both usually get it wrong in the same way: they let the model produce
the numbers. Once that happens you cannot tell a measured value from a guess, and
the day's totals quietly drift.

FitAI draws the line somewhere specific. Totals, remaining budgets, weekly averages,
protein-hit counts, and the measured rate of weight change are all computed in
plain Swift and unit-tested. Those figures are handed to the model as fact, and the
prompt forbids citing any number the brief does not contain. A wrong number is a
failing test rather than a bad generation.

## Two halves, one profile

**Food.** Scan a barcode, photograph a plate, describe a meal in words, or type a
label. Barcode lookups go to Open Food Facts, which is free, keyless, and the most
accurate path because it reads the label. The two AI paths land on a review screen
before anything is logged, where each identified food can be excluded or scaled and
each carries the model's own confidence. Nothing reaches the diary without passing
through it, because an estimate you never saw is worse than no estimate at all.

**Training.** Log sets against a configurable routine. Loads come from a
deterministic double-progression engine that runs with no network and no API key:
add reps inside the range, add load only once every working set clears the top of
it, deload 10% after two sessions below the floor. In a deficit an earned increment
is withheld when the last session averaged RPE 9 or above, because holding a weight
through a cut is a successful session.

## Where the interesting decisions are

A 50 lb dumbbell rack has a top, and past it "add 5 lb" is not advice, it is a
suggestion to load a weight that does not exist. So once a per-hand movement hits
the configured cap, progression moves off load and onto an overload ladder, one
rung per cleared session: add reps, add a set, slow the lower, add a pause, then
one side at a time. The rung is derived from logged history rather than stored, so
it cannot drift out of sync with what actually happened.

The optional AI coach sits on top of that engine, not in place of it. It receives
the engine's numbers as a baseline plus the last three sessions per movement, and
anything it returns is reconciled against that baseline. An unknown exercise is
dropped, a missing one keeps the engine's number, a dumbbell above the rack cap is
held at the cap, and a weight more than 15% above or 20% below the baseline is
clamped, with the clamp stated in the rationale. If the call fails, the baseline is
what you train on.

One deliberate asymmetry: the meal-estimate prompts never see your remaining
budget, because showing it would bend the estimate toward the target. The review
prompts do, because the budget is the question being asked.

## Saying what it does not know

Micronutrient coverage is patchy by nature. Barcoded foods carry whatever the label
filed; a photograph can support sodium, sugars, and saturated fat and nothing more.
Rather than presenting a complete-looking panel, every figure states how much of the
day it accounts for, so a day where three of seven items carried detail reads as a
floor and says so. Anything no logged food mentioned shows as uncounted rather than
as a confident zero.

Open Food Facts is community-edited, so a misplaced unit is common. Each value is
converted using the unit the product declares and then checked against a physical
ceiling: 45,000 mg of sodium per 100 g clears table salt at 38,800 and gets
rejected rather than logged as an authoritative wrong number.
