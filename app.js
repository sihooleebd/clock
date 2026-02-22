const canvas = document.getElementById("clock");
const weatherCanvas = document.getElementById("weather-layer");
const periodLabel = document.getElementById("period-label");
const dateLabel = document.getElementById("date-label");
const statusButton = document.getElementById("status-button");
const variantButton = document.getElementById("variant-button");
const weatherButton = document.getElementById("weather-button");
const themeLockButton = document.getElementById("theme-lock-button");
const themeColorMeta = document.getElementById("theme-color-meta");

if (
  !(canvas instanceof HTMLCanvasElement) ||
  !(weatherCanvas instanceof HTMLCanvasElement) ||
  !themeColorMeta
) {
  throw new Error("Required DOM nodes were not found.");
}

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Could not create 2D canvas context.");
}

const weatherContext = weatherCanvas.getContext("2d");
if (!weatherContext) {
  throw new Error("Could not create 2D weather canvas context.");
}

const MINUTES_PER_DAY = 1440;
const GLYPH_HEIGHT = 7;
const GLYPH_GAP = 1;
const VIEWPORT_REFERENCE_AREA = 1280 * 720;

const WEATHER_TYPES = {
  HEAT: "heat",
  RAIN: "rain",
  DRIZZLE: "drizzle",
  WIND: "wind",
  FOG: "fog",
  STORM: "storm",
  SNOW: "snow",
};

const WEATHER_LABELS = {
  [WEATHER_TYPES.HEAT]: "Heat",
  [WEATHER_TYPES.RAIN]: "Rain",
  [WEATHER_TYPES.DRIZZLE]: "Drizzle",
  [WEATHER_TYPES.WIND]: "Wind",
  [WEATHER_TYPES.FOG]: "Fog",
  [WEATHER_TYPES.STORM]: "Storm",
  [WEATHER_TYPES.SNOW]: "Snow",
};

const WEATHER_ORDER = [
  WEATHER_TYPES.HEAT,
  WEATHER_TYPES.RAIN,
  WEATHER_TYPES.DRIZZLE,
  WEATHER_TYPES.WIND,
  WEATHER_TYPES.FOG,
  WEATHER_TYPES.STORM,
  WEATHER_TYPES.SNOW,
];
const THEME_LOCK_STORAGE_KEY = "pixel-clock-theme-lock-v1";

const prefersReducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

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

const DAY_THEMES = [
  {
    name: "Late Night",
    startMinute: 0,
    endMinute: 239,
    bgTop: [2, 5, 17],
    bgBottom: [8, 18, 44],
    bgGlow: [32, 69, 129],
    fg: [118, 189, 255],
    label: [162, 214, 255],
  },
  {
    name: "Pre-Dawn",
    startMinute: 240,
    endMinute: 359,
    bgTop: [31, 20, 52],
    bgBottom: [62, 36, 82],
    bgGlow: [135, 78, 156],
    fg: [214, 186, 255],
    label: [228, 203, 255],
  },
  {
    name: "Sunrise",
    startMinute: 360,
    endMinute: 479,
    bgTop: [73, 34, 50],
    bgBottom: [166, 78, 62],
    bgGlow: [242, 146, 92],
    fg: [255, 224, 150],
    label: [255, 214, 182],
  },
  {
    name: "Morning",
    startMinute: 480,
    endMinute: 719,
    bgTop: [186, 228, 252],
    bgBottom: [131, 201, 240],
    bgGlow: [255, 255, 255],
    fg: [21, 76, 120],
    label: [35, 97, 142],
  },
  {
    name: "Afternoon",
    startMinute: 720,
    endMinute: 959,
    bgTop: [120, 201, 248],
    bgBottom: [85, 169, 228],
    bgGlow: [250, 244, 222],
    fg: [18, 83, 125],
    label: [33, 104, 149],
  },
  {
    name: "Sunset",
    startMinute: 960,
    endMinute: 1139,
    bgTop: [104, 49, 76],
    bgBottom: [42, 31, 74],
    bgGlow: [242, 141, 93],
    fg: [255, 186, 127],
    label: [255, 208, 175],
  },
  {
    name: "Evening",
    startMinute: 1140,
    endMinute: 1319,
    bgTop: [29, 23, 66],
    bgBottom: [11, 18, 56],
    bgGlow: [113, 102, 204],
    fg: [180, 210, 255],
    label: [206, 222, 255],
  },
  {
    name: "Night",
    startMinute: 1320,
    endMinute: 1439,
    bgTop: [3, 7, 19],
    bgBottom: [7, 15, 37],
    bgGlow: [41, 82, 130],
    fg: [102, 192, 244],
    label: [150, 214, 249],
  },
];

