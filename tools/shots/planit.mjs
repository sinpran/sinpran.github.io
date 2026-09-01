/**
 * Planit (TravelItineraryPlanner), rebuilt from Sources/Views in the app repo.
 *
 * Layout, copy and formatting come from the source:
 *   Views/RootView.swift          "My Trips", trip rows
 *   Views/ItineraryDayView.swift  "Schedule", "Estimated for the day", EventRow
 *   Models/Interest.swift         category names, colours and symbols
 *   App/Theme.swift               card radius and padding
 *
 * EventRow's shape is followed exactly: start time over end time in a 52pt
 * right-aligned gutter, then a tinted category dot, title, cost capsule,
 * transport line, location, description, and the Keep control.
 */
import {
  escape,
  icon,
  navBar,
  plusCircle,
  screen,
  statusBar,
} from "./chrome.mjs";

/* AccentColor.colorset, light variant: srgb(0.055, 0.455, 0.565). */
const ACCENT = "#0E7490";

/* Interest.tint, mapped to the iOS system colours SwiftUI resolves them to. */
const TINT = {
  tourism: "#007AFF",
  food: "#FF9500",
  culture: "#AF52DE",
  history: "#A2845E",
  nature: "#34C759",
  art: "#00C7BE",
  relaxation: "#30B0C7",
};

const GLYPH = {
  tourism: "camera",
  food: "fork",
  culture: "columns",
  history: "book",
  nature: "leaf",
  art: "palette",
  relaxation: "cup",
};

const EXTRA = `
  .trip { background: #fff; border-radius: 16px; padding: 14px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 14px; }
  .trip-badge { width: 46px; height: 46px; border-radius: 50%; flex: none;
    background: rgba(14,116,144,0.15); color: ${ACCENT};
    display: flex; align-items: center; justify-content: center; }
  .headline { font-size: 16.5px; font-weight: 600; letter-spacing: -0.018em; }
  .subhead { font-size: 14.5px; color: var(--label-2); margin-top: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .trip-meta { display: flex; gap: 8px; margin-top: 3px; font-size: 12px;
    color: var(--label-3); }
  .trip-meta span { display: flex; align-items: center; gap: 4px; }

  .daysum { font-size: 14.5px; color: var(--label-2); line-height: 1.4; }
  .daycost { display: flex; align-items: center; gap: 6px; margin-top: 10px;
    font-size: 12px; color: var(--label-2); }
  .daycost b { margin-left: auto; font-weight: 600; color: var(--label);
    font-variant-numeric: tabular-nums; }

  .ev { display: flex; align-items: flex-start; gap: 12px;
    padding: 13px 14px; border-bottom: 0.5px solid var(--separator); }
  .ev:last-child { border-bottom: none; }
  .ev-time { width: 52px; flex: none; text-align: right; }
  .ev-time .s { font-size: 14.5px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ev-time .e { font-size: 11px; color: var(--label-2); margin-top: 2px;
    font-variant-numeric: tabular-nums; }
  .ev-body { flex: 1; min-width: 0; }
  .ev-head { display: flex; align-items: flex-start; gap: 8px; }
  .ev-dot { width: 26px; height: 26px; border-radius: 50%; flex: none;
    display: flex; align-items: center; justify-content: center; }
  .ev-title { font-size: 15.5px; font-weight: 600; letter-spacing: -0.018em; flex: 1;
    line-height: 1.25; }
  .ev-cost { font-size: 12px; font-weight: 500; color: var(--label-2); flex: none;
    background: rgba(118,118,128,0.12); padding: 3px 8px; border-radius: 999px;
    font-variant-numeric: tabular-nums; }
  .ev-meta { display: flex; align-items: center; gap: 6px; font-size: 12px;
    color: var(--label-3); margin-top: 7px; }
  .ev-loc { display: flex; align-items: center; gap: 5px; font-size: 12px;
    color: ${ACCENT}; margin-top: 4px; }
  .ev-desc { font-size: 14px; color: var(--label-2); line-height: 1.38; margin-top: 7px; }
  .ev-keep { display: flex; align-items: center; gap: 5px; font-size: 13px;
    color: ${ACCENT}; margin-top: 9px; }
`;

const EVENTS = [
  {
    start: "09:00",
    end: "11:00",
    cat: "culture",
    title: "Rijksmuseum",
    cost: "€22.00",
    mode: "Walk",
    mins: 12,
    loc: "Museumstraat 1",
    desc: "Start with the Gallery of Honour before the tour groups arrive, then work back through the Golden Age rooms.",
  },
  {
    start: "11:30",
    end: "12:30",
    cat: "food",
    title: "Lunch at Foodhallen",
    cost: "€18.00",
    mode: "Public Transit",
    mins: 9,
    loc: "Bellamyplein 51",
    desc: "Indoor food hall in a converted tram depot. Good rainy-day option and quick enough to keep the afternoon intact.",
  },
  {
    start: "13:00",
    end: "15:00",
    cat: "tourism",
    title: "Canal ring walk",
    cost: "Free",
    mode: "Walk",
    mins: 6,
    loc: "Brouwersgracht",
    desc: "Loop the Jordaan and the western canals on foot, ending near the Anne Frank House.",
  },
  {
    start: "15:30",
    end: "17:00",
    cat: "art",
    title: "Van Gogh Museum",
    cost: "€24.00",
    mode: "Public Transit",
    mins: 14,
    loc: "Museumplein 6",
    desc: "Timed entry booked for 15:30. The permanent collection is chronological, so an hour and a half is enough.",
  },
];

