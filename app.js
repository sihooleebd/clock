const canvas = document.getElementById("clock");
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
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
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
    subFg: [170, 211, 255],
  },
  {
    name: "Sunrise",
    startMinute: 300,
    endMinute: 479,
    bgTop: [55, 23, 48],
    bgBottom: [132, 60, 52],
    bgGlow: [228, 130, 88],
    fg: [255, 220, 148],
    subFg: [255, 210, 180],
  },
  {
    name: "Daylight",
    startMinute: 480,
    endMinute: 1019,
    bgTop: [179, 226, 251],
    bgBottom: [130, 201, 238],
    bgGlow: [255, 255, 255],
    fg: [18, 72, 118],
    subFg: [29, 93, 140],
  },
  {
    name: "Sunset",
    startMinute: 1020,
    endMinute: 1199,
    bgTop: [98, 45, 72],
    bgBottom: [38, 29, 71],
    bgGlow: [236, 137, 94],
    fg: [255, 181, 124],
    subFg: [255, 204, 171],
  },
  {
    name: "Evening",
    startMinute: 1200,
    endMinute: 1439,
    bgTop: [7, 11, 24],
    bgBottom: [14, 28, 64],
    bgGlow: [65, 124, 181],
    fg: [96, 221, 244],
    subFg: [145, 228, 245],
  },
];

const SEASONAL_SHIFTS = {
  Winter: {
    bgTop: [-8, 6, 24],
    bgBottom: [-10, 8, 30],
    bgGlow: [-4, 14, 34],
    fg: [-12, 18, 22],
    subFg: [-8, 16, 20],
  },
  Spring: {
    bgTop: [8, 18, -6],
    bgBottom: [10, 22, -8],
    bgGlow: [16, 24, -3],
    fg: [-6, 14, 0],
    subFg: [-2, 16, 2],
  },
  Summer: {
    bgTop: [16, 8, -8],
    bgBottom: [18, 10, -10],
    bgGlow: [26, 16, -8],
    fg: [8, 2, -10],
    subFg: [10, 4, -10],
  },
  Autumn: {
    bgTop: [22, -4, -16],
    bgBottom: [20, -6, -14],
    bgGlow: [30, 6, -8],
    fg: [16, -8, -14],
    subFg: [16, -6, -12],
  },
};

let currentForeground = "rgb(123 188 255)";
let currentSubForeground = "rgb(170 211 255)";
let clockText = "";
let dateText = "";

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
    name: current.name,
    bgTop: lerpColor(current.bgTop, next.bgTop, amount),
    bgBottom: lerpColor(current.bgBottom, next.bgBottom, amount),
    bgGlow: lerpColor(current.bgGlow, next.bgGlow, amount),
    fg: lerpColor(current.fg, next.fg, amount),
    subFg: lerpColor(current.subFg, next.subFg, amount),
  };
};

const resolveTheme = (minutes, date) => {
  const dayTheme = resolveDayTheme(minutes);
  const season = getSeason(date);
  const shift = SEASONAL_SHIFTS[season];

  return {
    name: `${dayTheme.name} ${season}`,
    bgTop: shiftColor(dayTheme.bgTop, shift.bgTop),
    bgBottom: shiftColor(dayTheme.bgBottom, shift.bgBottom),
    bgGlow: shiftColor(dayTheme.bgGlow, shift.bgGlow),
    fg: shiftColor(dayTheme.fg, shift.fg),
    subFg: shiftColor(dayTheme.subFg, shift.subFg),
  };
};

const applyTheme = (theme) => {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--bg-top", toRgb(theme.bgTop));
  rootStyle.setProperty("--bg-bottom", toRgb(theme.bgBottom));
  rootStyle.setProperty("--bg-glow", toRgb(theme.bgGlow, 0.45));
  rootStyle.setProperty("--fg", toRgb(theme.fg));
  rootStyle.setProperty("--fg-glow", toRgb(theme.fg, 0.6));
  rootStyle.setProperty("--label", toRgb(theme.subFg));

  currentForeground = toRgb(theme.fg);
  currentSubForeground = toRgb(theme.subFg);
  themeColorMeta.setAttribute("content", toRgb(theme.bgBottom));
  canvas.setAttribute("aria-label", `${clockText} on ${dateText}. ${theme.name}`);
};

