const canvas = document.getElementById("clock");
const periodLabel = document.getElementById("period-label");
const themeColorMeta = document.getElementById("theme-color-meta");
const context = canvas.getContext("2d");

if (!context) {
  throw new Error("Could not create 2D canvas context.");
}

const GLYPHS = {
  "0": ["11111", "10001", "10001", "10001", "10001", "10001", "11111"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["11111", "00001", "00001", "11111", "10000", "10000", "11111"],
  "3": ["11111", "00001", "00001", "01111", "00001", "00001", "11111"],
  "4": ["10001", "10001", "10001", "11111", "00001", "00001", "00001"],
  "5": ["11111", "10000", "10000", "11111", "00001", "00001", "11111"],
  "6": ["11111", "10000", "10000", "11111", "10001", "10001", "11111"],
  "7": ["11111", "00001", "00001", "00010", "00100", "00100", "00100"],
  "8": ["11111", "10001", "10001", "11111", "10001", "10001", "11111"],
  "9": ["11111", "10001", "10001", "11111", "00001", "00001", "11111"],
  ":": ["0", "1", "0", "0", "1", "0", "0"],
};

const GLYPH_HEIGHT = 7;
const GLYPH_GAP = 1;

const DAY_THEMES = [
  {
    name: "Late Night",
    startMinute: 0,
    endMinute: 299,
    bgTop: [3, 7, 20],
    bgBottom: [11, 23, 53],
    bgGlow: [38, 80, 148],
    fg: [123, 188, 255],
    label: [170, 211, 255],
  },
  {
    name: "Sunrise",
    startMinute: 300,
    endMinute: 479,
    bgTop: [55, 23, 48],
    bgBottom: [132, 60, 52],
    bgGlow: [228, 130, 88],
    fg: [255, 220, 148],
    label: [255, 210, 180],
  },
  {
    name: "Daylight",
    startMinute: 480,
    endMinute: 1019,
    bgTop: [179, 226, 251],
    bgBottom: [130, 201, 238],
    bgGlow: [255, 255, 255],
    fg: [18, 72, 118],
    label: [29, 93, 140],
  },
  {
    name: "Sunset",
    startMinute: 1020,
    endMinute: 1199,
    bgTop: [98, 45, 72],
    bgBottom: [38, 29, 71],
    bgGlow: [236, 137, 94],
    fg: [255, 181, 124],
    label: [255, 204, 171],
  },
  {
    name: "Evening",
    startMinute: 1200,
    endMinute: 1439,
    bgTop: [7, 11, 24],
    bgBottom: [14, 28, 64],
    bgGlow: [65, 124, 181],
    fg: [96, 221, 244],
    label: [145, 228, 245],
  },
];

const SEASONAL_SHIFTS = {
  Winter: {
    bgTop: [-8, 6, 24],
    bgBottom: [-10, 8, 30],
    bgGlow: [-4, 14, 34],
    fg: [-12, 18, 22],
    label: [-8, 16, 20],
  },
  Spring: {
    bgTop: [8, 18, -6],
    bgBottom: [10, 22, -8],
    bgGlow: [16, 24, -3],
    fg: [-6, 14, 0],
    label: [-2, 16, 2],
  },
  Summer: {
    bgTop: [16, 8, -8],
    bgBottom: [18, 10, -10],
    bgGlow: [26, 16, -8],
    fg: [8, 2, -10],
    label: [10, 4, -10],
  },
  Autumn: {
    bgTop: [22, -4, -16],
    bgBottom: [20, -6, -14],
    bgGlow: [30, 6, -8],
    fg: [16, -8, -14],
    label: [16, -6, -12],
  },
};

let currentForeground = "rgb(123 188 255)";
let clockText = "";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const shiftColor = (base, shift) =>
  base.map((channel, index) => clamp(channel + shift[index], 0, 255));

const toRgb = (channels, alpha = 1) => {
  const [r, g, b] = channels.map((value) => Math.round(value));
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
};

const lerp = (start, end, amount) => start + (end - start) * amount;

const lerpColor = (fromColor, toColor, amount) =>
  fromColor.map((channel, index) => lerp(channel, toColor[index], amount));

const getGlyph = (character) => GLYPHS[character] ?? GLYPHS["0"];

const getGlyphWidth = (character) => getGlyph(character)[0].length;

const measureTextUnits = (text) => {
  let width = 0;
  for (let index = 0; index < text.length; index += 1) {
    width += getGlyphWidth(text[index]);
    if (index < text.length - 1) {
      width += GLYPH_GAP;
    }
  }
  return { width, height: GLYPH_HEIGHT };
};

const getSeason = (date) => {
  const month = date.getMonth() + 1;
  if (month === 12 || month <= 2) {
    return "Winter";
  }
  if (month <= 5) {
    return "Spring";
  }
  if (month <= 8) {
    return "Summer";
  }
  return "Autumn";
};

const resolveDayTheme = (minutes) => {
  const minute = ((minutes % 1440) + 1440) % 1440;
  let currentIndex = DAY_THEMES.findIndex(
    (theme) => minute >= theme.startMinute && minute <= theme.endMinute
  );

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  const current = DAY_THEMES[currentIndex];
  const next = DAY_THEMES[(currentIndex + 1) % DAY_THEMES.length];
  const span = current.endMinute - current.startMinute + 1;
  const amount = span > 0 ? (minute - current.startMinute) / span : 0;

  return {
    status: current.name,
    bgTop: lerpColor(current.bgTop, next.bgTop, amount),
    bgBottom: lerpColor(current.bgBottom, next.bgBottom, amount),
    bgGlow: lerpColor(current.bgGlow, next.bgGlow, amount),
    fg: lerpColor(current.fg, next.fg, amount),
    label: lerpColor(current.label, next.label, amount),
  };
};

const resolveTheme = (minutes, date) => {
  const dayTheme = resolveDayTheme(minutes);
  const season = getSeason(date);
  const shift = SEASONAL_SHIFTS[season];

  return {
    status: dayTheme.status,
    season,
    bgTop: shiftColor(dayTheme.bgTop, shift.bgTop),
    bgBottom: shiftColor(dayTheme.bgBottom, shift.bgBottom),
    bgGlow: shiftColor(dayTheme.bgGlow, shift.bgGlow),
    fg: shiftColor(dayTheme.fg, shift.fg),
    label: shiftColor(dayTheme.label, shift.label),
  };
};

const applyTheme = (theme, dateIso) => {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--bg-top", toRgb(theme.bgTop));
  rootStyle.setProperty("--bg-bottom", toRgb(theme.bgBottom));
  rootStyle.setProperty("--bg-glow", toRgb(theme.bgGlow, 0.45));
  rootStyle.setProperty("--fg", toRgb(theme.fg));
  rootStyle.setProperty("--fg-glow", toRgb(theme.fg, 0.6));
  rootStyle.setProperty("--label", toRgb(theme.label));

  currentForeground = toRgb(theme.fg);
  themeColorMeta.setAttribute("content", toRgb(theme.bgBottom));

  if (periodLabel) {
    periodLabel.textContent = `${dateIso} \u00B7 ${theme.status}`;
  }

  canvas.setAttribute(
    "aria-label",
    `${clockText} on ${dateIso}. ${theme.status} ${theme.season}`
  );
};

const drawText = (text, pixelSize) => {
  const { width: unitWidth, height: unitHeight } = measureTextUnits(text);
  const totalWidth = unitWidth * pixelSize;
  const totalHeight = unitHeight * pixelSize;
  const offsetX = Math.floor((canvas.clientWidth - totalWidth) / 2);
  const offsetY = Math.floor((canvas.clientHeight - totalHeight) / 2);

  let cursorX = offsetX;
  context.fillStyle = currentForeground;

  for (let index = 0; index < text.length; index += 1) {
    const glyph = getGlyph(text[index]);
    const glyphWidth = glyph[0].length;

    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyphWidth; column += 1) {
        if (glyph[row][column] === "1") {
          context.fillRect(
            cursorX + column * pixelSize,
            offsetY + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }

    cursorX += glyphWidth * pixelSize;
    if (index < text.length - 1) {
      cursorX += GLYPH_GAP * pixelSize;
    }
  }
};

const drawClock = () => {
  const metrics = measureTextUnits(clockText);
  const maxWidth = Math.floor(window.innerWidth * 0.94);
  const maxHeight = Math.floor(window.innerHeight * 0.66);
  const pixelSize = Math.max(
    3,
    Math.floor(
      Math.min(maxWidth / (metrics.width + 4), maxHeight / (metrics.height + 4))
    )
  );

  const canvasWidth = (metrics.width + 4) * pixelSize;
  const canvasHeight = (metrics.height + 4) * pixelSize;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  if (
    canvas.width !== Math.floor(canvasWidth * dpr) ||
    canvas.height !== Math.floor(canvasHeight * dpr)
  ) {
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  drawText(clockText, pixelSize);
};

const update = () => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = String(now.getFullYear());

  clockText = `${hour}:${minute}`;

  const minuteOfDay =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const theme = resolveTheme(minuteOfDay, now);
  const dateIso = `${year}-${month}-${day}`;

  applyTheme(theme, dateIso);
  drawClock();

  const wait = 1000 - (Date.now() % 1000);
  window.setTimeout(update, wait + 12);
};

window.addEventListener("resize", drawClock);
update();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // App works without a service worker. Ignore registration issues.
    });
  });
}