/*
 * TripRow: name, then destinationSummary — which really is joined with a
 * literal " -> " — then a tertiary caption pairing total days with the trip
 * budget. Currency goes through .formatted(.currency(code:)), so it carries
 * cents. There is no chevron: the row is a NavigationLink inside a plain List
 * with separators hidden, so the card is the whole affordance.
 *
 * The last row is deliberately a trip that has not been generated yet: the
 * badge switches to a pencil, and the budget is optional, so the caption drops
 * to just the day count. Both are states the real list shows.
 */
const TRIPS = [
  {
    name: "Netherlands &amp; Belgium",
    destinations: "Amsterdam -&gt; Utrecht -&gt; Bruges",
    days: "9 days",
    budget: "€1,500.00",
  },
  {
    name: "Northern Japan",
    destinations: "Tokyo -&gt; Kanazawa -&gt; Sapporo",
    days: "12 days",
    budget: "¥380,000",
  },
  {
    name: "Patagonia",
    destinations: "El Calafate -&gt; El Chalt&eacute;n",
    days: "7 days",
    budget: "$2,400.00",
  },
  {
    name: "Iceland Ring Road",
    destinations: "Reykjav&iacute;k -&gt; V&iacute;k -&gt; Akureyri",
    days: "10 days",
    budget: "$3,100.00",
  },
  {
    name: "Weekend in Lisbon",
    destinations: "Lisbon",
    days: "3 days",
    draft: true,
  },
];

const trips = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA,
    body: `
      ${statusBar()}
      ${navBar({
        title: "My Trips",
        leading: `<div style="color:${ACCENT}">${icon("gear", { size: 22, width: 1.7 })}</div>`,
        trailing: plusCircle(25, ACCENT),
      })}
      <div class="content">
        ${TRIPS.map(
          (trip) => `<div class="trip">
            <div class="trip-badge">
              ${
                trip.draft
                  ? icon("pencil", { size: 18, width: 1.9 })
                  : icon("planedepart", {
                      size: 20,
                      width: 1.4,
                      fill: "currentColor",
                      stroke: "none",
                    })
              }
            </div>
            <div class="row-main">
              <div class="headline">${trip.name}</div>
              <div class="subhead">${trip.destinations}</div>
              <div class="trip-meta">
                <span>${icon("calendar", { size: 12, width: 1.8 })} ${trip.days}</span>
                ${trip.budget ? `<span>${icon("banknote", { size: 12, width: 1.8 })} ${trip.budget}</span>` : ""}
              </div>
            </div>
          </div>`,
        ).join("")}
      </div>
      <div class="home"></div>`,
  });

const day = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA,
    body: `
      ${statusBar()}
      ${navBar({
        title: "Apr 14",
        large: false,
        leading: `<div style="color:${ACCENT};transform:scaleX(-1)">${icon("chevron", { size: 19, width: 2.3 })}</div>`,
      })}
      <div class="content">
        <div class="group" style="margin-top:12px;padding:14px">
          <div class="daysum">
            Museums in the morning while the light is poor, the canal ring on foot
            after lunch, and an early dinner near the Jordaan.
          </div>
          <div class="daycost">
            ${icon("banknote", { size: 14, width: 1.7 })} Estimated for the day <b>€64.00</b>
          </div>
        </div>

        <div class="group-header">Schedule</div>
        <div class="group">
          ${EVENTS.map(
            (e) => `<div class="ev">
              <div class="ev-time"><div class="s">${e.start}</div><div class="e">${e.end}</div></div>
              <div class="ev-body">
                <div class="ev-head">
                  <div class="ev-dot" style="background:${TINT[e.cat]}26;color:${TINT[e.cat]}">
                    ${icon(GLYPH[e.cat], { size: 13, width: 1.9 })}
                  </div>
                  <div class="ev-title">${escape(e.title)}</div>
                  <div class="ev-cost">${e.cost}</div>
                </div>
                <div class="ev-meta">${escape(e.mode)} &middot; ~${e.mins} min</div>
                <div class="ev-loc">${icon("pin", { size: 12, width: 1.9 })} ${escape(e.loc)}</div>
                <div class="ev-desc">${escape(e.desc)}</div>
                <div class="ev-keep">${icon("lockopen", { size: 13, width: 1.8 })} Keep</div>
              </div>
            </div>`,
          ).join("")}
        </div>
      </div>
      <div class="home"></div>`,
  });

export const screens = [
  { name: "planit-trips", html: trips, featured: true },
  { name: "planit-day", html: day, featured: true },
];
