/**
 * Shared iOS furniture for the app mockups: status bar, navigation bar, tab bar,
 * plus the CSS that makes a plain HTML document read as an iOS screen.
 *
 * SF Pro is not licensable here and Chrome on Linux does not have it, so the
 * mockups use Inter. It is the closest widely-available substitute and it is
 * already a dependency, which also keeps the mockups consistent with the site
 * they sit on.
 */

/** iPhone 15 Pro logical points. Rendered at 2x. */
export const DEVICE = { width: 393, height: 852, scale: 2 };

export const escape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* ---------- icons ---------- */

/*
 * Stroke-drawn approximations of the SF Symbols each screen uses. Real SF
 * Symbols are a licensed font, so these are redrawn rather than embedded.
 */
const PATHS = {
  chevron: "M9 5l7 7-7 7",
  plus: "M12 5v14M5 12h14",
  check: "M4 12.5l5 5L20 6.5",
  xmark: "M6 6l12 12M18 6L6 18",
  camera:
    "M3 8.5A2.5 2.5 0 015.5 6h2L9 4h6l1.5 2h2A2.5 2.5 0 0121 8.5v9A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  barcode: "M4 6v12M7 6v12M10 6v9M13 6v12M16 6v9M20 6v12",
  fork: "M7 3v7a2 2 0 004 0V3M9 10v11M17 3c-1.5 1.5-2 3-2 5s.5 3 2 3v10",
  dumbbell: "M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  person: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0",
  car: "M5 17h14M4 17v-4.2a2 2 0 01.2-.9l1.8-3.6A2 2 0 017.8 7h8.4a2 2 0 011.8 1.1l1.8 3.6a2 2 0 01.2.9V17M4 12h16M7.5 20v-3M16.5 20v-3",
  wrench:
    "M14.9 6.4a4.6 4.6 0 015.6-4.5l-2.9 2.9.2 2.8 2.8.2 2.9-2.9a4.6 4.6 0 01-6.2 5.4L6.6 21a2.3 2.3 0 11-3.3-3.3L14.4 8.1a4.6 4.6 0 01.5-1.7z",
  tyre: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 3v5M12 16v5M3 12h5M16 12h5",
  calendar:
    "M4 8h16M7 4v3M17 4v3M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 13a3 3 0 100-6 3 3 0 000 6z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2",
  bed: "M3 18v-7h13a4 4 0 014 4v3M3 11V7M3 18h18M7.5 11a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z",
  plane:
    "M21 15l-9-4.5V5a1.5 1.5 0 00-3 0v5.5L0 15v2l9-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-4.5L21 17z",
  sparkle:
    "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  gauge: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 12l4-3.5M12 12v.01",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
  drop: "M12 3s6 6.5 6 10.5A6 6 0 016 13.5C6 9.5 12 3 12 3z",
  filter: "M3 6h18M7 12h10M10 18h4",
  flame:
    "M12 22a6 6 0 006-6c0-4-3-5.5-3-9 0 0-3 1.5-3 5 0-2-1.5-3.5-1.5-3.5S6 11 6 16a6 6 0 006 6z",
  book: "M4 4.5A1.5 1.5 0 015.5 3H19v16H5.5A1.5 1.5 0 004 20.5zM4 20.5A1.5 1.5 0 015.5 19H19v2H5.5A1.5 1.5 0 014 20.5z",
  gear: "M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 13a7.6 7.6 0 000-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-1.7-1L15 3.4h-4l-.3 2.6a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 000 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 001.7 1l.3 2.6h4l.3-2.6a7.6 7.6 0 001.7-1l2.4 1 2-3.4z",
  checkseal:
    "M12 2.6l2.2 1.7 2.8-.3 1 2.6 2.5 1.3-.7 2.7.7 2.7-2.5 1.3-1 2.6-2.8-.3L12 21.4l-2.2-1.7-2.8.3-1-2.6-2.5-1.3.7-2.7-.7-2.7 2.5-1.3 1-2.6 2.8.3zM8.6 12.2l2.4 2.4 4.4-4.6",
  bag: "M6 8h12l-1 12H7zM9 8V6a3 3 0 016 0v2",
  columns: "M3 21h18M4 21V10M9 21V10M15 21V10M20 21V10M2.5 10L12 4l9.5 6z",
  leaf: "M4 20C4 10 11 4 20 4c0 9-6 16-16 16zM4 20c3-6 7-9 11-10.5",
  moonstars:
    "M19 14.5A7.5 7.5 0 119.5 5a6 6 0 009.5 9.5zM17 3l.7 2L20 5.7 17.7 6.4 17 8.7 16.3 6.4 14 5.7l2.3-.7z",
  cup: "M4 8h12v5a5 5 0 01-10 0zM16 9h2a2.5 2.5 0 010 5h-1M3 21h15",
  palette:
    "M12 21a9 9 0 110-18c5 0 9 3.4 9 7.6 0 2.4-2 3.9-4.3 3.9h-1.6c-1.2 0-2.1.9-2.1 2 0 .5.2 1 .5 1.4.3.4.5.8.5 1.2 0 1-.9 1.9-2 1.9zM7.5 12.5a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zM11 8.5a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zM15.5 9.5a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z",
  lockopen:
    "M7 11V7.5a5 5 0 019.6-1.9M5.5 11h13a1 1 0 011 1v8a1 1 0 01-1 1h-13a1 1 0 01-1-1v-8a1 1 0 011-1z",
  banknote:
    "M2.5 6.5h19v11h-19zM12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM6 9.5v.01M18 14.5v.01",
  hiking:
    "M13 4.5a1.6 1.6 0 100-3.2 1.6 1.6 0 000 3.2zM11 22l1.5-6-2.5-2.5V9l4-1.5 2.5 3 3 1M8 22l2-5M19 9v13",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11.5V16M12 7.8v.4",
};

