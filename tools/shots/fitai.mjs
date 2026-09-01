/**
 * FitAI, rebuilt from Sources/Views in the app repo.
 *
 * Layout, copy and formatting come from the source:
 *   App/RootView.swift                  tab order and labels
 *   App/Theme.swift                     protein blue, carbs orange, fat yellow,
 *                                       calories green, estimate purple
 *   Views/Nutrition/MacroRingsView.swift the triad, the ring, the macro columns
 *   Views/Nutrition/TodayView.swift      diary sections, empty state
 *   Models/MacroFormat.swift             "128g", "1530", "52g left"
 *   Models/EnergySummary.swift           "of 2400", "net 1118"
 *
 * Numbers are internally consistent: the ring shows the remainder of the same
 * target the macro columns count against.
 */
import { escape, icon, navBar, screen, statusBar, tabBar } from "./chrome.mjs";

/* Theme.swift maps these onto the iOS system palette. */
const C = {
  protein: "#007AFF",
  carbs: "#FF9500",
  fat: "#FFCC00",
  calories: "#34C759",
  estimate: "#AF52DE",
};

const ACCENT = C.protein;

const TABS = [
  { label: "Today", icon: "fork" },
  { label: "Train", icon: "dumbbell" },
  { label: "Progress", icon: "chart" },
  { label: "Guide", icon: "book" },
  { label: "Settings", icon: "gear" },
];

/* 2,400 kcal training day: 1,530 eaten, so 870 left. */
const TARGET = { kcal: 2400, protein: 180, carbs: 250, fat: 70 };
const EATEN = { kcal: 1530, protein: 128, carbs: 142, fat: 48 };

const EXTRA = `
  .card { background: #fff; border-radius: 16px; padding: 14px; }
  .triad { display: flex; align-items: center; gap: 8px; }
  .side { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .side .glyph { color: var(--label-2); margin-bottom: 2px; }
  .side .cap { font-size: 11px; color: var(--label-2); }
  .side .val { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .side .det { font-size: 11px; color: var(--label-2); font-variant-numeric: tabular-nums; }
  .side.dim .val { color: var(--label-2); }

  .ringwrap { position: relative; width: 116px; height: 116px; flex: none; }
  .ringwrap .mid {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 2px;
  }
  .ringwrap .big { font-size: 28px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .ringwrap .unit { font-size: 12px; color: var(--label-2); }

  .daytype { display: flex; align-items: center; justify-content: center; gap: 5px;
    font-size: 14.5px; font-weight: 500; color: ${C.calories}; margin-top: 14px; }
  .protline { text-align: center; font-size: 13px; font-weight: 500; color: ${C.protein}; margin-top: 4px; }

  .cols { display: flex; gap: 12px; margin-top: 14px; }
  .col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .col .smallring { position: relative; width: 54px; height: 54px; }
  .col .smallring span {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;
  }
  .col .name { font-size: 11px; color: var(--label-2); }
  .col .left { font-size: 11px; font-weight: 500; color: var(--label-2); font-variant-numeric: tabular-nums; }

  .dots { display: flex; gap: 6px; justify-content: center; margin-top: 8px; }
  .dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(0,0,0,0.18); }
  .dots i.on { background: rgba(0,0,0,0.55); }

  .meal-head {
    display: flex; align-items: baseline; gap: 8px; padding: 18px 4px 6px;
  }
  .meal-head .m { font-size: 14.5px; font-weight: 600; }
  .meal-head .k { font-size: 12px; color: var(--label-2); margin-left: auto;
    font-variant-numeric: tabular-nums; }
  .food { background: #fff; border-radius: 12px; padding: 11px 14px; margin-bottom: 8px; }
  .food .t { font-size: 15.5px; letter-spacing: -0.015em; }
  .macroline { display: flex; gap: 8px; font-size: 12px; margin-top: 4px;
    font-variant-numeric: tabular-nums; }
  .badge {
    font-size: 10.5px; font-weight: 600; color: ${C.estimate};
    background: rgba(175,82,222,0.12); padding: 2px 6px; border-radius: 5px; margin-left: 6px;
  }
`;

/** Conic-gradient ring: cheaper than an SVG arc and identical at this size. */
const ring = (fraction, tint, size, width) => {
  const deg = Math.min(fraction, 1) * 360;
  return `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:conic-gradient(${tint} ${deg}deg, ${tint}2E ${deg}deg);
    -webkit-mask: radial-gradient(circle, transparent ${size / 2 - width}px, #000 ${size / 2 - width}px);
  "></div>`;
};

const macroCol = (name, consumed, target, tint) => {
  const left = target - consumed;
  return `<div class="col">
    <div class="smallring">${ring(consumed / target, tint, 54, 7)}<span>${consumed}g</span></div>
    <div class="name">${name}</div>
    <div class="left">${left >= 0 ? `${left}g left` : `${-left}g over`}</div>
  </div>`;
};