const DAILY_VARIANTS = [
  {
    name: "Ocean",
    warmth: "cold",
    bgTop: [-8, 10, 20],
    bgBottom: [-8, 12, 22],
    bgGlow: [-5, 18, 30],
    fg: [-6, 12, 20],
    label: [-6, 12, 20],
  },
  {
    name: "Amber",
    warmth: "warm",
    bgTop: [12, 4, -12],
    bgBottom: [14, 6, -14],
    bgGlow: [24, 8, -12],
    fg: [10, 4, -10],
    label: [10, 6, -8],
  },
  {
    name: "Rose",
    warmth: "mild",
    bgTop: [10, -4, 8],
    bgBottom: [12, -4, 10],
    bgGlow: [20, 2, 16],
    fg: [8, 0, 10],
    label: [10, 2, 10],
  },
  {
    name: "Mint",
    warmth: "mild",
    bgTop: [-6, 14, 0],
    bgBottom: [-8, 16, -2],
    bgGlow: [-4, 20, 6],
    fg: [-2, 12, 2],
    label: [0, 14, 4],
  },
  {
    name: "Violet",
    warmth: "cold",
    bgTop: [2, -4, 14],
    bgBottom: [2, -6, 18],
    bgGlow: [6, 4, 24],
    fg: [4, 2, 12],
    label: [6, 4, 14],
  },
  {
    name: "Copper",
    warmth: "warm",
    bgTop: [16, -8, -14],
    bgBottom: [18, -8, -16],
    bgGlow: [26, -2, -10],
    fg: [14, -4, -12],
    label: [15, -2, -10],
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

const state = {
  clockText: "00:00",
  foreground: "rgb(123 188 255)",
  currentTheme: null,
  themeLock: {
    enabled: false,
    minuteOfDay: null,
    season: null,
    variantIndex: null,
    weatherType: null,
  },
  weather: {
    type: WEATHER_TYPES.RAIN,
    label: WEATHER_LABELS[WEATHER_TYPES.RAIN],
    tint: [168, 204, 236],
    particles: [],
    lastFrameMs: 0,
    stormFlash: 0,
  },
};

let tickTimerId = 0;
let weatherFrameId = 0;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const normalizeMinutes = (minutes) =>
  ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
const getGlyph = (character) => GLYPHS[character] ?? GLYPHS["0"];
const getGlyphWidth = (character) => getGlyph(character)[0].length;
const pad2 = (value) => String(value).padStart(2, "0");
const randomBetween = (min, max) => min + Math.random() * (max - min);

function shiftColor(base, shift) {
  return base.map((channel, index) => clamp(channel + shift[index], 0, 255));
}

function mergeShifts(...shifts) {
  return shifts.reduce(
    (merged, shift) => merged.map((channel, index) => channel + shift[index]),
    [0, 0, 0]
  );
}

function resolveWeatherType(variantWarmth, season, dayStatus) {
  if (variantWarmth === "warm") {
    if (season === "Winter") {
      return WEATHER_TYPES.WIND;
    }
    if (season === "Summer") {
      return WEATHER_TYPES.HEAT;
    }
    return dayStatus === "Sunset" ? WEATHER_TYPES.DRIZZLE : WEATHER_TYPES.HEAT;
  }

  if (variantWarmth === "cold") {
    if (season === "Winter") {
      return WEATHER_TYPES.SNOW;
    }
    return season === "Autumn" ? WEATHER_TYPES.FOG : WEATHER_TYPES.RAIN;
  }

  if (dayStatus === "Pre-Dawn" || dayStatus === "Late Night") {
    return WEATHER_TYPES.FOG;
  }
  if (dayStatus === "Sunset") {
    return WEATHER_TYPES.DRIZZLE;
  }
  return WEATHER_TYPES.RAIN;
}

function getAllowedWeatherTypesForSeason(season) {
  if (season === "Winter") {
    return [
      WEATHER_TYPES.SNOW,
      WEATHER_TYPES.RAIN,
      WEATHER_TYPES.DRIZZLE,
      WEATHER_TYPES.FOG,
      WEATHER_TYPES.WIND,
      WEATHER_TYPES.STORM,
      WEATHER_TYPES.HEAT,
    ];
  }
  if (season === "Spring") {
    return [
      WEATHER_TYPES.RAIN,
      WEATHER_TYPES.DRIZZLE,
      WEATHER_TYPES.WIND,
      WEATHER_TYPES.FOG,
      WEATHER_TYPES.STORM,
      WEATHER_TYPES.HEAT,
    ];
  }
  if (season === "Summer") {
    return [
      WEATHER_TYPES.HEAT,
      WEATHER_TYPES.RAIN,
      WEATHER_TYPES.DRIZZLE,
      WEATHER_TYPES.WIND,
      WEATHER_TYPES.STORM,
    ];
  }
  return [
    WEATHER_TYPES.RAIN,
    WEATHER_TYPES.DRIZZLE,
    WEATHER_TYPES.WIND,
    WEATHER_TYPES.FOG,
    WEATHER_TYPES.STORM,
    WEATHER_TYPES.HEAT,
  ];
}

function isValidThemeLockState(themeLock) {
  return (
    Number.isFinite(themeLock.minuteOfDay) &&
    themeLock.minuteOfDay >= 0 &&
    themeLock.minuteOfDay < MINUTES_PER_DAY &&
    typeof themeLock.season === "string" &&
    Object.hasOwn(SEASONAL_SHIFTS, themeLock.season) &&
    Number.isInteger(themeLock.variantIndex) &&
    themeLock.variantIndex >= 0 &&
    themeLock.variantIndex < DAILY_VARIANTS.length &&
    typeof themeLock.weatherType === "string" &&
    WEATHER_ORDER.includes(themeLock.weatherType)
  );
}

function persistThemeLockState() {
  try {
    localStorage.setItem(THEME_LOCK_STORAGE_KEY, JSON.stringify(state.themeLock));
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function loadThemeLockState() {
  try {
    const raw = localStorage.getItem(THEME_LOCK_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }

    if (!parsed.enabled) {
      return;
    }

    const nextThemeLock = {
      enabled: true,
      minuteOfDay: Number(parsed.minuteOfDay),
      season: parsed.season,
      variantIndex: Number(parsed.variantIndex),
      weatherType: parsed.weatherType,
    };

    if (isValidThemeLockState(nextThemeLock)) {
      state.themeLock = nextThemeLock;
    }
  } catch {
    // Ignore malformed storage state.
  }
}

function getAutomaticVariantIndex(date) {
  return getDayOfYear(date) % DAILY_VARIANTS.length;
}

function ensureThemeLockedFromCurrent() {
  if (state.themeLock.enabled && isValidThemeLockState(state.themeLock)) {
    return;
  }

  const now = new Date();
  const fallbackTheme =
    state.currentTheme ??
    resolveTheme(
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60,
      now
    );

  state.themeLock.enabled = true;
  state.themeLock.minuteOfDay = fallbackTheme.minuteOfDay;
  state.themeLock.season = fallbackTheme.season;
  state.themeLock.variantIndex = fallbackTheme.variantIndex;
  state.themeLock.weatherType = fallbackTheme.weatherType;
  persistThemeLockState();
}

function toggleThemeLock() {
  if (state.themeLock.enabled) {
    state.themeLock.enabled = false;
    persistThemeLockState();
    return;
  }
  ensureThemeLockedFromCurrent();
}

function cycleLockedPeriod() {
  ensureThemeLockedFromCurrent();
  const minute = normalizeMinutes(state.themeLock.minuteOfDay ?? 0);
  let currentIndex = DAY_THEMES.findIndex(
    (theme) => minute >= theme.startMinute && minute <= theme.endMinute
  );

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  const next = DAY_THEMES[(currentIndex + 1) % DAY_THEMES.length];
  state.themeLock.minuteOfDay =
    next.startMinute + (next.endMinute - next.startMinute) / 2;
  persistThemeLockState();
}

function cycleLockedVariant() {
  ensureThemeLockedFromCurrent();
  let currentIndex = state.themeLock.variantIndex;
  if (
    !Number.isInteger(currentIndex) ||
    currentIndex < 0 ||
    currentIndex >= DAILY_VARIANTS.length
  ) {
    currentIndex = getAutomaticVariantIndex(new Date());
  }

  state.themeLock.variantIndex = (currentIndex + 1) % DAILY_VARIANTS.length;
  persistThemeLockState();
}

function cycleLockedWeather() {
  ensureThemeLockedFromCurrent();
  const season = state.themeLock.season || getSeason(new Date());
  const allowedTypes = getAllowedWeatherTypesForSeason(season);
  let currentIndex = allowedTypes.indexOf(state.themeLock.weatherType);
  if (currentIndex < 0) {
    currentIndex = -1;
  }

  state.themeLock.weatherType = allowedTypes[(currentIndex + 1) % allowedTypes.length];
  persistThemeLockState();
}

function resolveWeatherTint(type, colors) {
  if (type === WEATHER_TYPES.HEAT) {
    return lerpColor(colors.bgGlow, [255, 176, 92], 0.62);
  }
  if (type === WEATHER_TYPES.STORM) {
    return lerpColor(colors.bgBottom, [156, 175, 212], 0.58);
  }
  if (type === WEATHER_TYPES.FOG) {
    return lerpColor(colors.label, [204, 216, 232], 0.48);
  }
  if (type === WEATHER_TYPES.WIND) {
    return lerpColor(colors.fg, [185, 221, 244], 0.62);
  }
  if (type === WEATHER_TYPES.DRIZZLE) {
    return lerpColor(colors.fg, [166, 208, 238], 0.58);
  }
  if (type === WEATHER_TYPES.SNOW) {
    return lerpColor(colors.label, [244, 248, 255], 0.68);
  }
  return lerpColor(colors.fg, [160, 203, 238], 0.54);
}

function toRgb(channels, alpha = 1) {
  const [r, g, b] = channels.map((value) => Math.round(value));
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
}

function lerpColor(fromColor, toColor, amount) {
  return fromColor.map((channel, index) => lerp(channel, toColor[index], amount));
}

function validateThemeSchedule(themes) {
  let expectedStart = 0;
  for (const theme of themes) {
    if (theme.startMinute !== expectedStart) {
      throw new Error("Day theme schedule has a gap or overlap.");
    }
    if (theme.endMinute < theme.startMinute) {
      throw new Error("Day theme schedule contains an invalid range.");
    }
    expectedStart = theme.endMinute + 1;
  }
  if (expectedStart !== MINUTES_PER_DAY) {
    throw new Error("Day theme schedule must cover exactly 24 hours.");
  }
}

function getSeason(date) {
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
}

function getDayOfYear(date) {
  const utcDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcYearStart = Date.UTC(date.getFullYear(), 0, 1);
  return Math.floor((utcDay - utcYearStart) / 86400000);
}

function getDailyVariant(date) {
  return DAILY_VARIANTS[getDayOfYear(date) % DAILY_VARIANTS.length];
}

function updateThemeControls(theme, snapshot) {
  if (periodLabel) {
    const lockState = state.themeLock.enabled ? "Locked" : "Auto";
    periodLabel.setAttribute(
      "aria-label",
      `${snapshot.dateIso}. ${theme.status}. Variant ${theme.variant}. Weather ${theme.weatherLabel}. ${lockState}.`
    );
  }

  if (dateLabel) {
    dateLabel.textContent = snapshot.dateIso;
  }

  if (statusButton) {
    statusButton.textContent = theme.status;
    statusButton.setAttribute("aria-pressed", String(state.themeLock.enabled));
    statusButton.title = state.themeLock.enabled
      ? "Cycle locked period"
      : "Click to lock and cycle period";
  }

  if (variantButton) {
    variantButton.textContent = theme.variant;
    variantButton.setAttribute("aria-pressed", String(state.themeLock.enabled));
    variantButton.title = state.themeLock.enabled
      ? "Cycle locked variant"
      : "Click to lock and cycle variant";
  }

  if (weatherButton) {
    weatherButton.textContent = theme.weatherLabel;
    weatherButton.setAttribute("aria-pressed", String(state.themeLock.enabled));
    const options = getAllowedWeatherTypesForSeason(theme.season)
      .map((weatherType) => WEATHER_LABELS[weatherType])
      .join(" / ");
    weatherButton.title = state.themeLock.enabled
      ? `Cycle locked weather (${options})`
      : `Click to lock and cycle weather (${options})`;
  }

  if (themeLockButton) {
    themeLockButton.dataset.locked = String(state.themeLock.enabled);
    themeLockButton.setAttribute("aria-pressed", String(state.themeLock.enabled));
    themeLockButton.setAttribute(
      "aria-label",
      state.themeLock.enabled
        ? "Unlock theme automation"
        : "Lock theme to current settings"
    );
    themeLockButton.title = state.themeLock.enabled
      ? "Unlock theme automation"
      : "Lock theme to current settings";
  }
}

function setupThemeControlListeners() {
  if (statusButton) {
    statusButton.addEventListener("click", () => {
      cycleLockedPeriod();
      tick();
    });
  }

  if (variantButton) {
    variantButton.addEventListener("click", () => {
      cycleLockedVariant();
      tick();
    });
  }

  if (weatherButton) {
    weatherButton.addEventListener("click", () => {
      cycleLockedWeather();
      tick();
    });
  }

  if (themeLockButton) {
    themeLockButton.addEventListener("click", () => {
      toggleThemeLock();
      tick();
    });
  }
}

function measureTextUnits(text) {
  let width = 0;
  for (let index = 0; index < text.length; index += 1) {
    width += getGlyphWidth(text[index]);
    if (index < text.length - 1) {
      width += GLYPH_GAP;
    }
  }
  return { width, height: GLYPH_HEIGHT };
}

function resolveDayTheme(minutes) {
  const minute = normalizeMinutes(minutes);
  let currentIndex = DAY_THEMES.findIndex(
    (theme) => minute >= theme.startMinute && minute <= theme.endMinute
  );

  if (currentIndex < 0) {
    currentIndex = DAY_THEMES.length - 1;
  }

  const current = DAY_THEMES[currentIndex];
  const next = DAY_THEMES[(currentIndex + 1) % DAY_THEMES.length];
  const span = current.endMinute - current.startMinute + 1;
  const blendAmount = span > 0 ? (minute - current.startMinute) / span : 0;

  return {
    status: current.name,
    bgTop: lerpColor(current.bgTop, next.bgTop, blendAmount),
    bgBottom: lerpColor(current.bgBottom, next.bgBottom, blendAmount),
    bgGlow: lerpColor(current.bgGlow, next.bgGlow, blendAmount),
    fg: lerpColor(current.fg, next.fg, blendAmount),
    label: lerpColor(current.label, next.label, blendAmount),
  };
}

function resolveTheme(minutes, date, overrides = {}) {
  const normalizedMinutes = normalizeMinutes(minutes);
  const dayTheme = resolveDayTheme(normalizedMinutes);
  const season =
    typeof overrides.season === "string" &&
    Object.hasOwn(SEASONAL_SHIFTS, overrides.season)
      ? overrides.season
      : getSeason(date);
  const seasonalShift = SEASONAL_SHIFTS[season];
  const variantIndex =
    Number.isInteger(overrides.variantIndex) &&
    overrides.variantIndex >= 0 &&
    overrides.variantIndex < DAILY_VARIANTS.length
      ? overrides.variantIndex
      : getAutomaticVariantIndex(date);
  const variant = DAILY_VARIANTS[variantIndex];
  const cycle = (normalizedMinutes / MINUTES_PER_DAY) * Math.PI * 2;
  const fgWaveShift = [
    Math.cos(cycle) * 3,
    Math.cos(cycle * 1.1) * 2,
    Math.sin(cycle) * -4,
  ];
  const glowWaveShift = [
    Math.sin(cycle * 0.9) * 7,
    Math.sin(cycle * 1.2) * 6,
    Math.cos(cycle) * -8,
  ];
  const labelWaveShift = [
    Math.cos(cycle) * 2,
    Math.sin(cycle) * 2,
    Math.sin(cycle * 0.8) * -3,
  ];

  const seasonAdjusted = {
    bgTop: shiftColor(dayTheme.bgTop, seasonalShift.bgTop),
    bgBottom: shiftColor(dayTheme.bgBottom, seasonalShift.bgBottom),
    bgGlow: shiftColor(dayTheme.bgGlow, seasonalShift.bgGlow),
    fg: shiftColor(dayTheme.fg, seasonalShift.fg),
    label: shiftColor(dayTheme.label, seasonalShift.label),
  };

  const finalColors = {
    bgTop: shiftColor(seasonAdjusted.bgTop, variant.bgTop),
    bgBottom: shiftColor(seasonAdjusted.bgBottom, variant.bgBottom),
    bgGlow: shiftColor(
      seasonAdjusted.bgGlow,
      mergeShifts(variant.bgGlow, glowWaveShift)
    ),
    fg: shiftColor(seasonAdjusted.fg, mergeShifts(variant.fg, fgWaveShift)),
    label: shiftColor(
      seasonAdjusted.label,
      mergeShifts(variant.label, labelWaveShift)
    ),
  };
  const automaticWeatherType = resolveWeatherType(
    variant.warmth,
    season,
    dayTheme.status
  );
  const allowedWeatherTypes = getAllowedWeatherTypesForSeason(season);
  let weatherType = overrides.weatherType ?? automaticWeatherType;
  if (!allowedWeatherTypes.includes(weatherType)) {
    weatherType = automaticWeatherType;
  }

  return {
    status: dayTheme.status,
    season,
    variant: variant.name,
    variantIndex,
    minuteOfDay: normalizedMinutes,
    weatherType,
    weatherLabel: WEATHER_LABELS[weatherType],
    weatherTint: resolveWeatherTint(weatherType, finalColors),
    ...finalColors,
  };
}

function setThemeCssVariables(theme) {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--bg-top", toRgb(theme.bgTop));
  rootStyle.setProperty("--bg-bottom", toRgb(theme.bgBottom));
  rootStyle.setProperty("--bg-glow", toRgb(theme.bgGlow, 0.45));
  rootStyle.setProperty(
    "--bg-glow-soft",
    toRgb(lerpColor(theme.bgTop, theme.bgGlow, 0.55), 0.24)
  );
  rootStyle.setProperty("--fg", toRgb(theme.fg));
  rootStyle.setProperty("--fg-glow", toRgb(theme.fg, 0.6));
  rootStyle.setProperty("--label", toRgb(theme.label));
}

function applyTheme(theme, snapshot) {
  setThemeCssVariables(theme);
  state.foreground = toRgb(theme.fg);
  state.currentTheme = theme;
  themeColorMeta.setAttribute("content", toRgb(theme.bgBottom));
  updateWeatherTheme(theme);
  updateThemeControls(theme, snapshot);

  canvas.setAttribute(
    "aria-label",
    `${snapshot.clockText} on ${snapshot.dateIso}. ${theme.status} ${theme.variant} ${theme.season}. Weather ${theme.weatherLabel}`
  );
}

function createTimeSnapshot(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();

  return {
    clockText: `${pad2(hour)}:${pad2(minute)}`,
    dateIso: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
      date.getDate()
    )}`,
    minuteOfDay: hour * 60 + minute + date.getSeconds() / 60,
  };
}

function getClockLayout(text) {
  const metrics = measureTextUnits(text);
  const maxWidth = Math.floor(window.innerWidth * 0.94);
  const maxHeight = Math.floor(window.innerHeight * 0.66);
  const pixelSize = Math.max(
    3,
    Math.floor(
      Math.min(maxWidth / (metrics.width + 4), maxHeight / (metrics.height + 4))
    )
  );

  return {
    pixelSize,
    width: (metrics.width + 4) * pixelSize,
    height: (metrics.height + 4) * pixelSize,
  };
}

function syncCanvasSize(layout) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const targetWidth = Math.floor(layout.width * dpr);
  const targetHeight = Math.floor(layout.height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
  }
}

function drawText(text, pixelSize, canvasWidth, canvasHeight) {
  const { width: unitWidth, height: unitHeight } = measureTextUnits(text);
  const totalWidth = unitWidth * pixelSize;
  const totalHeight = unitHeight * pixelSize;
  const offsetX = Math.floor((canvasWidth - totalWidth) / 2);
  const offsetY = Math.floor((canvasHeight - totalHeight) / 2);
  let cursorX = offsetX;

  context.fillStyle = state.foreground;

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
}

function drawClock(text) {
  const layout = getClockLayout(text);
  syncCanvasSize(layout);
  context.clearRect(0, 0, layout.width, layout.height);
  drawText(text, layout.pixelSize, layout.width, layout.height);
}

function syncWeatherCanvasSize() {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const targetWidth = Math.floor(width * dpr);
  const targetHeight = Math.floor(height * dpr);

  if (
    weatherCanvas.width !== targetWidth ||
    weatherCanvas.height !== targetHeight
  ) {
    weatherCanvas.width = targetWidth;
    weatherCanvas.height = targetHeight;
    weatherCanvas.style.width = `${width}px`;
    weatherCanvas.style.height = `${height}px`;
    weatherContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return { width, height };
}

function getWeatherParticleCount(type, width, height) {
  const density = clamp((width * height) / VIEWPORT_REFERENCE_AREA, 0.6, 2.3);
  if (type === WEATHER_TYPES.HEAT) {
    return Math.max(42, Math.round(58 * density));
  }
  if (type === WEATHER_TYPES.FOG) {
    return Math.max(22, Math.round(32 * density));
  }
  if (type === WEATHER_TYPES.WIND) {
    return Math.max(32, Math.round(46 * density));
  }
  if (type === WEATHER_TYPES.DRIZZLE) {
    return Math.max(54, Math.round(74 * density));
  }
  if (type === WEATHER_TYPES.STORM) {
    return Math.max(120, Math.round(170 * density));
  }
  if (type === WEATHER_TYPES.SNOW) {
    return Math.max(70, Math.round(96 * density));
  }
  return Math.max(92, Math.round(126 * density));
}

function createRainParticle(width, height, spawnAbove = false) {
  return {
    x: randomBetween(-80, width + 80),
    y: spawnAbove ? randomBetween(-height * 0.35, -4) : randomBetween(0, height),
    vx: randomBetween(-175, -85),
    vy: randomBetween(510, 860),
    length: randomBetween(12, 26),
    thickness: randomBetween(0.8, 1.7),
    opacity: randomBetween(0.2, 0.62),
  };
}

function createDrizzleParticle(width, height, spawnAbove = false) {
  return {
    x: randomBetween(-70, width + 70),
    y: spawnAbove ? randomBetween(-height * 0.22, -4) : randomBetween(0, height),
    vx: randomBetween(-95, -35),
    vy: randomBetween(240, 420),
    length: randomBetween(8, 15),
    thickness: randomBetween(0.7, 1.3),
    opacity: randomBetween(0.12, 0.36),
  };
}

function createStormParticle(width, height, spawnAbove = false) {
  return {
    x: randomBetween(-90, width + 90),
    y: spawnAbove ? randomBetween(-height * 0.38, -8) : randomBetween(0, height),
    vx: randomBetween(-255, -125),
    vy: randomBetween(760, 1120),
    length: randomBetween(18, 34),
    thickness: randomBetween(1.1, 2.2),
    opacity: randomBetween(0.25, 0.72),
  };
}

function createSnowParticle(width, height, spawnAbove = false) {
  return {
    x: randomBetween(0, width),
    y: spawnAbove ? randomBetween(-height * 0.22, -4) : randomBetween(0, height),
    vx: randomBetween(-20, 20),
    vy: randomBetween(24, 68),
    size: randomBetween(1.1, 3.1),
    phase: randomBetween(0, Math.PI * 2),
    phaseRate: randomBetween(0.6, 2.1),
    opacity: randomBetween(0.28, 0.82),
  };
}

function createWindParticle(width, height, spawnLeft = false) {
  return {
    x: spawnLeft ? randomBetween(-180, -20) : randomBetween(0, width),
    y: randomBetween(0, height),
    vx: randomBetween(220, 510),
    length: randomBetween(40, 112),
    thickness: randomBetween(0.8, 2.3),
    opacity: randomBetween(0.08, 0.3),
    phase: randomBetween(0, Math.PI * 2),
    phaseRate: randomBetween(1.2, 2.8),
    sway: randomBetween(8, 24),
  };
}

function createFogParticle(width, height, spawnLeft = false) {
  const depth = randomBetween(0.28, 1);
  const radius = randomBetween(58, 190) * (0.72 + depth * 0.42);
  return {
    x: spawnLeft ? randomBetween(-320, -90) : randomBetween(-180, width + 180),
    y: randomBetween(height * 0.08, height * 0.96),
    vx: randomBetween(8, 30) * (0.4 + depth * 0.7),
    radius,
    radiusY: radius * randomBetween(0.5, 0.84),
    depth,
    opacity: randomBetween(0.02, 0.11) * (0.45 + depth * 0.9),
    phase: randomBetween(0, Math.PI * 2),
    phaseRate: randomBetween(0.22, 0.95),
    drift: randomBetween(4, 18) * (0.45 + depth * 0.9),
    wobble: randomBetween(4, 22),
    shimmer: randomBetween(0.8, 2.2),
  };
}

function createHeatParticle(width, height, spawnBelow = false) {
  return {
    x: randomBetween(-80, width + 80),
    y: spawnBelow ? randomBetween(height + 12, height + 130) : randomBetween(0, height),
    vy: randomBetween(20, 56),
    width: randomBetween(36, 108),
    height: randomBetween(1.2, 4.8),
    phase: randomBetween(0, Math.PI * 2),
    phaseRate: randomBetween(1.6, 3.8),
    drift: randomBetween(10, 34),
    wobble: randomBetween(5, 20),
    opacity: randomBetween(0.06, 0.22),
  };
}

function createWeatherParticles(type, width, height) {
  const count = getWeatherParticleCount(type, width, height);
  const particles = new Array(count);

  for (let index = 0; index < count; index += 1) {
    if (type === WEATHER_TYPES.HEAT) {
      particles[index] = createHeatParticle(width, height);
    } else if (type === WEATHER_TYPES.FOG) {
      particles[index] = createFogParticle(width, height);
    } else if (type === WEATHER_TYPES.WIND) {
      particles[index] = createWindParticle(width, height);
    } else if (type === WEATHER_TYPES.DRIZZLE) {
      particles[index] = createDrizzleParticle(width, height);
    } else if (type === WEATHER_TYPES.STORM) {
      particles[index] = createStormParticle(width, height);
    } else if (type === WEATHER_TYPES.SNOW) {
      particles[index] = createSnowParticle(width, height);
    } else {
      particles[index] = createRainParticle(width, height);
    }
  }

  return particles;
}

function updateWeatherTheme(theme) {
  const viewport = syncWeatherCanvasSize();
  const weatherChanged = state.weather.type !== theme.weatherType;
  const needsParticles = state.weather.particles.length === 0;

  state.weather.type = theme.weatherType;
  state.weather.label = theme.weatherLabel;
  state.weather.tint = theme.weatherTint;

  if (weatherChanged || needsParticles) {
    state.weather.stormFlash = 0;
    state.weather.particles = createWeatherParticles(
      theme.weatherType,
      viewport.width,
      viewport.height
    );
  }
}

function drawWeatherOverlay(width, height, tint, alpha) {
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const gradient = weatherContext.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `rgb(${r} ${g} ${b} / ${alpha * 0.36})`);
  gradient.addColorStop(1, `rgb(${r} ${g} ${b} / ${alpha})`);
  weatherContext.fillStyle = gradient;
  weatherContext.fillRect(0, 0, width, height);
}

function drawRainLikeParticles(
  dt,
  width,
  height,
  tint,
  {
    overlayAlpha,
    strokeAlpha,
    trailScale,
    respawnParticle,
    flashChance = 0,
    flashFadeRate = 0,
    flashMin = 0,
    flashMax = 0,
  }
) {
  drawWeatherOverlay(width, height, tint, overlayAlpha);
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const particles = state.weather.particles;

  weatherContext.strokeStyle = `rgb(${r} ${g} ${b} / ${strokeAlpha})`;
  weatherContext.lineCap = "round";

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    if (
      particle.y - particle.length > height ||
      particle.x < -140 ||
      particle.x > width + 140
    ) {
      particles[index] = respawnParticle(width, height, true);
      continue;
    }

    weatherContext.globalAlpha = particle.opacity;
    weatherContext.lineWidth = particle.thickness;
    weatherContext.beginPath();
    weatherContext.moveTo(particle.x, particle.y);
    weatherContext.lineTo(
      particle.x - particle.vx * trailScale,
      particle.y - particle.length
    );
    weatherContext.stroke();
  }

  weatherContext.globalAlpha = 1;

  if (flashChance > 0 && Math.random() < dt * flashChance) {
    state.weather.stormFlash = randomBetween(flashMin, flashMax);
  }
  if (state.weather.stormFlash > 0) {
    state.weather.stormFlash = Math.max(
      0,
      state.weather.stormFlash - dt * flashFadeRate
    );
    weatherContext.fillStyle = `rgb(248 252 255 / ${state.weather.stormFlash})`;
    weatherContext.fillRect(0, 0, width, height);
  }
}

function drawRainParticles(dt, width, height, tint) {
  drawRainLikeParticles(dt, width, height, tint, {
    overlayAlpha: 0.08,
    strokeAlpha: 0.56,
    trailScale: 0.045,
    respawnParticle: createRainParticle,
  });
}

function drawDrizzleParticles(dt, width, height, tint) {
  drawRainLikeParticles(dt, width, height, tint, {
    overlayAlpha: 0.05,
    strokeAlpha: 0.34,
    trailScale: 0.038,
    respawnParticle: createDrizzleParticle,
  });
}

function drawStormParticles(dt, width, height, tint) {
  drawRainLikeParticles(dt, width, height, tint, {
    overlayAlpha: 0.14,
    strokeAlpha: 0.74,
    trailScale: 0.052,
    respawnParticle: createStormParticle,
    flashChance: 0.46,
    flashFadeRate: 1.1,
    flashMin: 0.14,
    flashMax: 0.34,
  });
}

function drawSnowParticles(dt, width, height, tint) {
  drawWeatherOverlay(width, height, tint, 0.11);
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const particles = state.weather.particles;

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    particle.phase += particle.phaseRate * dt;
    particle.x += (particle.vx + Math.sin(particle.phase) * 18) * dt;
    particle.y += particle.vy * dt;

    if (particle.y - particle.size > height + 18) {
      particles[index] = createSnowParticle(width, height, true);
      continue;
    }
    if (particle.x < -24) {
      particle.x = width + randomBetween(2, 30);
    } else if (particle.x > width + 24) {
      particle.x = -randomBetween(2, 30);
    }

    weatherContext.fillStyle = `rgb(${r} ${g} ${b} / ${particle.opacity})`;
    weatherContext.beginPath();
    weatherContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    weatherContext.fill();
  }
}

function drawHeatParticles(dt, width, height, tint) {
  drawWeatherOverlay(width, height, tint, 0.06);
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const particles = state.weather.particles;

  weatherContext.globalCompositeOperation = "screen";

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    particle.phase += particle.phaseRate * dt;
    particle.x += Math.sin(particle.phase) * particle.drift * dt;
    particle.y -= particle.vy * dt;

    if (
      particle.y + particle.height < -8 ||
      particle.x < -180 ||
      particle.x > width + 180
    ) {
      particles[index] = createHeatParticle(width, height, true);
      continue;
    }

    const wobble = Math.sin(particle.phase * 1.85) * particle.wobble;
    const pulse = 1 + Math.sin(particle.phase * 1.35) * 0.24;
    weatherContext.fillStyle = `rgb(${r} ${g} ${b} / ${particle.opacity})`;
    weatherContext.fillRect(
      particle.x + wobble,
      particle.y,
      particle.width * pulse,
      particle.height
    );
  }

  weatherContext.globalCompositeOperation = "source-over";
}

function drawWindParticles(dt, width, height, tint) {
  drawWeatherOverlay(width, height, tint, 0.045);
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const particles = state.weather.particles;

  weatherContext.strokeStyle = `rgb(${r} ${g} ${b} / 0.26)`;
  weatherContext.lineCap = "round";

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    particle.phase += particle.phaseRate * dt;
    particle.x += particle.vx * dt;
    particle.y += Math.sin(particle.phase) * particle.sway * dt;

    if (particle.x - particle.length > width + 70) {
      particles[index] = createWindParticle(width, height, true);
      continue;
    }
    if (particle.y < -12) {
      particle.y = height + 12;
    } else if (particle.y > height + 12) {
      particle.y = -12;
    }

    weatherContext.globalAlpha = particle.opacity;
    weatherContext.lineWidth = particle.thickness;
    weatherContext.beginPath();
    weatherContext.moveTo(particle.x, particle.y);
    weatherContext.lineTo(particle.x - particle.length, particle.y);
    weatherContext.stroke();
  }

  weatherContext.globalAlpha = 1;
}

function drawFogParticles(dt, width, height, tint) {
  drawWeatherOverlay(width, height, tint, 0.18);
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const particles = state.weather.particles;

  // Layered horizontal mist bands to avoid isolated bubble-like puffs.
  const horizonGlow = weatherContext.createLinearGradient(0, 0, 0, height);
  horizonGlow.addColorStop(0, `rgb(${r} ${g} ${b} / 0.04)`);
  horizonGlow.addColorStop(0.48, `rgb(${r} ${g} ${b} / 0.16)`);
  horizonGlow.addColorStop(1, `rgb(${r} ${g} ${b} / 0.19)`);
  weatherContext.fillStyle = horizonGlow;
  weatherContext.fillRect(0, 0, width, height);

  weatherContext.globalCompositeOperation = "screen";
  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    particle.phase += particle.phaseRate * dt;
    particle.x += particle.vx * dt;
    particle.y += Math.sin(particle.phase) * particle.drift * dt;

    if (particle.x - particle.radius > width + 320) {
      particles[index] = createFogParticle(width, height, true);
      continue;
    }
    if (particle.y < -90) {
      particle.y = height + 90;
    } else if (particle.y > height + 90) {
      particle.y = -90;
    }

    const driftX = Math.sin(particle.phase * 0.55) * particle.wobble;
    const driftY = Math.cos(particle.phase * 0.72) * particle.wobble * 0.4;
    const radiusX = particle.radius * (0.92 + Math.sin(particle.phase * 0.45) * 0.07);
    const radiusY = particle.radiusY * (0.9 + Math.cos(particle.phase * 0.58) * 0.06);
    const puffAlpha =
      particle.opacity * (0.82 + Math.sin(particle.phase * particle.shimmer) * 0.22);
    const gradient = weatherContext.createRadialGradient(
      particle.x + driftX,
      particle.y + driftY,
      radiusX * 0.16,
      particle.x + driftX,
      particle.y + driftY,
      radiusX
    );
    gradient.addColorStop(0, `rgb(${r} ${g} ${b} / ${puffAlpha * 1.05})`);
    gradient.addColorStop(0.42, `rgb(${r} ${g} ${b} / ${puffAlpha * 0.52})`);
    gradient.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);

    weatherContext.fillStyle = gradient;
    weatherContext.beginPath();
    weatherContext.ellipse(
      particle.x + driftX,
      particle.y + driftY,
      radiusX * 1.18,
      radiusY,
      0,
      0,
      Math.PI * 2
    );
    weatherContext.fill();
  }

  // Add wispy top drift pass for atmospheric depth.
  weatherContext.globalCompositeOperation = "soft-light";
  const ribbonCount = 4;
  for (let index = 0; index < ribbonCount; index += 1) {
    const phase = (performance.now() / 1000) * (0.07 + index * 0.02);
    const y = height * (0.2 + index * 0.16) + Math.sin(phase) * (10 + index * 6);
    const ribbon = weatherContext.createLinearGradient(0, y - 34, 0, y + 34);
    ribbon.addColorStop(0, `rgb(${r} ${g} ${b} / 0)`);
    ribbon.addColorStop(0.5, `rgb(${r} ${g} ${b} / ${0.05 + index * 0.012})`);
    ribbon.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
    weatherContext.fillStyle = ribbon;
    weatherContext.fillRect(0, y - 34, width, 68);
  }

  weatherContext.globalCompositeOperation = "source-over";
}

function renderWeatherFrame(timestamp) {
  const { width, height } = syncWeatherCanvasSize();
  const dt = state.weather.lastFrameMs
    ? Math.min((timestamp - state.weather.lastFrameMs) / 1000, 0.05)
    : 1 / 60;
  state.weather.lastFrameMs = timestamp;

  weatherContext.clearRect(0, 0, width, height);

  if (prefersReducedMotionQuery.matches) {
    drawWeatherOverlay(width, height, state.weather.tint, 0.09);
  } else if (state.weather.type === WEATHER_TYPES.SNOW) {
    drawSnowParticles(dt, width, height, state.weather.tint);
  } else if (state.weather.type === WEATHER_TYPES.DRIZZLE) {
    drawDrizzleParticles(dt, width, height, state.weather.tint);
  } else if (state.weather.type === WEATHER_TYPES.WIND) {
    drawWindParticles(dt, width, height, state.weather.tint);
  } else if (state.weather.type === WEATHER_TYPES.FOG) {
    drawFogParticles(dt, width, height, state.weather.tint);
  } else if (state.weather.type === WEATHER_TYPES.STORM) {
    drawStormParticles(dt, width, height, state.weather.tint);
  } else if (state.weather.type === WEATHER_TYPES.HEAT) {
    drawHeatParticles(dt, width, height, state.weather.tint);
  } else {
    drawRainParticles(dt, width, height, state.weather.tint);
  }

  weatherFrameId = window.requestAnimationFrame(renderWeatherFrame);
}

function startWeatherAnimation() {
  if (weatherFrameId) {
    return;
  }

  const viewport = syncWeatherCanvasSize();
  if (state.weather.particles.length === 0) {
    state.weather.particles = createWeatherParticles(
      state.weather.type,
      viewport.width,
      viewport.height
    );
  }
  weatherFrameId = window.requestAnimationFrame(renderWeatherFrame);
}

function scheduleNextTick() {
  const wait = 1000 - (Date.now() % 1000);
  window.clearTimeout(tickTimerId);
  tickTimerId = window.setTimeout(tick, wait + 12);
}

function resolveActiveTheme(now, snapshot) {
  if (!state.themeLock.enabled) {
    return resolveTheme(snapshot.minuteOfDay, now);
  }

  if (!isValidThemeLockState(state.themeLock)) {
    state.themeLock.enabled = false;
    persistThemeLockState();
    return resolveTheme(snapshot.minuteOfDay, now);
  }

  const allowedWeatherTypes = getAllowedWeatherTypesForSeason(state.themeLock.season);
  if (!allowedWeatherTypes.includes(state.themeLock.weatherType)) {
    state.themeLock.weatherType = allowedWeatherTypes[0];
    persistThemeLockState();
  }

  return resolveTheme(state.themeLock.minuteOfDay, now, {
    season: state.themeLock.season,
    variantIndex: state.themeLock.variantIndex,
    weatherType: state.themeLock.weatherType,
  });
}

function tick() {
  const now = new Date();
  const snapshot = createTimeSnapshot(now);
  state.clockText = snapshot.clockText;

  const theme = resolveActiveTheme(now, snapshot);
  applyTheme(theme, snapshot);
  drawClock(snapshot.clockText);
  scheduleNextTick();
}

validateThemeSchedule(DAY_THEMES);
loadThemeLockState();
setupThemeControlListeners();

window.addEventListener("resize", () => {
  drawClock(state.clockText);
  const viewport = syncWeatherCanvasSize();
  state.weather.particles = createWeatherParticles(
    state.weather.type,
    viewport.width,
    viewport.height
  );
  state.weather.lastFrameMs = 0;
});

if (typeof prefersReducedMotionQuery.addEventListener === "function") {
  prefersReducedMotionQuery.addEventListener("change", () => {
    state.weather.lastFrameMs = 0;
  });
} else if (typeof prefersReducedMotionQuery.addListener === "function") {
  prefersReducedMotionQuery.addListener(() => {
    state.weather.lastFrameMs = 0;
  });
}

startWeatherAnimation();
tick();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // App works without a service worker. Ignore registration issues.
    });
  });
}