export function icon(
  name,
  { size = 22, stroke = "currentColor", width = 1.7, fill = "none" } = {},
) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}"
    stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${PATHS[name]}"/></svg>`;
}

/* ---------- furniture ---------- */

/** 9:41 is Apple's convention in every marketing screenshot. */
export function statusBar({ dark = false } = {}) {
  const tint = dark ? "#fff" : "#000";
  return `<div class="status">
    <div class="status-time">9:41</div>
    <div class="status-right">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="${tint}">
        <rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/>
        <rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/>
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="${tint}">
        <path d="M8 11.2l2.2-2.6a3.4 3.4 0 00-4.4 0zM8 6.2c1.4 0 2.7.5 3.7 1.4l1.5-1.8A8.1 8.1 0 008 3.8a8.1 8.1 0 00-5.2 2L4.3 7.6A5.6 5.6 0 018 6.2zM8 1.4c2.3 0 4.5.8 6.2 2.3l1.4-1.7A11.4 11.4 0 008 0C5 0 2.3 1 .4 2l1.4 1.7A9.3 9.3 0 018 1.4z"/>
      </svg>
      <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
        <rect x="0.5" y="0.5" width="22" height="12" rx="3.8" stroke="${tint}" stroke-opacity="0.4"/>
        <rect x="2" y="2" width="17" height="9" rx="2.5" fill="${tint}"/>
        <path d="M24 4.5v4a2.1 2.1 0 000-4z" fill="${tint}" fill-opacity="0.4"/>
      </svg>
    </div>
  </div>`;
}

export function navBar({ title, large = true, leading = "", trailing = "" }) {
  if (large) {
    return `<div class="nav nav-compact">
        <div class="nav-side">${leading}</div><div class="nav-side nav-trailing">${trailing}</div>
      </div>
      <h1 class="nav-large">${escape(title)}</h1>`;
  }
  return `<div class="nav nav-inline">
    <div class="nav-side">${leading}</div>
    <div class="nav-title">${escape(title)}</div>
    <div class="nav-side nav-trailing">${trailing}</div>
  </div>`;
}