const food = (title, kcal, p, c, f, estimate = false) => `
  <div class="food">
    <div class="t">${escape(title)}${estimate ? '<span class="badge">ESTIMATE</span>' : ""}</div>
    <div class="macroline">
      <span>${kcal} kcal</span>
      <span style="color:${C.protein}">P ${p}g</span>
      <span style="color:${C.carbs}">C ${c}g</span>
      <span style="color:${C.fat}">F ${f}g</span>
    </div>
  </div>`;

const today = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA,
    body: `
      ${statusBar()}
      ${navBar({
        title: "Today",
        large: false,
        leading: `<div style="color:${ACCENT};transform:scaleX(-1)">${icon("chevron", { size: 18, width: 2.2 })}</div>`,
        trailing: `<div style="display:flex;gap:16px;color:${ACCENT}">
          ${icon("chevron", { size: 18, width: 2.2 })}
          <span style="font-size:20px;letter-spacing:0.09em;line-height:0.9">&middot;&middot;&middot;</span>
        </div>`,
      })}
      <div class="content">
        <div class="card" style="margin-top:12px">
          <div class="triad">
            <div class="side">
              <div class="glyph">${icon("fork", { size: 17, width: 1.7 })}</div>
              <div class="cap">Eaten</div>
              <div class="val">${EATEN.kcal}</div>
              <div class="det">of ${TARGET.kcal}</div>
            </div>

            <div class="ringwrap">
              ${ring(EATEN.kcal / TARGET.kcal, C.calories, 116, 14)}
              <div class="mid">
                <div class="big">${TARGET.kcal - EATEN.kcal}</div>
                <div class="unit">kcal left</div>
              </div>
            </div>

            <div class="side">
              <div class="glyph">${icon("flame", { size: 17, width: 1.7 })}</div>
              <div class="cap">Burned</div>
              <div class="val">412</div>
              <div class="det">net 1118</div>
            </div>
          </div>

          <div class="daytype">${icon("flame", { size: 15, width: 1.8 })} Training day</div>
          <div class="protline">${TARGET.protein - EATEN.protein}g protein to go</div>

          <div class="cols">
            ${macroCol("Protein", EATEN.protein, TARGET.protein, C.protein)}
            ${macroCol("Carbs", EATEN.carbs, TARGET.carbs, C.carbs)}
            ${macroCol("Fat", EATEN.fat, TARGET.fat, C.fat)}
          </div>
        </div>
        <div class="dots"><i class="on"></i><i></i></div>

        <div class="meal-head"><span class="m">Breakfast</span><span class="k">612 kcal</span></div>
        ${food("Greek yogurt, 2% fat", 190, 20, 9, 5)}
        ${food("Blueberries, 100 g", 57, 1, 14, 0)}
        ${food("Granola, Bob’s Red Mill", 365, 8, 52, 14)}

        <div class="meal-head"><span class="m">Lunch</span><span class="k">918 kcal</span></div>
        ${food("Chicken thigh, grilled", 421, 52, 0, 23, true)}
        ${food("Jasmine rice, cooked", 342, 6, 74, 1, true)}
      </div>
      ${tabBar(TABS, 0, ACCENT)}
      <div class="home"></div>`,
  });

/* ---------- Review estimate ---------- */

/*
 * The gate every AI estimate passes through before it reaches the diary, from
 * Views/Nutrition/EstimateReviewView.swift. Confidence names and tints are
 * EstimateConfidence in Models/FoodItem.swift and Theme.swift.
 *
 * Numbers continue the Today screen: 1530 already eaten against a 2400 target,
 * so logging 742 leaves 128, and protein lands 5g past 180.
 */
const CONFIDENCE = {
  high: { label: "High confidence", tint: "#34C759" },
  medium: { label: "Rough estimate", tint: "#FF9500" },
  low: { label: "Low confidence", tint: "#FF3B30" },
};

const ITEMS = [
  {
    name: "Chicken thigh, grilled",
    portion: "about 180 g",
    kcal: 421,
    p: 52,
    c: 0,
    f: 23,
    confidence: "high",
  },
  {
    name: "Jasmine rice, cooked",
    portion: "about 1 cup",
    kcal: 242,
    p: 4,
    c: 53,
    f: 0,
    confidence: "medium",
    note: "portion hard to judge from the angle",
  },
  {
    name: "Mixed greens, vinaigrette",
    portion: "about 60 g",
    kcal: 79,
    p: 1,
    c: 4,
    f: 7,
    confidence: "low",
    note: "dressing amount is a guess",
  },
];

const PORTIONS = ["0.5x", "0.75x", "1x", "1.5x", "2x"];

