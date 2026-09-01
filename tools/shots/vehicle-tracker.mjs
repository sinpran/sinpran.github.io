/**
 * Vehicle Tracker, rebuilt from Sources/Views in the app repo.
 *
 * Copy, navigation titles, status labels, catalogue names, intervals and cost
 * ranges are all taken from the source rather than invented:
 *   RootView.swift              "My Vehicles", VehicleRow
 *   VehicleComponentsView.swift ComponentRow, "<status> - next due at <n> mi"
 *   ComponentDetailView.swift   difficulty, cost line, Tools Needed, Steps
 *   VinEntryView.swift          "Add a Vehicle" form
 *   ComponentCatalog.swift      display names, intervals, cost ranges, steps
 *   Assets.xcassets             AccentColor
 *
 * The vehicle is the same 2013 F-150 the site's VIN demo decodes, so the two
 * tell one story.
 */
import { escape, icon, navBar, screen, statusBar } from "./chrome.mjs";

/** AccentColor.colorset: srgb(0.145, 0.404, 0.910). */
const ACCENT = "#2567E8";

/* iOS system colours, which is what Color.red/.orange/.green resolve to. */
const TINT = { overdue: "#FF3B30", dueSoon: "#FF9500", ok: "#34C759" };
const LABEL = { overdue: "Overdue", dueSoon: "Due soon", ok: "OK" };

const ODOMETER = "96,480";

/*
 * Sorted the way MaintenanceEngine sorts: overdue, then due soon, then ok, each
 * by miles remaining ascending. Due-soon is within 10% of the interval.
 * EV Battery Health Check is absent because the applicability filter drops it
 * for a combustion vehicle — which is the whole point of the app.
 */
const COMPONENTS = [
  { name: "Engine Oil & Filter", status: "overdue", due: "94,000" },
  { name: "Tire Rotation", status: "overdue", due: "95,900" },
  { name: "Engine Air Filter", status: "dueSoon", due: "97,000" },
  { name: "Brake Fluid Flush", status: "dueSoon", due: "99,000" },
  { name: "Cabin Air Filter", status: "ok", due: "103,500" },
  { name: "Transmission Fluid", status: "ok", due: "108,000" },
  { name: "Differential Fluid", status: "ok", due: "112,000" },
  { name: "Coolant Flush", status: "ok", due: "120,000" },
  { name: "Spark Plugs", status: "ok", due: "126,000" },
  { name: "12V Battery Check", status: "ok", due: "140,000" },
  { name: "Timing Belt", status: "ok", due: "150,000" },
];

const EXTRA = `
  .veh-row { display: flex; align-items: center; gap: 14px; padding: 14px; }
  .veh-badge {
    width: 46px; height: 46px; border-radius: 50%; flex: none;
    background: rgba(37,103,232,0.15); color: ${ACCENT};
    display: flex; align-items: center; justify-content: center;
  }
  .headline { font-size: 16.5px; font-weight: 600; letter-spacing: -0.018em; }
  .subhead { font-size: 14.5px; color: var(--label-2); margin-top: 3px; }

  .comp-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 16px; border-bottom: 0.5px solid var(--separator);
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }

  /* Form (VinEntryView) */
  .form-header {
    font-size: 13px; color: var(--label-2); text-transform: uppercase;
    letter-spacing: 0.04em; padding: 0 16px 7px; margin-top: 18px;
  }
  .field { padding: 12px 16px; border-bottom: 0.5px solid var(--separator); font-size: 16px; }
  .field:last-child { border-bottom: none; }
  .field.placeholder { color: var(--label-3); }
  .field.filled { color: var(--label); font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
  .toggle-row { display: flex; align-items: center; padding: 11px 16px; }
  .switch {
    width: 51px; height: 31px; border-radius: 999px; background: #E9E9EA;
    flex: none; margin-left: auto; position: relative;
  }
  .switch::after {
    content: ""; position: absolute; top: 2px; left: 2px; width: 27px; height: 27px;
    border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.18);
  }
  .footnote { font-size: 13px; color: var(--label-2); line-height: 1.35; padding: 7px 16px 0; }

  /* Detail sheet */
  .detail { padding: 16px; }
  .detail h3 { font-size: 17px; font-weight: 650; margin-top: 16px; letter-spacing: -0.02em; }
  .detail p { font-size: 14.5px; line-height: 1.4; }
  .muted { color: var(--label-2); }
  .imgbox {
    height: 108px; border-radius: 16px; background: rgba(118,118,128,0.12);
    display: flex; align-items: center; justify-content: center; text-align: center;
    padding: 0 14px; margin-top: 12px;
  }
  .imgbox span { font-size: 12.5px; color: var(--label-2); line-height: 1.3; }
  .bullet { font-size: 14.5px; margin-top: 5px; }
  .step { font-size: 14.5px; margin-top: 7px; line-height: 1.38; }
  .cta {
    background: ${ACCENT}; color: #fff; border-radius: 11px; text-align: center;
    padding: 13px; font-size: 16px; font-weight: 600; margin-top: 18px;
  }
  .barbtn { font-size: 16.5px; color: ${ACCENT}; }
  .barbtn.dim { color: var(--label-3); }
`;