export function tabBar(items, activeIndex, accent) {
  return `<div class="tabbar">
    ${items
      .map(
        (item, i) => `<div class="tab ${i === activeIndex ? "tab-on" : ""}"
        style="color:${i === activeIndex ? accent : "rgba(60,60,67,0.5)"}">
        ${icon(item.icon, { size: 25, width: 1.6 })}<span>${escape(item.label)}</span>
      </div>`,
      )
      .join("")}
  </div>`;
}

/* ---------- document ---------- */

export function screen({ body, accent, fonts, extraCss = "", grouped = true }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: "Inter"; src: url(${fonts.sans}) format("woff2-variations"); font-weight: 100 900; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --accent: ${accent};
    --label: #000;
    --label-2: rgba(60,60,67,0.6);
    --label-3: rgba(60,60,67,0.35);
    --separator: rgba(60,60,67,0.2);
    --card: #fff;
  }
  body {
    width: ${DEVICE.width}px; height: ${DEVICE.height}px; overflow: hidden;
    background: ${grouped ? "#F2F2F7" : "#fff"};
    font-family: "Inter", sans-serif; color: var(--label);
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "cv05" 1, "ss03" 1;
    letter-spacing: -0.012em;
    display: flex; flex-direction: column;
  }

  /* status bar */
  .status {
    height: 54px; flex: none; padding: 14px 26px 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .status-time { font-size: 16px; font-weight: 620; letter-spacing: -0.02em; }
  .status-right { display: flex; align-items: center; gap: 6px; }

  /* nav */
  .nav { flex: none; padding: 0 16px; display: flex; align-items: center; min-height: 44px; }
  .nav-inline {
    justify-content: space-between; position: relative;
    border-bottom: 0.5px solid var(--separator);
  }
  .nav-compact { justify-content: space-between; min-height: 38px; }
  .nav-side { display: flex; align-items: center; gap: 18px; color: var(--accent); }
  .nav-trailing { margin-left: auto; }
  /* Absolutely centred, the way iOS centres an inline title regardless of how
     wide the bar buttons on either side are. */
  .nav-title {
    position: absolute; left: 50%; transform: translateX(-50%);
    font-size: 17px; font-weight: 620; white-space: nowrap;
  }
  .nav-large { font-size: 34px; font-weight: 700; letter-spacing: -0.032em; padding: 0 16px 8px; flex: none; }

  /* Scrollable body. min-height:0 is load-bearing: a column flex item defaults
     to min-height:auto, so without it this grows to fit its content and pushes
     the tab bar out past the clipped edge of the device. */
  .content { flex: 1; min-height: 0; overflow: hidden; padding: 0 16px; }
  .content::-webkit-scrollbar { display: none; }

  /* grouped list */
  .group { background: var(--card); border-radius: 12px; overflow: hidden; }
  .group + .group-header { margin-top: 22px; }
  .group-header {
    font-size: 13px; font-weight: 500; color: var(--label-2);
    text-transform: uppercase; letter-spacing: 0.04em;
    padding: 0 16px 7px; margin-top: 20px;
  }
  .row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-bottom: 0.5px solid var(--separator);
  }
  .row:last-child { border-bottom: none; }
  .row-main { flex: 1; min-width: 0; }
  .row-title { font-size: 16px; letter-spacing: -0.015em; }
  .row-sub { font-size: 13.5px; color: var(--label-2); margin-top: 2px; }
  .row-value { font-size: 15.5px; color: var(--label-2); }
  .chev { color: var(--label-3); flex: none; }

  /* pills */
  .pill {
    font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 999px;
    letter-spacing: 0.005em; white-space: nowrap;
  }

  /* home indicator */
  .home { flex: none; height: 22px; display: flex; align-items: center; justify-content: center; }
  .home::after { content: ""; width: 140px; height: 5px; border-radius: 3px; background: rgba(0,0,0,0.85); }

  /* tab bar */
  .tabbar {
    flex: none; height: 52px; display: flex; align-items: center;
    border-top: 0.5px solid var(--separator); background: rgba(249,249,249,0.94);
  }
  .tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .tab span { font-size: 10px; font-weight: 520; letter-spacing: 0; }

  ${extraCss}
</style></head><body>${body}</body></html>`;
}