const REVIEW_CSS = `
  .sum { font-size: 14.5px; font-weight: 500; line-height: 1.35; }
  .after { display: flex; gap: 10px; font-size: 11.5px; color: var(--label-2);
    margin-top: 7px; font-variant-numeric: tabular-nums; }
  .item { padding: 11px 14px; border-bottom: 0.5px solid var(--separator); }
  .item:last-child { border-bottom: none; }
  .item-top { display: flex; align-items: flex-start; gap: 10px; }
  .item-name { font-size: 14.5px; font-weight: 500; }
  .item-portion { font-size: 11.5px; color: var(--label-2); margin-top: 2px; }
  .sw { width: 51px; height: 31px; border-radius: 999px; flex: none;
    margin-left: auto; position: relative; background: #E9E9EA; }
  .sw.on { background: ${C.calories}; }
  .sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 27px; height: 27px;
    border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.18); }
  .sw.on::after { left: 22px; }
  .portions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
  .portions .lbl { font-size: 11.5px; color: var(--label-2); }
  .cap {
    font-size: 11.5px; font-weight: 500; padding: 4px 8px; border-radius: 999px;
    background: rgba(118,118,128,0.12);
  }
  .cap.on { background: rgba(0,122,255,0.2); }
  .conf { display: flex; align-items: center; gap: 6px; font-size: 11.5px;
    color: var(--label-2); margin-top: 8px; }
  .conf i { width: 6px; height: 6px; border-radius: 50%; flex: none; }
  .caveat { display: flex; align-items: flex-start; gap: 6px; font-size: 12px;
    color: var(--label-2); padding: 12px 14px; line-height: 1.35; }
  .picker { display: flex; align-items: center; padding: 12px 14px; font-size: 16px; }
  .picker .v { margin-left: auto; color: var(--label-2); display: flex; align-items: center; gap: 4px; }
  .logbar { flex: none; padding: 12px 16px; background: rgba(249,249,249,0.94);
    border-top: 0.5px solid var(--separator); }
  .logbtn { background: ${ACCENT}; color: #fff; border-radius: 12px; text-align: center;
    padding: 14px; font-size: 17px; font-weight: 600; }
`;

const total = ITEMS.reduce(
  (acc, i) => ({
    kcal: acc.kcal + i.kcal,
    p: acc.p + i.p,
    c: acc.c + i.c,
    f: acc.f + i.f,
  }),
  { kcal: 0, p: 0, c: 0, f: 0 },
);

const macroLine = (
  m,
  size,
) => `<div class="macroline" style="font-size:${size}px">
  <span>${m.kcal} kcal</span>
  <span style="color:${C.protein}">P ${m.p}g</span>
  <span style="color:${C.carbs}">C ${m.c}g</span>
  <span style="color:${C.fat}">F ${m.f}g</span>
</div>`;

const review = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA + REVIEW_CSS,
    body: `
      ${statusBar()}
      ${navBar({
        title: "Review estimate",
        large: false,
        leading: `<div style="color:${ACCENT};transform:scaleX(-1)">${icon("chevron", { size: 19, width: 2.3 })}</div>`,
      })}
      <div class="content">
        <div class="group" style="margin-top:12px;padding:14px">
          <div class="sum">Grilled chicken thigh with jasmine rice and a side salad.</div>
          ${macroLine(total, 12.5)}
          <div class="after">
            <span>After logging:</span>
            <span>128 left kcal</span>
            <span style="color:${C.protein}">P 5g over</span>
          </div>
        </div>

        <div class="group-header">Items</div>
        <div class="group">
          ${ITEMS.map((item) => {
            const conf = CONFIDENCE[item.confidence];
            return `<div class="item">
              <div class="item-top">
                <div>
                  <div class="item-name">${escape(item.name)}</div>
                  <div class="item-portion">${escape(item.portion)}</div>
                </div>
                <div class="sw on"></div>
              </div>
              ${macroLine(item, 12)}
              <div class="portions">
                <span class="lbl">Portion</span>
                ${PORTIONS.map((p) => `<span class="cap${p === "1x" ? " on" : ""}">${p}</span>`).join("")}
              </div>
              <div class="conf">
                <i style="background:${conf.tint}"></i>
                <span>${conf.label}${item.note ? ` - ${escape(item.note)}` : ""}</span>
              </div>
            </div>`;
          }).join("")}
        </div>

        <div class="group" style="margin-top:20px">
          <div class="caveat">
            ${icon("info", { size: 14, width: 1.7 })}
            <span>Cooking oil is not visible in the photo and is not counted.</span>
          </div>
        </div>

        <div class="group-header">Meal</div>
        <div class="group">
          <div class="picker">
            <span>Meal</span>
            <span class="v">Lunch ${icon("chevron", { size: 13, width: 2.2 })}</span>
          </div>
        </div>
      </div>
      <div class="logbar">
        <div class="logbtn">Log ${ITEMS.length} items - ${total.kcal} kcal</div>
      </div>
      <div class="home"></div>`,
  });

export const screens = [
  { name: "fitai-today", html: today, featured: true },
  { name: "fitai-review", html: review, featured: true },
];