const drawPixelText = (text, pixelSize, x, y, color) => {
  let cursorX = x;
  context.fillStyle = color;

  for (let index = 0; index < text.length; index += 1) {
    const glyph = getGlyph(text[index]);
    const glyphWidth = glyph[0].length;

    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyphWidth; column += 1) {
        if (glyph[row][column] === "1") {
          context.fillRect(
            cursorX + column * pixelSize,
            y + row * pixelSize,
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

const pickSizes = (clockMetrics, dateMetrics) => {
  const maxWidth = Math.floor(window.innerWidth * 0.95);
  const maxHeight = Math.floor(window.innerHeight * 0.82);
  const lineGapUnits = 2;
  const framePaddingUnits = 4;

  for (let mainPixel = 72; mainPixel >= 3; mainPixel -= 1) {
    const datePixel = Math.max(2, Math.floor(mainPixel * 0.36));
    const contentWidth = Math.max(
      clockMetrics.width * mainPixel,
      dateMetrics.width * datePixel
    );
    const contentHeight =
      clockMetrics.height * mainPixel +
      lineGapUnits * mainPixel +
      dateMetrics.height * datePixel;
    const totalWidth = contentWidth + framePaddingUnits * mainPixel;
    const totalHeight = contentHeight + framePaddingUnits * mainPixel;

    if (totalWidth <= maxWidth && totalHeight <= maxHeight) {
      return {
        mainPixel,
        datePixel,
        lineGap: lineGapUnits * mainPixel,
        canvasWidth: totalWidth,
        canvasHeight: totalHeight,
        contentWidth,
        contentHeight,
      };
    }
  }

  const fallbackMain = 3;
  const fallbackDate = 2;
  const contentWidth = Math.max(
    clockMetrics.width * fallbackMain,
    dateMetrics.width * fallbackDate
  );
  const contentHeight =
    clockMetrics.height * fallbackMain +
    2 * fallbackMain +
    dateMetrics.height * fallbackDate;

  return {
    mainPixel: fallbackMain,
    datePixel: fallbackDate,
    lineGap: 2 * fallbackMain,
    canvasWidth: contentWidth + 4 * fallbackMain,
    canvasHeight: contentHeight + 4 * fallbackMain,
    contentWidth,
    contentHeight,
  };
};

const drawClock = () => {
  const clockMetrics = measureTextUnits(clockText);
  const dateMetrics = measureTextUnits(dateText);
  const sizing = pickSizes(clockMetrics, dateMetrics);
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  if (
    canvas.width !== Math.floor(sizing.canvasWidth * dpr) ||
    canvas.height !== Math.floor(sizing.canvasHeight * dpr)
  ) {
    canvas.width = Math.floor(sizing.canvasWidth * dpr);
    canvas.height = Math.floor(sizing.canvasHeight * dpr);
    canvas.style.width = `${sizing.canvasWidth}px`;
    canvas.style.height = `${sizing.canvasHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
  }

  context.clearRect(0, 0, sizing.canvasWidth, sizing.canvasHeight);

  const clockWidth = clockMetrics.width * sizing.mainPixel;
  const dateWidth = dateMetrics.width * sizing.datePixel;
  const startY = Math.floor((sizing.canvasHeight - sizing.contentHeight) / 2);
  const clockX = Math.floor((sizing.canvasWidth - clockWidth) / 2);
  const dateX = Math.floor((sizing.canvasWidth - dateWidth) / 2);
  const dateY = startY + clockMetrics.height * sizing.mainPixel + sizing.lineGap;

  drawPixelText(clockText, sizing.mainPixel, clockX, startY, currentForeground);
  drawPixelText(dateText, sizing.datePixel, dateX, dateY, currentSubForeground);
};

const update = () => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = String(now.getFullYear());

  clockText = `${hour}:${minute}`;
  dateText = `${month}-${day}-${year}`;

  const minuteOfDay =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  applyTheme(resolveTheme(minuteOfDay, now));
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