/* ---------- 1. My Vehicles ---------- */

const vehicles = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA,
    grouped: false,
    body: `
      ${statusBar()}
      ${navBar({
        title: "My Vehicles",
        trailing: `<div style="color:${ACCENT}">${icon("plus", { size: 25, width: 2.1 })}</div>`,
      })}
      <div class="content" style="padding:0 16px">
        <div class="veh-row" style="padding-left:0;padding-right:0">
          <div class="veh-badge">${icon("car", { size: 21, width: 1.9 })}</div>
          <div class="row-main">
            <div class="headline">2013 Ford F-150</div>
            <div class="subhead">${ODOMETER} mi</div>
          </div>
          <div class="chev">${icon("chevron", { size: 16, width: 2.2 })}</div>
        </div>
        <div class="veh-row" style="padding-left:0;padding-right:0">
          <div class="veh-badge">${icon("car", { size: 21, width: 1.9 })}</div>
          <div class="row-main">
            <div class="headline">2017 Tesla Model 3</div>
            <div class="subhead">41,120 mi</div>
          </div>
          <div class="chev">${icon("chevron", { size: 16, width: 2.2 })}</div>
        </div>
      </div>
      <div class="home"></div>`,
  });

/* ---------- 2. Component list ---------- */

const components = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA,
    grouped: false,
    body: `
      ${statusBar()}
      ${navBar({
        title: "2013 Ford F-150",
        large: false,
        leading: `<div style="color:${ACCENT};transform:scaleX(-1)">${icon("chevron", { size: 19, width: 2.3 })}</div>`,
      })}
      <div class="content" style="padding:0">
        ${COMPONENTS.map(
          (c) => `<div class="comp-row">
            <div class="dot" style="background:${TINT[c.status]}"></div>
            <div class="row-main">
              <div class="headline">${escape(c.name)}</div>
              <div class="subhead">${LABEL[c.status]} - next due at ${c.due} mi</div>
            </div>
            <div class="chev">${icon("chevron", { size: 15, width: 2.2 })}</div>
          </div>`,
        ).join("")}
      </div>
      <div class="home"></div>`,
  });

/* ---------- 3. Component detail ---------- */

const detail = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA,
    grouped: false,
    body: `
      ${statusBar()}
      ${navBar({
        title: "Engine Oil & Filter",
        large: false,
        leading: `<span class="barbtn">Close</span>`,
      })}
      <div class="content" style="padding:0">
        <div class="detail">
          <p class="muted">Easy DIY</p>
          <p style="margin-top:10px">Next due at 94,000 mi (2,480 mi overdue)</p>
          <p style="margin-top:3px">Est. cost: $35-65 DIY vs. $60-120 at a shop</p>

          <div class="imgbox"><span>Typical drain plug location under the oil pan</span></div>
          <div class="imgbox"><span>Oil filter location (varies by engine layout)</span></div>

          <h3>Tools Needed</h3>
          ${[
            "Drain pan",
            "Socket wrench",
            "Oil filter wrench",
            "New crush washer",
            "Funnel",
          ]
            .map((t) => `<div class="bullet">&bull; ${escape(t)}</div>`)
            .join("")}

          <h3>Steps</h3>
          <div class="step">1. Warm the engine for 2-3 minutes so old oil drains fully, then park on level ground and engage the parking brake.</div>
          <div class="step">2. Locate the drain plug on the bottom of the oil pan, place a drain pan underneath, and remove the plug.</div>
          <div class="step">3. Once drained, replace the drain plug with a new crush washer and torque to spec.</div>

          <div class="cta">Mark as done at current mileage</div>
        </div>
      </div>
      <div class="home"></div>`,
  });

/* ---------- 4. Add a Vehicle ---------- */

const entry = (fonts) =>
  screen({
    fonts,
    accent: ACCENT,
    extraCss: EXTRA,
    body: `
      ${statusBar()}
      ${navBar({
        title: "Add a Vehicle",
        large: false,
        leading: `<span class="barbtn">Cancel</span>`,
        trailing: `<span class="barbtn">Look Up</span>`,
      })}
      <div class="content">
        <div class="form-header">Vehicle</div>
        <div class="group">
          <div class="field filled">1FTFW1ET9DFC10312</div>
          <div class="field filled">96480</div>
        </div>

        <div class="group" style="margin-top:22px">
          <div class="toggle-row">
            <span style="font-size:16px">Mostly severe driving conditions</span>
            <div class="switch"></div>
          </div>
        </div>
        <div class="footnote">
          Severe conditions (short trips, towing, dusty roads, extreme temps)
          shorten several service intervals.
        </div>
      </div>
      <div class="home"></div>`,
  });

export const screens = [
  { name: "vehicle-tracker-vehicles", html: vehicles },
  { name: "vehicle-tracker-components", html: components, featured: true },
  { name: "vehicle-tracker-detail", html: detail, featured: true },
  { name: "vehicle-tracker-entry", html: entry },
];
