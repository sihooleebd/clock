const canvas = document.getElementById("clock");
const skyCanvas = document.getElementById("sky-layer");
const weatherCanvas = document.getElementById("weather-layer");
const periodLabel = document.getElementById("period-label");
const dateLabel = document.getElementById("date-label");
const statusLabel = document.getElementById("status-label");
const variantButton = document.getElementById("variant-button");
const weatherButton = document.getElementById("weather-button");
const themeLockButton = document.getElementById("theme-lock-button");
const lockStateLabel = document.getElementById("lock-state-label");
const cinematicToggleButton = document.getElementById("cinematic-toggle");
const settingsShell = document.getElementById("settings-shell");
const settingsToggleButton = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const themeColorMeta = document.getElementById("theme-color-meta");

if (
  !(canvas instanceof HTMLCanvasElement) ||
  !(skyCanvas instanceof HTMLCanvasElement) ||
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

const skyContext = skyCanvas.getContext("2d");
if (!skyContext) {
  throw new Error("Could not create 2D sky canvas context.");
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
const SEASON_ORDER = ["Winter", "Spring", "Summer", "Autumn"];
const CINEMATIC_EVENT_PRESETS = [
  {
    key: "shooting-stars",
    label: "Shooting Stars",
    minuteOfDay: 75,
    season: "Autumn",
    weatherType: WEATHER_TYPES.WIND,
  },
  {
    key: "winter-aurora",
    label: "Winter Aurora",
    minuteOfDay: 110,
    season: "Winter",
    weatherType: WEATHER_TYPES.WIND,
  },
  {
    key: "summer-fireflies",
    label: "Summer Fireflies",
    minuteOfDay: 1280,
    season: "Summer",
    weatherType: WEATHER_TYPES.HEAT,
  },
  {
    key: "storm-lightning",
    label: "Storm Lightning",
    minuteOfDay: 1320,
    season: "Spring",
    weatherType: WEATHER_TYPES.STORM,
  },
  {
    key: "film-vignette",
    label: "Film Grain + Vignette",
    minuteOfDay: 1100,
    season: "Autumn",
    weatherType: WEATHER_TYPES.DRIZZLE,
  },
  {
    key: "horizon-depth",
    label: "Horizon Depth",
    minuteOfDay: 980,
    season: "Spring",
    weatherType: WEATHER_TYPES.WIND,
  },
];
const CINEMATIC_STORAGE_KEY = "pixel-clock-cinematic-v1";
const DEV_EVENT_WINDOW_MS = 6000;

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
    variantIndex: null,
    weatherType: null,
  },
  weather: {
    type: WEATHER_TYPES.RAIN,
    label: WEATHER_LABELS[WEATHER_TYPES.RAIN],
    tint: [168, 204, 236],
    overlayStrength: 1,
    particleStrength: 1,
    particles: [],
    lastFrameMs: 0,
    stormFlash: 0,
  },
  sky: {
    stars: [],
    fireflies: [],
    shootingStars: [],
    nextShootingStarAtSec: 0,
    lightningStrength: 0,
    lightningPath: [],
    nextLightningAtSec: 0,
    lastFrameMs: 0,
    filmGrainCanvas: null,
    filmGrainContext: null,
    filmGrainPattern: null,
    filmGrainLastRefreshMs: 0,
  },
  cinematic: {
    enabled: true,
  },
  debug: {
    enabled: false,
    flushTimerId: 0,
    eventBuffer: [],
    overrideMinuteOfDay: null,
    overrideSeason: null,
    overrideCinematicEventIndex: null,
    cinematicCycleTimerId: 0,
    cinematicCycleIntervalMs: 0,
    restoreCinematicEnabled: null,
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
    Number.isInteger(themeLock.variantIndex) &&
    themeLock.variantIndex >= 0 &&
    themeLock.variantIndex < DAILY_VARIANTS.length &&
    typeof themeLock.weatherType === "string" &&
    WEATHER_ORDER.includes(themeLock.weatherType)
  );
}

function persistThemeLockState() {
  // Lock state is intentionally session-scoped.
}

function loadThemeLockState() {
  state.themeLock.enabled = false;
}

function persistCinematicState() {
  try {
    localStorage.setItem(
      CINEMATIC_STORAGE_KEY,
      JSON.stringify({ enabled: state.cinematic.enabled })
    );
  } catch {
    // Ignore storage issues in private mode or restricted contexts.
  }
}

function loadCinematicState() {
  try {
    const raw = localStorage.getItem(CINEMATIC_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.enabled === "boolean") {
      state.cinematic.enabled = parsed.enabled;
    }
  } catch {
    // Ignore malformed storage values.
  }
}

function toggleCinematicMode() {
  state.cinematic.enabled = !state.cinematic.enabled;
  persistCinematicState();
  recordDeveloperEvent("cinematic-toggle", {
    enabled: state.cinematic.enabled,
  });
}

function recordDeveloperEvent(type, details = {}) {
  if (!state.debug.enabled) {
    return;
  }

  const event = {
    time: new Date().toISOString(),
    type,
    ...details,
  };
  state.debug.eventBuffer.push(event);

  if (state.debug.eventBuffer.length > 420) {
    state.debug.eventBuffer.splice(0, state.debug.eventBuffer.length - 420);
  }
}

function flushDeveloperEvents(reason = "interval") {
  if (state.debug.eventBuffer.length === 0) {
    return [];
  }

  const events = state.debug.eventBuffer.splice(0, state.debug.eventBuffer.length);
  const label = `[DEV ${reason}] ${events.length} event${
    events.length === 1 ? "" : "s"
  }`;

  if (typeof console.groupCollapsed === "function") {
    console.groupCollapsed(label);
    if (typeof console.table === "function") {
      console.table(events);
    } else {
      console.log(events);
    }
    console.groupEnd();
  } else {
    console.log(label, events);
  }

  return events;
}

function setDeveloperMode(enabled = true) {
  const shouldEnable = Boolean(enabled);

  if (shouldEnable === state.debug.enabled) {
    return state.debug.enabled;
  }

  if (shouldEnable) {
    state.debug.enabled = true;
    state.debug.eventBuffer = [];
    if (state.debug.flushTimerId) {
      window.clearInterval(state.debug.flushTimerId);
    }
    state.debug.flushTimerId = window.setInterval(() => {
      flushDeveloperEvents("6s");
    }, DEV_EVENT_WINDOW_MS);
    console.info(
      `[DEV] enabled. Batch logging every ${Math.round(
        DEV_EVENT_WINDOW_MS / 1000
      )}s.`
    );
    recordDeveloperEvent("dev-mode-enabled", {
      windowSeconds: Math.round(DEV_EVENT_WINDOW_MS / 1000),
    });
    return true;
  }

  recordDeveloperEvent("dev-mode-disabled");
  flushDeveloperEvents("final");
  state.debug.enabled = false;
  if (state.debug.flushTimerId) {
    window.clearInterval(state.debug.flushTimerId);
    state.debug.flushTimerId = 0;
  }
  console.info("[DEV] disabled.");
  return false;
}

function getCinematicEventPreset(index) {
  if (!Number.isInteger(index) || index < 0 || index >= CINEMATIC_EVENT_PRESETS.length) {
    return null;
  }
  return CINEMATIC_EVENT_PRESETS[index];
}

function getActiveCinematicEvent() {
  return getCinematicEventPreset(state.debug.overrideCinematicEventIndex);
}

function isCinematicEventForced(eventKey) {
  const activeEvent = getActiveCinematicEvent();
  return Boolean(activeEvent && activeEvent.key === eventKey);
}

function resetCinematicEventArtifacts() {
  state.sky.shootingStars = [];
  state.sky.nextShootingStarAtSec = 0;
  state.sky.lightningStrength = 0;
  state.sky.lightningPath = [];
  state.sky.nextLightningAtSec = 0;
}

function ensureCinematicDebugFxEnabled() {
  if (state.cinematic.enabled) {
    return;
  }
  if (state.debug.restoreCinematicEnabled === null) {
    state.debug.restoreCinematicEnabled = false;
  }
  state.cinematic.enabled = true;
}

function maybeRestoreCinematicDebugFxState() {
  if (state.debug.restoreCinematicEnabled === false) {
    state.cinematic.enabled = false;
  }
  state.debug.restoreCinematicEnabled = null;
}

function applyCinematicEventPreset(index) {
  const preset = getCinematicEventPreset(index);
  if (!preset) {
    throw new Error(
      `setCinematicEvent expects 0 or 1-${CINEMATIC_EVENT_PRESETS.length}.`
    );
  }

  ensureCinematicDebugFxEnabled();
  state.debug.overrideCinematicEventIndex = index;
  resetCinematicEventArtifacts();

  const { width, height } = syncSkyCanvasSize();
  if (preset.key === "shooting-stars") {
    state.sky.shootingStars = [
      createShootingStar(width, height),
      createShootingStar(width, height),
    ];
    state.sky.nextShootingStarAtSec = 0;
  } else if (preset.key === "storm-lightning") {
    state.sky.lightningStrength = randomBetween(0.68, 0.96);
    state.sky.lightningPath = createLightningPath(width, height);
    state.sky.nextLightningAtSec = 0;
  } else if (preset.key === "summer-fireflies") {
    ensureSkyFireflies(width, height);
  } else if (preset.key === "film-vignette") {
    ensureFilmGrainResources();
  }

  return preset;
}

function stopCinematicEventsInternal(clearOverride = true) {
  if (state.debug.cinematicCycleTimerId) {
    window.clearInterval(state.debug.cinematicCycleTimerId);
    state.debug.cinematicCycleTimerId = 0;
  }
  state.debug.cinematicCycleIntervalMs = 0;

  if (clearOverride) {
    state.debug.overrideCinematicEventIndex = null;
    resetCinematicEventArtifacts();
    maybeRestoreCinematicDebugFxState();
  }

  recordDeveloperEvent("cinematic-event-cycle-stop", {
    clearOverride,
  });

  return {
    cycling: false,
    mode: clearOverride ? "auto" : "stopped",
  };
}

function setCinematicEvent(value) {
  const index = Number(value);
  if (!Number.isFinite(index)) {
    throw new Error(
      `setCinematicEvent expects 0 or 1-${CINEMATIC_EVENT_PRESETS.length}.`
    );
  }

  const normalizedIndex = Math.trunc(index);
  stopCinematicEventsInternal(false);

  if (normalizedIndex === 0) {
    state.debug.overrideCinematicEventIndex = null;
    resetCinematicEventArtifacts();
    maybeRestoreCinematicDebugFxState();
    recordDeveloperEvent("cinematic-event-override-cleared");
    tick();
    return { mode: "auto" };
  }

  if (normalizedIndex < 1 || normalizedIndex > CINEMATIC_EVENT_PRESETS.length) {
    throw new Error(
      `setCinematicEvent expects 0 or 1-${CINEMATIC_EVENT_PRESETS.length}.`
    );
  }

  const preset = applyCinematicEventPreset(normalizedIndex - 1);
  recordDeveloperEvent("cinematic-event-override", {
    index: normalizedIndex,
    key: preset.key,
    label: preset.label,
  });
  tick();
  return {
    index: normalizedIndex,
    key: preset.key,
    label: preset.label,
  };
}

function forceShootingStar(value = 1) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error("forceShootingStar expects a positive number.");
  }

  const count = Math.max(1, Math.trunc(parsedValue));
  const { width, height } = syncSkyCanvasSize();

  for (let index = 0; index < count; index += 1) {
    state.sky.shootingStars.push(createShootingStar(width, height, true));
  }
  state.sky.nextShootingStarAtSec = 0;

  recordDeveloperEvent("shooting-star-force-trigger", {
    count,
    active: state.sky.shootingStars.length,
  });

  tick();
  return {
    spawned: count,
    active: state.sky.shootingStars.length,
  };
}

function cycleCinematicEvents(intervalSeconds = 6) {
  const rawSeconds = Number(intervalSeconds);
  if (!Number.isFinite(rawSeconds)) {
    throw new Error("cycleCinematicEvents expects a number of seconds.");
  }

  if (rawSeconds <= 0) {
    const result = stopCinematicEventsInternal(true);
    recordDeveloperEvent("cinematic-event-cycle-cleared");
    tick();
    return result;
  }

  stopCinematicEventsInternal(false);
  ensureCinematicDebugFxEnabled();

  const intervalMs = Math.max(1000, Math.round(rawSeconds * 1000));
  state.debug.cinematicCycleIntervalMs = intervalMs;
  const intervalSecondsRounded = Number((intervalMs / 1000).toFixed(2));

  const step = () => {
    const currentIndex = Number.isInteger(state.debug.overrideCinematicEventIndex)
      ? state.debug.overrideCinematicEventIndex
      : -1;
    const nextIndex = (currentIndex + 1) % CINEMATIC_EVENT_PRESETS.length;
    const preset = applyCinematicEventPreset(nextIndex);
    recordDeveloperEvent("cinematic-event-cycle-step", {
      index: nextIndex + 1,
      key: preset.key,
      label: preset.label,
      intervalSeconds: intervalSecondsRounded,
    });
    tick();
    return preset;
  };

  const firstPreset = step();
  state.debug.cinematicCycleTimerId = window.setInterval(step, intervalMs);
  recordDeveloperEvent("cinematic-event-cycle-start", {
    intervalSeconds: intervalSecondsRounded,
    scenes: CINEMATIC_EVENT_PRESETS.length,
  });
  console.info(
    `[DEV] cycling cinematic events every ${intervalSecondsRounded}s (${CINEMATIC_EVENT_PRESETS.length} scenes).`
  );

  return {
    mode: "cycling",
    intervalSeconds: intervalSecondsRounded,
    current: firstPreset.label,
    scenes: CINEMATIC_EVENT_PRESETS.map((preset, index) => `${index + 1}: ${preset.label}`),
  };
}

function clearDebugOverrides() {
  stopCinematicEventsInternal(true);
  state.debug.overrideMinuteOfDay = null;
  state.debug.overrideSeason = null;
  recordDeveloperEvent("debug-overrides-cleared");
  tick();
  return { timeOfDay: "auto", season: "auto", cinematicEvent: "auto" };
}

function setTimeOfDay(value) {
  const index = Number(value);
  if (!Number.isFinite(index)) {
    throw new Error(`setTimeOfDay expects 0 or 1-${DAY_THEMES.length}.`);
  }

  const normalizedIndex = Math.trunc(index);
  stopCinematicEventsInternal(true);
  if (normalizedIndex === 0) {
    state.debug.overrideMinuteOfDay = null;
    recordDeveloperEvent("time-of-day-override-cleared");
    tick();
    return { mode: "auto" };
  }

  if (normalizedIndex < 1 || normalizedIndex > DAY_THEMES.length) {
    throw new Error(`setTimeOfDay expects 0 or 1-${DAY_THEMES.length}.`);
  }

  const theme = DAY_THEMES[normalizedIndex - 1];
  const minuteOfDay = theme.startMinute + (theme.endMinute - theme.startMinute) / 2;
  state.debug.overrideMinuteOfDay = minuteOfDay;
  recordDeveloperEvent("time-of-day-override", {
    index: normalizedIndex,
    status: theme.name,
    minuteOfDay: Math.round(minuteOfDay),
  });
  tick();
  return {
    index: normalizedIndex,
    status: theme.name,
    minuteOfDay: Math.round(minuteOfDay),
  };
}

function setSeason(value) {
  const index = Number(value);
  if (!Number.isFinite(index)) {
    throw new Error("setSeason expects 0 or 1-4.");
  }

  const normalizedIndex = Math.trunc(index);
  stopCinematicEventsInternal(true);
  if (normalizedIndex === 0) {
    state.debug.overrideSeason = null;
    recordDeveloperEvent("season-override-cleared");
    tick();
    return { mode: "auto" };
  }

  if (normalizedIndex < 1 || normalizedIndex > SEASON_ORDER.length) {
    throw new Error("setSeason expects 0 or 1-4.");
  }

  const season = SEASON_ORDER[normalizedIndex - 1];
  state.debug.overrideSeason = season;
  recordDeveloperEvent("season-override", {
    index: normalizedIndex,
    season,
  });
  tick();
  return {
    index: normalizedIndex,
    season,
  };
}

function getEffectiveMinuteOfDay(snapshotMinuteOfDay) {
  const activeCinematicEvent = getActiveCinematicEvent();
  if (activeCinematicEvent) {
    return normalizeMinutes(activeCinematicEvent.minuteOfDay);
  }
  if (Number.isFinite(state.debug.overrideMinuteOfDay)) {
    return normalizeMinutes(state.debug.overrideMinuteOfDay);
  }
  return snapshotMinuteOfDay;
}

function getEffectiveSeason(date) {
  const activeCinematicEvent = getActiveCinematicEvent();
  if (activeCinematicEvent) {
    return activeCinematicEvent.season;
  }
  if (
    typeof state.debug.overrideSeason === "string" &&
    SEASON_ORDER.includes(state.debug.overrideSeason)
  ) {
    return state.debug.overrideSeason;
  }
  return getSeason(date);
}

function showDeveloperHelp(flag = "--help") {
  const normalizedFlag =
    typeof flag === "string" && flag.trim()
      ? flag.trim().toLowerCase()
      : "--help";
  const isHelpFlag =
    normalizedFlag === "--help" ||
    normalizedFlag === "-h" ||
    normalizedFlag === "help" ||
    normalizedFlag === "all";

  const info = {
    commands: [
      "devMode(true|false)",
      "setTimeOfDay(1-8) | setTimeOfDay(0)",
      "setSeason(1-4) | setSeason(0)",
      "setCinematicEvent(1-6) | setCinematicEvent(0)",
      "forceShootingStar(count=1)",
      "cycleCinematicEvents(seconds=6) | cycleCinematicEvents(0)",
      "stopCinematicEvents()",
      "clearDebugOverrides()",
      "flushDevEvents()",
      "devHelp('--help')",
    ],
    timeOfDay: DAY_THEMES.map((theme, index) => `${index + 1}. ${theme.name}`),
    seasons: SEASON_ORDER.map((season, index) => `${index + 1}. ${season}`),
    cinematicEvents: CINEMATIC_EVENT_PRESETS.map(
      (preset, index) => `${index + 1}. ${preset.label}`
    ),
  };

  const helpText = [
    "Pixel Clock Dev CLI --help",
    "",
    "USAGE",
    "  devHelp('--help')",
    "",
    "COMMANDS",
    `  ${info.commands.join("\n  ")}`,
    "",
    "TIME OF DAY INDEX",
    `  ${info.timeOfDay.join("\n  ")}`,
    "",
    "SEASON INDEX",
    `  ${info.seasons.join("\n  ")}`,
    "",
    "CINEMATIC EVENT INDEX",
    `  ${info.cinematicEvents.join("\n  ")}`,
    "",
    "NOTES",
    "  - setTimeOfDay/setSeason clears active cinematic event cycling.",
    "  - setCinematicEvent or cycleCinematicEvents can override season/time/weather for debugging.",
    "  - forceShootingStar() manually spawns a visible shooting star immediately.",
    "  - cycleCinematicEvents(0) or stopCinematicEvents() returns to auto behavior.",
  ].join("\n");

  if (isHelpFlag) {
    console.info(helpText);
  } else {
    console.info(
      `[DEV] unknown help flag: ${String(flag)}. Use devHelp('--help').`
    );
    console.info(helpText);
  }

  return {
    ...info,
    text: helpText,
  };
}

function installDeveloperConsoleApi() {
  window.devMode = setDeveloperMode;
  window.setTimeOfDay = setTimeOfDay;
  window.setSeason = setSeason;
  window.setCinematicEvent = setCinematicEvent;
  window.forceShootingStar = forceShootingStar;
  window.cycleCinematicEvents = cycleCinematicEvents;
  window.stopCinematicEvents = () => {
    const result = stopCinematicEventsInternal(true);
    tick();
    return result;
  };
  window.clearDebugOverrides = clearDebugOverrides;
  window.flushDevEvents = () => flushDeveloperEvents("manual");
  window.devHelp = showDeveloperHelp;
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
  state.themeLock.variantIndex = fallbackTheme.variantIndex;
  state.themeLock.weatherType = fallbackTheme.weatherType;
  persistThemeLockState();
}

function toggleThemeLock() {
  if (state.themeLock.enabled) {
    state.themeLock.enabled = false;
    persistThemeLockState();
    recordDeveloperEvent("theme-lock-toggle", {
      enabled: false,
    });
    return;
  }
  ensureThemeLockedFromCurrent();
  recordDeveloperEvent("theme-lock-toggle", {
    enabled: true,
    variantIndex: state.themeLock.variantIndex,
    weatherType: state.themeLock.weatherType,
  });
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
  recordDeveloperEvent("variant-cycle", {
    variantIndex: state.themeLock.variantIndex,
    variant: DAILY_VARIANTS[state.themeLock.variantIndex].name,
    lockEnabled: state.themeLock.enabled,
  });
}

function cycleLockedWeather() {
  ensureThemeLockedFromCurrent();
  const season = getEffectiveSeason(new Date());
  const allowedTypes = getAllowedWeatherTypesForSeason(season);
  let currentIndex = allowedTypes.indexOf(state.themeLock.weatherType);
  if (currentIndex < 0) {
    currentIndex = -1;
  }

  state.themeLock.weatherType = allowedTypes[(currentIndex + 1) % allowedTypes.length];
  persistThemeLockState();
  recordDeveloperEvent("weather-cycle", {
    weatherType: state.themeLock.weatherType,
    weatherLabel: WEATHER_LABELS[state.themeLock.weatherType],
    season,
    lockEnabled: state.themeLock.enabled,
  });
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

function channelToLinear(channel) {
  const normalized = clamp(channel, 0, 255) / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(channels) {
  const [r, g, b] = channels.map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(first, second) {
  const firstLum = getRelativeLuminance(first);
  const secondLum = getRelativeLuminance(second);
  const lighter = Math.max(firstLum, secondLum);
  const darker = Math.min(firstLum, secondLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function getWeatherContrastTarget(type) {
  if (type === WEATHER_TYPES.FOG) {
    return 1.3;
  }
  if (type === WEATHER_TYPES.HEAT) {
    return 1.45;
  }
  if (type === WEATHER_TYPES.SNOW) {
    return 1.5;
  }
  if (type === WEATHER_TYPES.STORM) {
    return 1.7;
  }
  return 1.6;
}

function getWeatherContrastAnchor(type, backgroundLuminance) {
  const brightBackground = backgroundLuminance > 0.54;

  if (brightBackground) {
    if (type === WEATHER_TYPES.HEAT) {
      return [164, 98, 36];
    }
    if (type === WEATHER_TYPES.SNOW) {
      return [90, 114, 148];
    }
    if (type === WEATHER_TYPES.FOG) {
      return [84, 106, 132];
    }
    if (type === WEATHER_TYPES.STORM) {
      return [44, 64, 90];
    }
    return [50, 86, 124];
  }

  if (type === WEATHER_TYPES.HEAT) {
    return [255, 214, 148];
  }
  if (type === WEATHER_TYPES.STORM) {
    return [214, 228, 252];
  }
  if (type === WEATHER_TYPES.FOG) {
    return [224, 236, 246];
  }
  if (type === WEATHER_TYPES.SNOW) {
    return [248, 252, 255];
  }
  return [202, 224, 248];
}

function enforceWeatherTintContrast(type, tint, backgroundColor) {
  const targetContrast = getWeatherContrastTarget(type);
  let adjustedTint = tint;
  let contrast = getContrastRatio(adjustedTint, backgroundColor);

  if (contrast >= targetContrast) {
    return adjustedTint;
  }

  const anchor = getWeatherContrastAnchor(
    type,
    getRelativeLuminance(backgroundColor)
  );

  for (let step = 0; step < 8 && contrast < targetContrast; step += 1) {
    const amount = 0.18 + step * 0.08;
    adjustedTint = lerpColor(adjustedTint, anchor, amount);
    contrast = getContrastRatio(adjustedTint, backgroundColor);
  }

  return adjustedTint.map((channel) => clamp(channel, 0, 255));
}

function resolveWeatherVisibility(type, tint, backgroundColor) {
  const targetContrast = getWeatherContrastTarget(type);
  const initialContrast = getContrastRatio(tint, backgroundColor);
  const adjustedTint = enforceWeatherTintContrast(type, tint, backgroundColor);
  const contrastPressure = clamp(
    (targetContrast - initialContrast) / targetContrast,
    0,
    1
  );
  const brightBoost = getRelativeLuminance(backgroundColor) > 0.58 ? 0.12 : 0;

  return {
    tint: adjustedTint,
    overlayStrength: 1 + clamp(contrastPressure * 0.68 + brightBoost, 0, 0.85),
    particleStrength: 1 + clamp(contrastPressure * 0.9 + brightBoost, 0, 1.05),
  };
}

function toRgb(channels, alpha = 1) {
  const [r, g, b] = channels.map((value) => Math.round(value));
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
}

function lerpColor(fromColor, toColor, amount) {
  return fromColor.map((channel, index) => lerp(channel, toColor[index], amount));
}

function getSkyWeatherDimFactor(weatherType) {
  if (weatherType === WEATHER_TYPES.STORM) {
    return 0.46;
  }
  if (weatherType === WEATHER_TYPES.RAIN) {
    return 0.32;
  }
  if (weatherType === WEATHER_TYPES.DRIZZLE) {
    return 0.22;
  }
  if (weatherType === WEATHER_TYPES.FOG) {
    return 0.28;
  }
  if (weatherType === WEATHER_TYPES.SNOW) {
    return 0.14;
  }
  if (weatherType === WEATHER_TYPES.WIND) {
    return 0.08;
  }
  return 0;
}

function getNightVisibility(daylightStrength, weatherDimFactor) {
  return clamp(
    (1 - daylightStrength * 1.02) * (1 - weatherDimFactor * 0.56),
    0,
    1
  );
}

function syncSkyCanvasSize() {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const targetWidth = Math.floor(width * dpr);
  const targetHeight = Math.floor(height * dpr);

  if (skyCanvas.width !== targetWidth || skyCanvas.height !== targetHeight) {
    skyCanvas.width = targetWidth;
    skyCanvas.height = targetHeight;
    skyCanvas.style.width = `${width}px`;
    skyCanvas.style.height = `${height}px`;
    skyContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.sky.stars = createSkyStars(width, height);
    state.sky.fireflies = createSkyFireflies(width, height);
  }

  return { width, height };
}

function getSkyStarCount(width, height) {
  const density = clamp((width * height) / VIEWPORT_REFERENCE_AREA, 0.6, 2.4);
  return Math.max(60, Math.round(94 * density));
}

function getFireflyCount(width, height) {
  const density = clamp((width * height) / VIEWPORT_REFERENCE_AREA, 0.6, 2.2);
  return Math.max(18, Math.round(28 * density));
}

function createSkyStars(width, height) {
  const count = getSkyStarCount(width, height);
  const stars = new Array(count);

  for (let index = 0; index < count; index += 1) {
    stars[index] = {
      x: randomBetween(0, width),
      y: randomBetween(0, height * 0.68),
      radius: randomBetween(0.35, 1.9),
      alpha: randomBetween(0.24, 0.92),
      twinkleRate: randomBetween(0.3, 1.8),
      phase: randomBetween(0, Math.PI * 2),
    };
  }

  return stars;
}

function createSkyFireflies(width, height) {
  const count = getFireflyCount(width, height);
  const fireflies = new Array(count);
  for (let index = 0; index < count; index += 1) {
    fireflies[index] = {
      x: randomBetween(0, width),
      y: randomBetween(height * 0.7, height * 0.96),
      vx: randomBetween(-18, 18),
      vy: randomBetween(-8, 8),
      size: randomBetween(1.2, 2.6),
      alpha: randomBetween(0.35, 0.9),
      phase: randomBetween(0, Math.PI * 2),
      pulseRate: randomBetween(1.1, 2.9),
    };
  }
  return fireflies;
}

function ensureSkyStars(width, height) {
  if (state.sky.stars.length === 0) {
    state.sky.stars = createSkyStars(width, height);
  }
}

function ensureSkyFireflies(width, height) {
  if (state.sky.fireflies.length === 0) {
    state.sky.fireflies = createSkyFireflies(width, height);
  }
}

function resetSkyFirefly(firefly, width, height) {
  firefly.x = randomBetween(-18, width + 18);
  firefly.y = randomBetween(height * 0.7, height * 0.96);
  firefly.vx = randomBetween(-18, 18);
  firefly.vy = randomBetween(-8, 8);
}

function createShootingStar(width, height, forceVisible = false) {
  const vx = randomBetween(280, 420);
  const vy = randomBetween(140, 230);
  return {
    x: randomBetween(width * 0.1, width * 0.78),
    y: randomBetween(height * 0.05, height * 0.33),
    vx,
    vy,
    life: randomBetween(0.55, 1.05),
    age: 0,
    alpha: randomBetween(0.38, 0.72),
    length: randomBetween(58, 120),
    width: randomBetween(1.1, 2.4),
    forceVisible: Boolean(forceVisible),
  };
}

function createLightningPath(width, height) {
  let x = randomBetween(width * 0.2, width * 0.8);
  let y = -14;
  const segments = Math.floor(randomBetween(6, 10));
  const targetY = randomBetween(height * 0.34, height * 0.62);
  const path = [{ x, y }];
  for (let index = 0; index < segments; index += 1) {
    x += randomBetween(-44, 44);
    y += (targetY / segments) * randomBetween(0.82, 1.24);
    path.push({ x, y });
  }
  return path;
}

function ensureFilmGrainResources() {
  if (state.sky.filmGrainCanvas && state.sky.filmGrainContext) {
    return;
  }
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = 160;
  grainCanvas.height = 90;
  const grainContext = grainCanvas.getContext("2d");
  if (!grainContext) {
    return;
  }
  state.sky.filmGrainCanvas = grainCanvas;
  state.sky.filmGrainContext = grainContext;
}

function refreshFilmGrainPattern(timestamp) {
  ensureFilmGrainResources();
  if (!state.sky.filmGrainCanvas || !state.sky.filmGrainContext) {
    return;
  }

  const refreshInterval = prefersReducedMotionQuery.matches ? 220 : 90;
  if (timestamp - state.sky.filmGrainLastRefreshMs < refreshInterval) {
    return;
  }

  const grainContext = state.sky.filmGrainContext;
  const grainCanvas = state.sky.filmGrainCanvas;
  const image = grainContext.createImageData(grainCanvas.width, grainCanvas.height);
  const { data } = image;

  for (let index = 0; index < data.length; index += 4) {
    const value = Math.floor(randomBetween(0, 255));
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = Math.floor(randomBetween(18, 64));
  }

  grainContext.putImageData(image, 0, 0);
  state.sky.filmGrainPattern = skyContext.createPattern(grainCanvas, "repeat");
  state.sky.filmGrainLastRefreshMs = timestamp;
}

function drawStarfield(theme, width, height, daylightStrength, weatherDimFactor, timeSeconds) {
  ensureSkyStars(width, height);
  const visibility = getNightVisibility(daylightStrength, weatherDimFactor);
  if (visibility <= 0.01) {
    return;
  }

  const starColor = lerpColor(theme.label, [246, 250, 255], 0.72);
  const [r, g, b] = starColor.map((channel) => Math.round(channel));
  const stars = state.sky.stars;

  for (let index = 0; index < stars.length; index += 1) {
    const star = stars[index];
    const twinkle = prefersReducedMotionQuery.matches
      ? 0.86
      : 0.58 + Math.sin(timeSeconds * star.twinkleRate + star.phase) * 0.42;
    const alpha = clamp(star.alpha * twinkle * visibility, 0, 1);
    if (alpha <= 0.01) {
      continue;
    }
    skyContext.fillStyle = `rgb(${r} ${g} ${b} / ${alpha})`;
    skyContext.beginPath();
    skyContext.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    skyContext.fill();
  }
}

function drawWinterAurora(theme, width, height, daylightStrength, weatherDimFactor, timeSeconds) {
  const forceAurora = isCinematicEventForced("winter-aurora");
  if (!forceAurora && theme.season !== "Winter") {
    return;
  }

  let visibility =
    getNightVisibility(daylightStrength, weatherDimFactor) * (1 - weatherDimFactor * 0.5);
  if (forceAurora) {
    visibility = Math.max(visibility, 0.82);
  }
  if (visibility <= 0.03) {
    return;
  }

  const colorSets = [
    [112, 206, 152],
    [92, 168, 138],
    [142, 118, 174],
  ];
  const lowMotion = prefersReducedMotionQuery.matches && !forceAurora;
  const curtainCount = forceAurora ? 4 : 3;
  const step = lowMotion ? 16 : 8;

  skyContext.save();
  skyContext.globalCompositeOperation = "screen";

  for (let band = 0; band < curtainCount; band += 1) {
    const [r, g, b] = colorSets[band % colorSets.length];
    const baseY = height * (0.08 + band * 0.06);
    const depth = height * (0.2 + band * 0.03);
    const phase = timeSeconds * (0.11 + band * 0.05) + band * 1.5;
    const ampA = height * (0.03 + band * 0.007);
    const ampB = height * (0.014 + band * 0.005);
    const crest = [];

    for (let x = -32; x <= width + 32; x += step) {
      const y =
        baseY +
        Math.sin(x * 0.006 + phase) * ampA +
        Math.sin(x * 0.018 + phase * 1.6) * ampB;
      crest.push({ x, y });
    }

    skyContext.save();
    skyContext.filter = `blur(${
      lowMotion ? 7 : forceAurora ? 30 : 18
    }px)`;
    const curtainGradient = skyContext.createLinearGradient(
      0,
      baseY - depth * 0.24,
      0,
      baseY + depth
    );
    const alphaCore = (forceAurora ? 0.54 : 0.26) * visibility;
    curtainGradient.addColorStop(0, `rgb(${r} ${g} ${b} / 0)`);
    curtainGradient.addColorStop(0.24, `rgb(${r} ${g} ${b} / ${alphaCore * 0.24})`);
    curtainGradient.addColorStop(0.35, `rgb(${r} ${g} ${b} / ${alphaCore * 0.72})`);
    curtainGradient.addColorStop(0.62, `rgb(${r} ${g} ${b} / ${alphaCore})`);
    curtainGradient.addColorStop(0.86, `rgb(${r} ${g} ${b} / ${alphaCore * 0.26})`);
    curtainGradient.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);

    skyContext.beginPath();
    for (let index = 0; index < crest.length; index += 1) {
      const point = crest[index];
      if (index === 0) {
        skyContext.moveTo(point.x, point.y);
      } else {
        skyContext.lineTo(point.x, point.y);
      }
    }

    for (let index = crest.length - 1; index >= 0; index -= 1) {
      const point = crest[index];
      const curtainY = point.y + depth + Math.sin(index * 0.34 + phase) * (depth * 0.16);
      skyContext.lineTo(point.x, curtainY);
    }
    skyContext.closePath();
    skyContext.fillStyle = curtainGradient;
    skyContext.fill();
    skyContext.restore();

    // Secondary bloom pass to avoid "strip line" look and create volumetric depth.
    skyContext.save();
    skyContext.filter = `blur(${
      lowMotion ? 8 : forceAurora ? 36 : 22
    }px)`;
    skyContext.globalAlpha = forceAurora ? 0.42 : 0.24;
    skyContext.fillStyle = curtainGradient;
    skyContext.fill();
    skyContext.restore();

    // Subtle internal vertical veils for realistic aurora curtain texture.
    const veilCount = forceAurora ? 8 : 5;
    skyContext.save();
    skyContext.filter = `blur(${lowMotion ? 4 : 7}px)`;
    for (let veil = 0; veil < veilCount; veil += 1) {
      const veilX = ((veil + 0.5) / veilCount) * width + Math.sin(phase + veil) * 30;
      const veilW = width * (forceAurora ? 0.06 : 0.045);
      const veilGradient = skyContext.createLinearGradient(
        veilX,
        baseY - depth * 0.2,
        veilX,
        baseY + depth * 1.08
      );
      const veilAlpha = (forceAurora ? 0.18 : 0.1) * visibility;
      veilGradient.addColorStop(0, `rgb(${r} ${g} ${b} / 0)`);
      veilGradient.addColorStop(0.35, `rgb(${r} ${g} ${b} / ${veilAlpha * 0.7})`);
      veilGradient.addColorStop(0.7, `rgb(${r} ${g} ${b} / ${veilAlpha})`);
      veilGradient.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
      skyContext.fillStyle = veilGradient;
      skyContext.fillRect(veilX - veilW * 0.5, baseY - depth * 0.2, veilW, depth * 1.25);
    }
    skyContext.restore();
  }

  const glow = skyContext.createRadialGradient(
    width * 0.5,
    height * 0.2,
    0,
    width * 0.5,
    height * 0.3,
    height * 0.58
  );
  glow.addColorStop(0, `rgb(126 214 164 / ${(forceAurora ? 0.16 : 0.08) * visibility})`);
  glow.addColorStop(0.5, `rgb(98 174 142 / ${(forceAurora ? 0.2 : 0.12) * visibility})`);
  glow.addColorStop(0.78, `rgb(132 114 168 / ${(forceAurora ? 0.1 : 0.06) * visibility})`);
  glow.addColorStop(1, "rgb(124 220 255 / 0)");
  skyContext.fillStyle = glow;
  skyContext.fillRect(0, 0, width, height * 0.82);

  skyContext.restore();
}

function drawShootingStars(
  theme,
  width,
  height,
  daylightStrength,
  weatherDimFactor,
  timeSeconds,
  dt
) {
  const forceShootingStars = isCinematicEventForced("shooting-stars");
  const visibility = getNightVisibility(daylightStrength, weatherDimFactor);
  if (state.sky.nextShootingStarAtSec <= 0) {
    state.sky.nextShootingStarAtSec = timeSeconds + randomBetween(
      forceShootingStars ? 0.25 : 18,
      forceShootingStars ? 1.1 : 70
    );
  }

  const canSpawnNaturally =
    !prefersReducedMotionQuery.matches &&
    visibility > 0.32 &&
    weatherDimFactor < 0.52 &&
    timeSeconds >= state.sky.nextShootingStarAtSec;
  const canSpawnForced =
    !prefersReducedMotionQuery.matches &&
    forceShootingStars &&
    visibility > 0.08 &&
    timeSeconds >= state.sky.nextShootingStarAtSec;

  if (
    canSpawnNaturally ||
    canSpawnForced
  ) {
    state.sky.shootingStars.push(createShootingStar(width, height));
    recordDeveloperEvent("shooting-star-spawn", {
      season: theme.season,
      weather: theme.weatherType,
      visibility: Number(visibility.toFixed(3)),
      activeStars: state.sky.shootingStars.length,
      forced: forceShootingStars,
    });
    state.sky.nextShootingStarAtSec = timeSeconds + randomBetween(
      forceShootingStars ? 0.9 : 25,
      forceShootingStars ? 2.4 : 95
    );
  } else if (timeSeconds >= state.sky.nextShootingStarAtSec) {
    state.sky.nextShootingStarAtSec = timeSeconds + randomBetween(
      forceShootingStars ? 0.6 : 8,
      forceShootingStars ? 1.8 : 24
    );
  }

  const hasForceVisibleStar = state.sky.shootingStars.some((star) => star.forceVisible);
  if (state.sky.shootingStars.length === 0 || (visibility <= 0.01 && !hasForceVisibleStar)) {
    return;
  }

  const streakColor = lerpColor(theme.label, [248, 252, 255], 0.82);
  const [r, g, b] = streakColor.map((channel) => Math.round(channel));

  for (let index = state.sky.shootingStars.length - 1; index >= 0; index -= 1) {
    const star = state.sky.shootingStars[index];
    star.age += dt;
    star.x += star.vx * dt;
    star.y += star.vy * dt;

    const lifeProgress = star.age / star.life;
    if (
      lifeProgress >= 1 ||
      star.x > width + 180 ||
      star.y > height * 0.82 ||
      star.y < -40
    ) {
      state.sky.shootingStars.splice(index, 1);
      continue;
    }

    const speed = Math.hypot(star.vx, star.vy) || 1;
    const tailX = star.x - (star.vx / speed) * star.length;
    const tailY = star.y - (star.vy / speed) * star.length;
    const effectiveVisibility = star.forceVisible ? Math.max(visibility, 0.6) : visibility;
    const alpha = clamp((1 - lifeProgress) * star.alpha * effectiveVisibility, 0, 1);
    const gradient = skyContext.createLinearGradient(tailX, tailY, star.x, star.y);
    gradient.addColorStop(0, `rgb(${r} ${g} ${b} / 0)`);
    gradient.addColorStop(0.65, `rgb(${r} ${g} ${b} / ${alpha * 0.42})`);
    gradient.addColorStop(1, `rgb(${r} ${g} ${b} / ${alpha})`);

    skyContext.strokeStyle = gradient;
    skyContext.lineWidth = star.width;
    skyContext.lineCap = "round";
    skyContext.beginPath();
    skyContext.moveTo(tailX, tailY);
    skyContext.lineTo(star.x, star.y);
    skyContext.stroke();

    skyContext.fillStyle = `rgb(${r} ${g} ${b} / ${alpha * 0.9})`;
    skyContext.beginPath();
    skyContext.arc(star.x, star.y, star.width * 1.15, 0, Math.PI * 2);
    skyContext.fill();
  }
}

function drawSummerFireflies(
  theme,
  width,
  height,
  daylightStrength,
  weatherDimFactor,
  timeSeconds,
  dt
) {
  if (theme.season !== "Summer") {
    return;
  }

  const visibility = clamp(
    ((0.7 - daylightStrength) / 0.7) * (1 - weatherDimFactor * 0.62),
    0,
    1
  );
  if (visibility <= 0.02) {
    return;
  }

  ensureSkyFireflies(width, height);
  const glowColor = lerpColor(theme.bgGlow, [255, 224, 124], 0.82);
  const [r, g, b] = glowColor.map((channel) => Math.round(channel));

  for (let index = 0; index < state.sky.fireflies.length; index += 1) {
    const firefly = state.sky.fireflies[index];
    firefly.phase += firefly.pulseRate * dt;

    if (!prefersReducedMotionQuery.matches) {
      firefly.x += firefly.vx * dt;
      firefly.y += firefly.vy * dt;
      firefly.vx += Math.sin(firefly.phase * 0.48) * 4 * dt;
      firefly.vy += Math.cos(firefly.phase * 0.64) * 2 * dt;
      firefly.vx = clamp(firefly.vx, -22, 22);
      firefly.vy = clamp(firefly.vy, -10, 10);
    }

    if (
      firefly.x < -24 ||
      firefly.x > width + 24 ||
      firefly.y < height * 0.64 ||
      firefly.y > height + 18
    ) {
      resetSkyFirefly(firefly, width, height);
    }

    const pulse = 0.35 + Math.sin(timeSeconds * firefly.pulseRate + firefly.phase) * 0.65;
    const alpha = clamp(firefly.alpha * pulse * visibility, 0, 1);
    if (alpha <= 0.01) {
      continue;
    }

    const radius = firefly.size * 4.8;
    const glow = skyContext.createRadialGradient(
      firefly.x,
      firefly.y,
      0,
      firefly.x,
      firefly.y,
      radius
    );
    glow.addColorStop(0, `rgb(${r} ${g} ${b} / ${alpha})`);
    glow.addColorStop(0.35, `rgb(${r} ${g} ${b} / ${alpha * 0.46})`);
    glow.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
    skyContext.fillStyle = glow;
    skyContext.beginPath();
    skyContext.arc(firefly.x, firefly.y, radius, 0, Math.PI * 2);
    skyContext.fill();
  }
}

function drawCelestialBodies(
  theme,
  minuteOfDay,
  width,
  height,
  weatherDimFactor,
  daylightStrength
) {
  const cycle = normalizeMinutes(minuteOfDay) / MINUTES_PER_DAY;
  const sunAngle = (cycle - 0.25) * Math.PI * 2;
  const moonAngle = sunAngle + Math.PI;
  const orbitRadiusX = width * 0.42;
  const orbitRadiusY = height * 0.5;
  const orbitCenterY = height * 0.86;
  const bodyRadius = clamp(Math.min(width, height) * 0.036, 15, 42);

  const sunAltitude = Math.sin(sunAngle);
  if (sunAltitude > 0.01) {
    const sunX = width * 0.5 + Math.cos(sunAngle) * orbitRadiusX;
    const sunY = orbitCenterY - sunAltitude * orbitRadiusY;
    const sunStrength = clamp(sunAltitude * (1 - weatherDimFactor * 0.72), 0, 1);
    const sunGlow = skyContext.createRadialGradient(
      sunX,
      sunY,
      bodyRadius * 0.22,
      sunX,
      sunY,
      bodyRadius * 3.2
    );
    const sunColor = lerpColor(theme.bgGlow, [255, 228, 156], 0.78);
    const [sr, sg, sb] = sunColor.map((channel) => Math.round(channel));
    sunGlow.addColorStop(0, `rgb(${sr} ${sg} ${sb} / ${0.64 * sunStrength})`);
    sunGlow.addColorStop(0.45, `rgb(${sr} ${sg} ${sb} / ${0.28 * sunStrength})`);
    sunGlow.addColorStop(1, `rgb(${sr} ${sg} ${sb} / 0)`);
    skyContext.fillStyle = sunGlow;
    skyContext.beginPath();
    skyContext.arc(sunX, sunY, bodyRadius * 3.2, 0, Math.PI * 2);
    skyContext.fill();
    skyContext.fillStyle = `rgb(255 235 182 / ${0.86 * sunStrength})`;
    skyContext.beginPath();
    skyContext.arc(sunX, sunY, bodyRadius, 0, Math.PI * 2);
    skyContext.fill();
  }

  const moonAltitude = Math.sin(moonAngle);
  if (moonAltitude > 0.01) {
    const moonX = width * 0.5 + Math.cos(moonAngle) * orbitRadiusX;
    const moonY = orbitCenterY - moonAltitude * orbitRadiusY;
    const moonStrength = clamp(
      moonAltitude * (1 - daylightStrength * 0.88) * (1 - weatherDimFactor * 0.42),
      0,
      1
    );
    const moonColor = lerpColor(theme.label, [224, 235, 255], 0.7);
    const moonGlow = skyContext.createRadialGradient(
      moonX,
      moonY,
      bodyRadius * 0.18,
      moonX,
      moonY,
      bodyRadius * 2.5
    );
    const [mr, mg, mb] = moonColor.map((channel) => Math.round(channel));
    moonGlow.addColorStop(0, `rgb(${mr} ${mg} ${mb} / ${0.46 * moonStrength})`);
    moonGlow.addColorStop(1, `rgb(${mr} ${mg} ${mb} / 0)`);
    skyContext.fillStyle = moonGlow;
    skyContext.beginPath();
    skyContext.arc(moonX, moonY, bodyRadius * 2.5, 0, Math.PI * 2);
    skyContext.fill();

    skyContext.fillStyle = `rgb(${mr} ${mg} ${mb} / ${0.86 * moonStrength})`;
    skyContext.beginPath();
    skyContext.arc(moonX, moonY, bodyRadius * 0.78, 0, Math.PI * 2);
    skyContext.fill();

    // Slight offset mask to imply a crescent.
    const moonMask = lerpColor(theme.bgTop, [14, 21, 36], 0.6);
    const [maskR, maskG, maskB] = moonMask.map((channel) => Math.round(channel));
    skyContext.fillStyle = `rgb(${maskR} ${maskG} ${maskB} / ${0.9 * moonStrength})`;
    skyContext.beginPath();
    skyContext.arc(
      moonX + bodyRadius * 0.36,
      moonY - bodyRadius * 0.06,
      bodyRadius * 0.72,
      0,
      Math.PI * 2
    );
    skyContext.fill();
  }
}

function traceHorizonRidgeLine(width, options, connectFromCurrent = false) {
  const { baseY, ampA, ampB, freqA, freqB, offset, phase } = options;
  const step = 16;
  for (let x = -step; x <= width + step; x += step) {
    const worldX = x + offset;
    const ridgeY =
      baseY +
      Math.sin(worldX * freqA + phase) * ampA +
      Math.sin(worldX * freqB + phase * 0.7 + 1.8) * ampB;
    if (x === -step) {
      if (connectFromCurrent) {
        skyContext.lineTo(x, ridgeY);
      } else {
        skyContext.moveTo(x, ridgeY);
      }
    } else {
      skyContext.lineTo(x, ridgeY);
    }
  }
}

function drawHorizonRidge(width, height, options) {
  const {
    color,
    alpha,
    blur = 0,
  } = options;
  const step = 16;
  const [r, g, b] = color.map((channel) => Math.round(channel));

  skyContext.save();
  if (blur > 0) {
    skyContext.filter = `blur(${blur}px)`;
  }

  skyContext.beginPath();
  skyContext.moveTo(-step, height + 20);
  traceHorizonRidgeLine(width, options, true);
  skyContext.lineTo(width + step, height + 20);
  skyContext.closePath();
  skyContext.fillStyle = `rgb(${r} ${g} ${b} / ${alpha})`;
  skyContext.fill();
  skyContext.restore();
}

function drawHorizonContour(width, options) {
  const {
    color,
    alpha,
    lineWidth = 1.2,
    blur = 0,
  } = options;
  const [r, g, b] = color.map((channel) => Math.round(channel));

  skyContext.save();
  if (blur > 0) {
    skyContext.filter = `blur(${blur}px)`;
  }
  skyContext.beginPath();
  traceHorizonRidgeLine(width, options);
  skyContext.lineWidth = lineWidth;
  skyContext.lineCap = "round";
  skyContext.strokeStyle = `rgb(${r} ${g} ${b} / ${alpha})`;
  skyContext.stroke();
  skyContext.restore();
}

function getHorizonLayerGeometry(width, height, timeValue) {
  return [
    {
      baseY: height * 0.82,
      ampA: height * 0.026,
      ampB: height * 0.016,
      freqA: 0.0036,
      freqB: 0.0104,
      offset: timeValue * 4.6,
      phase: 0.65,
    },
    {
      baseY: height * 0.89,
      ampA: height * 0.039,
      ampB: height * 0.021,
      freqA: 0.0055,
      freqB: 0.016,
      offset: timeValue * 8.8,
      phase: 1.4,
    },
    {
      baseY: height * 0.96,
      ampA: height * 0.05,
      ampB: height * 0.028,
      freqA: 0.0084,
      freqB: 0.021,
      offset: timeValue * 13.6,
      phase: 2.1,
    },
  ];
}

function drawHorizonLayers(
  theme,
  width,
  height,
  weatherDimFactor,
  daylightStrength,
  timeSeconds,
  lightningStrength
) {
  const timeValue = prefersReducedMotionQuery.matches
    ? (normalizeMinutes(theme.minuteOfDay) / MINUTES_PER_DAY) * 360
    : timeSeconds;
  const layers = getHorizonLayerGeometry(width, height, timeValue);
  const farColor = lerpColor(theme.bgBottom, [46, 64, 88], 0.58);
  const midColor = lerpColor(theme.bgBottom, [24, 34, 52], 0.74);
  const nearColor = lerpColor(theme.bgBottom, [11, 15, 25], 0.84);
  const darken = clamp(
    weatherDimFactor + (1 - daylightStrength) * 0.14 - lightningStrength * 0.36,
    0,
    0.58
  );
  const shadowTarget = [6, 10, 18];
  const revealTarget = lerpColor(theme.label, [240, 247, 255], 0.78);
  const revealBlend = clamp(lightningStrength * 0.72, 0, 0.72);

  drawHorizonRidge(width, height, {
    ...layers[0],
    color: lerpColor(
      lerpColor(farColor, shadowTarget, darken * 0.44),
      revealTarget,
      revealBlend * 0.44
    ),
    alpha: 0.5,
    blur: 3.1,
  });

  drawHorizonRidge(width, height, {
    ...layers[1],
    color: lerpColor(
      lerpColor(midColor, shadowTarget, darken * 0.62),
      revealTarget,
      revealBlend * 0.56
    ),
    alpha: 0.73,
  });

  drawHorizonRidge(width, height, {
    ...layers[2],
    color: lerpColor(
      lerpColor(nearColor, shadowTarget, darken * 0.8),
      revealTarget,
      revealBlend * 0.68
    ),
    alpha: 0.92,
  });

  const horizonGlow = skyContext.createLinearGradient(0, height * 0.58, 0, height);
  const glowColor = lerpColor(theme.bgGlow, [160, 182, 214], 0.44);
  const [gr, gg, gb] = glowColor.map((channel) => Math.round(channel));
  horizonGlow.addColorStop(0, `rgb(${gr} ${gg} ${gb} / 0)`);
  horizonGlow.addColorStop(
    1,
    `rgb(${gr} ${gg} ${gb} / ${0.15 * (1 - weatherDimFactor * 0.72)})`
  );
  skyContext.fillStyle = horizonGlow;
  skyContext.fillRect(0, height * 0.58, width, height * 0.42);
}

function updateStormLightningState(theme, daylightStrength, timeSeconds, dt, width, height) {
  const forceLightning = isCinematicEventForced("storm-lightning");
  if (
    !forceLightning &&
    (theme.weatherType !== WEATHER_TYPES.STORM || daylightStrength > 0.78)
  ) {
    state.sky.lightningStrength = Math.max(0, state.sky.lightningStrength - dt * 2.8);
    return;
  }

  if (state.sky.nextLightningAtSec <= 0) {
    state.sky.nextLightningAtSec = timeSeconds + randomBetween(
      forceLightning ? 0.35 : 3.4,
      forceLightning ? 1.35 : 11.5
    );
  }

  if (timeSeconds >= state.sky.nextLightningAtSec) {
    state.sky.lightningStrength = randomBetween(
      forceLightning ? 0.68 : 0.45,
      forceLightning ? 0.98 : 0.92
    );
    state.sky.lightningPath = createLightningPath(width, height);
    state.sky.nextLightningAtSec = timeSeconds + randomBetween(
      forceLightning ? 0.9 : 5.2,
      forceLightning ? 2.8 : 18.4
    );
    recordDeveloperEvent("lightning-strike", {
      weather: theme.weatherType,
      daylightStrength: Number(daylightStrength.toFixed(3)),
      intensity: Number(state.sky.lightningStrength.toFixed(3)),
      forced: forceLightning,
    });
  } else if (state.sky.lightningStrength > 0) {
    state.sky.lightningStrength = Math.max(0, state.sky.lightningStrength - dt * 3.4);
  }
}

function drawStormLightningEffects(theme, width, height, timeSeconds) {
  const lightningStrength = state.sky.lightningStrength;
  if (lightningStrength <= 0.01) {
    return;
  }

  const path = state.sky.lightningPath;
  if (path.length > 1) {
    skyContext.save();
    skyContext.globalCompositeOperation = "screen";

    skyContext.beginPath();
    skyContext.moveTo(path[0].x, path[0].y);
    for (let index = 1; index < path.length; index += 1) {
      skyContext.lineTo(path[index].x, path[index].y);
    }
    skyContext.strokeStyle = `rgb(228 238 255 / ${0.82 * lightningStrength})`;
    skyContext.lineWidth = 1.35;
    skyContext.lineCap = "round";
    skyContext.lineJoin = "round";
    skyContext.stroke();

    skyContext.beginPath();
    skyContext.moveTo(path[0].x, path[0].y);
    for (let index = 1; index < path.length; index += 1) {
      skyContext.lineTo(path[index].x, path[index].y);
    }
    skyContext.strokeStyle = `rgb(255 255 255 / ${0.46 * lightningStrength})`;
    skyContext.lineWidth = 3.6;
    skyContext.filter = "blur(2.4px)";
    skyContext.stroke();
    skyContext.restore();
  }

  const strikeX = path.length ? path[0].x : width * 0.5;
  const flash = skyContext.createRadialGradient(
    strikeX,
    0,
    0,
    strikeX,
    height * 0.34,
    height * 0.92
  );
  flash.addColorStop(0, `rgb(216 230 255 / ${0.2 * lightningStrength})`);
  flash.addColorStop(1, "rgb(216 230 255 / 0)");
  skyContext.fillStyle = flash;
  skyContext.fillRect(0, 0, width, height);

  const timeValue = prefersReducedMotionQuery.matches
    ? (normalizeMinutes(theme.minuteOfDay) / MINUTES_PER_DAY) * 360
    : timeSeconds;
  const layers = getHorizonLayerGeometry(width, height, timeValue);
  const contourColor = lerpColor(theme.label, [242, 248, 255], 0.78);
  drawHorizonContour(width, {
    ...layers[0],
    color: contourColor,
    alpha: 0.22 * lightningStrength,
    lineWidth: 1.4,
    blur: 0.9,
  });
  drawHorizonContour(width, {
    ...layers[1],
    color: contourColor,
    alpha: 0.26 * lightningStrength,
    lineWidth: 1.8,
  });
  drawHorizonContour(width, {
    ...layers[2],
    color: contourColor,
    alpha: 0.31 * lightningStrength,
    lineWidth: 2.2,
  });
}

function drawSkyWeatherShade(theme, width, height, weatherDimFactor) {
  if (weatherDimFactor <= 0.01) {
    return;
  }
  const shadeTop = lerpColor(theme.bgTop, [18, 24, 38], 0.72);
  const shadeBottom = lerpColor(theme.bgBottom, [12, 16, 28], 0.82);
  const [topR, topG, topB] = shadeTop.map((channel) => Math.round(channel));
  const [bottomR, bottomG, bottomB] = shadeBottom.map((channel) =>
    Math.round(channel)
  );
  const cloudShade = skyContext.createLinearGradient(0, 0, 0, height);
  cloudShade.addColorStop(
    0,
    `rgb(${topR} ${topG} ${topB} / ${weatherDimFactor * 0.55})`
  );
  cloudShade.addColorStop(
    1,
    `rgb(${bottomR} ${bottomG} ${bottomB} / ${weatherDimFactor * 0.75})`
  );
  skyContext.fillStyle = cloudShade;
  skyContext.fillRect(0, 0, width, height);
}

function drawCinematicOverlay(theme, width, height, weatherDimFactor, timestamp) {
  if (!state.cinematic.enabled) {
    return;
  }

  const vignette = skyContext.createRadialGradient(
    width * 0.5,
    height * 0.52,
    Math.min(width, height) * 0.18,
    width * 0.5,
    height * 0.55,
    Math.max(width, height) * 0.82
  );
  const vignetteAlpha = 0.14 + weatherDimFactor * 0.14;
  vignette.addColorStop(0, "rgb(0 0 0 / 0)");
  vignette.addColorStop(0.62, `rgb(0 0 0 / ${vignetteAlpha * 0.18})`);
  vignette.addColorStop(1, `rgb(0 0 0 / ${vignetteAlpha})`);
  skyContext.fillStyle = vignette;
  skyContext.fillRect(0, 0, width, height);

  refreshFilmGrainPattern(timestamp);
  if (!state.sky.filmGrainPattern) {
    return;
  }
  skyContext.save();
  skyContext.globalCompositeOperation = "soft-light";
  skyContext.globalAlpha = 0.08 + weatherDimFactor * 0.06;
  skyContext.fillStyle = state.sky.filmGrainPattern;
  skyContext.fillRect(0, 0, width, height);
  skyContext.restore();
}

function drawSkyFrame(theme, timestamp) {
  const { width, height } = syncSkyCanvasSize();
  skyContext.clearRect(0, 0, width, height);

  const now = new Date();
  const safeTheme = theme || resolveTheme(now.getHours() * 60 + now.getMinutes(), now);
  const minuteOfDay =
    typeof safeTheme.minuteOfDay === "number"
      ? safeTheme.minuteOfDay
      : now.getHours() * 60 + now.getMinutes();
  const cycle = normalizeMinutes(minuteOfDay) / MINUTES_PER_DAY;
  const sunAltitude = Math.sin((cycle - 0.25) * Math.PI * 2);
  const daylightStrength = clamp((sunAltitude + 0.1) / 1.1, 0, 1);
  const weatherDimFactor = getSkyWeatherDimFactor(safeTheme.weatherType);
  const timeSeconds = timestamp / 1000;
  const dt = state.sky.lastFrameMs
    ? Math.min((timestamp - state.sky.lastFrameMs) / 1000, 0.05)
    : 1 / 60;
  state.sky.lastFrameMs = timestamp;

  updateStormLightningState(
    safeTheme,
    daylightStrength,
    timeSeconds,
    dt,
    width,
    height
  );

  drawStarfield(
    safeTheme,
    width,
    height,
    daylightStrength,
    weatherDimFactor,
    timeSeconds
  );
  drawWinterAurora(safeTheme, width, height, daylightStrength, weatherDimFactor, timeSeconds);
  drawShootingStars(
    safeTheme,
    width,
    height,
    daylightStrength,
    weatherDimFactor,
    timeSeconds,
    dt
  );
  drawCelestialBodies(
    safeTheme,
    minuteOfDay,
    width,
    height,
    weatherDimFactor,
    daylightStrength
  );
  drawHorizonLayers(
    safeTheme,
    width,
    height,
    weatherDimFactor,
    daylightStrength,
    timeSeconds,
    state.sky.lightningStrength
  );
  drawSummerFireflies(
    safeTheme,
    width,
    height,
    daylightStrength,
    weatherDimFactor,
    timeSeconds,
    dt
  );
  drawSkyWeatherShade(safeTheme, width, height, weatherDimFactor);
  drawStormLightningEffects(safeTheme, width, height, timeSeconds);
  drawCinematicOverlay(safeTheme, width, height, weatherDimFactor, timestamp);
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
    const lockState = state.themeLock.enabled
      ? "Color and weather locked"
      : "Auto color and weather";
    periodLabel.setAttribute(
      "aria-label",
      `${snapshot.dateIso}. ${theme.status}. Variant ${theme.variant}. Weather ${theme.weatherLabel}. ${lockState}.`
    );
  }

  if (dateLabel) {
    dateLabel.textContent = snapshot.dateIso;
  }

  if (statusLabel) {
    statusLabel.textContent = theme.status;
  }

  if (variantButton) {
    variantButton.textContent = theme.variant;
    variantButton.setAttribute("aria-pressed", String(state.themeLock.enabled));
    variantButton.title = state.themeLock.enabled
      ? "Cycle locked color variant"
      : "Click to lock and cycle color variant";
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
        ? "Unlock color and weather lock"
        : "Lock color and weather"
    );
    themeLockButton.title = state.themeLock.enabled
      ? "Unlock color and weather lock"
      : "Lock color and weather";
  }

  if (lockStateLabel) {
    lockStateLabel.textContent = state.themeLock.enabled ? "LOCKED" : "AUTO";
  }

  if (cinematicToggleButton) {
    const enabled = state.cinematic.enabled;
    cinematicToggleButton.textContent = enabled ? "FX ON" : "FX OFF";
    cinematicToggleButton.setAttribute("aria-pressed", String(enabled));
    cinematicToggleButton.setAttribute(
      "aria-label",
      enabled ? "Disable cinematic effects" : "Enable cinematic effects"
    );
    cinematicToggleButton.title = enabled
      ? "Disable cinematic effects"
      : "Enable cinematic effects";
  }
}

function setSettingsPanelOpen(nextOpen) {
  if (!settingsShell || !settingsToggleButton) {
    return;
  }

  const isOpen = Boolean(nextOpen);
  settingsShell.dataset.open = String(isOpen);
  settingsToggleButton.setAttribute("aria-expanded", String(isOpen));
  settingsToggleButton.setAttribute("aria-pressed", String(isOpen));
  settingsToggleButton.setAttribute(
    "aria-label",
    isOpen ? "Close settings" : "Open settings"
  );
  settingsToggleButton.title = isOpen ? "Close settings" : "Open settings";

  if (settingsPanel) {
    settingsPanel.setAttribute("aria-hidden", String(!isOpen));
  }

  recordDeveloperEvent("settings-panel-toggle", { open: isOpen });
}

function setupThemeControlListeners() {
  if (settingsToggleButton && settingsShell) {
    setSettingsPanelOpen(false);
    settingsToggleButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = settingsShell.dataset.open === "true";
      setSettingsPanelOpen(!isOpen);
    });

    document.addEventListener("click", (event) => {
      if (settingsShell.dataset.open !== "true") {
        return;
      }
      if (!(event.target instanceof Node)) {
        return;
      }
      if (!settingsShell.contains(event.target)) {
        setSettingsPanelOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && settingsShell.dataset.open === "true") {
        setSettingsPanelOpen(false);
      }
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

  if (cinematicToggleButton) {
    cinematicToggleButton.addEventListener("click", () => {
      toggleCinematicMode();
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
  const backgroundColor = lerpColor(theme.bgTop, theme.bgBottom, 0.52);
  const visibility = resolveWeatherVisibility(
    theme.weatherType,
    theme.weatherTint,
    backgroundColor
  );

  state.weather.type = theme.weatherType;
  state.weather.label = theme.weatherLabel;
  state.weather.tint = visibility.tint;
  state.weather.overlayStrength = visibility.overlayStrength;
  state.weather.particleStrength = visibility.particleStrength;

  if (weatherChanged || needsParticles) {
    state.weather.stormFlash = 0;
    state.weather.particles = createWeatherParticles(
      theme.weatherType,
      viewport.width,
      viewport.height
    );

    if (weatherChanged) {
      recordDeveloperEvent("weather-theme-change", {
        weatherType: theme.weatherType,
        weatherLabel: theme.weatherLabel,
        season: theme.season,
      });
    }
  }
}

function drawWeatherOverlay(width, height, tint, alpha) {
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const overlayStrength = state.weather.overlayStrength || 1;
  const overlayAlpha = clamp(alpha * overlayStrength, 0.01, 0.36);
  const gradient = weatherContext.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `rgb(${r} ${g} ${b} / ${overlayAlpha * 0.36})`);
  gradient.addColorStop(1, `rgb(${r} ${g} ${b} / ${overlayAlpha})`);
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
  const particleStrength = state.weather.particleStrength || 1;
  const effectiveStrokeAlpha = clamp(strokeAlpha * particleStrength, 0.12, 0.92);

  weatherContext.strokeStyle = `rgb(${r} ${g} ${b} / ${effectiveStrokeAlpha})`;
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

    weatherContext.globalAlpha = clamp(particle.opacity * particleStrength, 0, 1);
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
  const particleStrength = state.weather.particleStrength || 1;

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

    weatherContext.fillStyle = `rgb(${r} ${g} ${b} / ${clamp(
      particle.opacity * particleStrength,
      0,
      1
    )})`;
    weatherContext.beginPath();
    weatherContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    weatherContext.fill();
  }
}

function drawHeatParticles(dt, width, height, tint) {
  drawWeatherOverlay(width, height, tint, 0.06);
  const [r, g, b] = tint.map((channel) => Math.round(channel));
  const particles = state.weather.particles;
  const particleStrength = state.weather.particleStrength || 1;

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
    weatherContext.fillStyle = `rgb(${r} ${g} ${b} / ${clamp(
      particle.opacity * particleStrength,
      0,
      1
    )})`;
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
  const particleStrength = state.weather.particleStrength || 1;

  weatherContext.strokeStyle = `rgb(${r} ${g} ${b} / ${clamp(
    0.26 * particleStrength,
    0.16,
    0.58
  )})`;
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

    weatherContext.globalAlpha = clamp(particle.opacity * particleStrength, 0, 1);
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
  const particleStrength = state.weather.particleStrength || 1;
  const fogStrength = clamp(0.8 + particleStrength * 0.4, 0.8, 1.25);

  // Layered horizontal mist bands to avoid isolated bubble-like puffs.
  const horizonGlow = weatherContext.createLinearGradient(0, 0, 0, height);
  horizonGlow.addColorStop(0, `rgb(${r} ${g} ${b} / ${0.04 * fogStrength})`);
  horizonGlow.addColorStop(0.48, `rgb(${r} ${g} ${b} / ${0.16 * fogStrength})`);
  horizonGlow.addColorStop(1, `rgb(${r} ${g} ${b} / ${0.19 * fogStrength})`);
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
      clamp(
        particle.opacity *
          (0.82 + Math.sin(particle.phase * particle.shimmer) * 0.22) *
          fogStrength,
        0,
        0.9
      );
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
    ribbon.addColorStop(
      0.5,
      `rgb(${r} ${g} ${b} / ${(0.05 + index * 0.012) * fogStrength})`
    );
    ribbon.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
    weatherContext.fillStyle = ribbon;
    weatherContext.fillRect(0, y - 34, width, 68);
  }

  weatherContext.globalCompositeOperation = "source-over";
}

function getFrameThemeSnapshot() {
  if (state.currentTheme) {
    return state.currentTheme;
  }
  const now = new Date();
  const minuteOfDay = getEffectiveMinuteOfDay(
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  );
  return resolveTheme(minuteOfDay, now, {
    season: getEffectiveSeason(now),
  });
}

function renderWeatherFrame(timestamp) {
  const { width, height } = syncWeatherCanvasSize();
  const frameTheme = getFrameThemeSnapshot();
  drawSkyFrame(frameTheme, timestamp);
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
  const minuteOfDay = getEffectiveMinuteOfDay(snapshot.minuteOfDay);
  const season = getEffectiveSeason(now);
  const activeCinematicEvent = getActiveCinematicEvent();

  if (activeCinematicEvent) {
    const overrides = {
      season,
      weatherType: activeCinematicEvent.weatherType,
    };
    if (
      state.themeLock.enabled &&
      Number.isInteger(state.themeLock.variantIndex) &&
      state.themeLock.variantIndex >= 0 &&
      state.themeLock.variantIndex < DAILY_VARIANTS.length
    ) {
      overrides.variantIndex = state.themeLock.variantIndex;
    }
    return resolveTheme(minuteOfDay, now, overrides);
  }

  if (!state.themeLock.enabled) {
    return resolveTheme(minuteOfDay, now, {
      season,
    });
  }

  if (!isValidThemeLockState(state.themeLock)) {
    state.themeLock.enabled = false;
    persistThemeLockState();
    return resolveTheme(minuteOfDay, now, {
      season,
    });
  }

  const allowedWeatherTypes = getAllowedWeatherTypesForSeason(season);
  if (!allowedWeatherTypes.includes(state.themeLock.weatherType)) {
    state.themeLock.weatherType = allowedWeatherTypes[0];
    persistThemeLockState();
  }

  return resolveTheme(minuteOfDay, now, {
    season,
    variantIndex: state.themeLock.variantIndex,
    weatherType: state.themeLock.weatherType,
  });
}

function tick() {
  const now = new Date();
  const snapshot = createTimeSnapshot(now);
  if (Number.isFinite(state.debug.overrideMinuteOfDay)) {
    const debugMinuteOfDay = normalizeMinutes(
      getEffectiveMinuteOfDay(snapshot.minuteOfDay)
    );
    snapshot.minuteOfDay = debugMinuteOfDay;
    const debugHour = Math.floor(debugMinuteOfDay / 60);
    const debugMinute = Math.floor(debugMinuteOfDay % 60);
    snapshot.clockText = `${pad2(debugHour)}:${pad2(debugMinute)}`;
  }
  state.clockText = snapshot.clockText;

  const activeCinematicEvent = getActiveCinematicEvent();
  const theme = resolveActiveTheme(now, snapshot);
  recordDeveloperEvent("tick", {
    clock: snapshot.clockText,
    status: theme.status,
    season: theme.season,
    variant: theme.variant,
    weather: theme.weatherLabel,
    lock: state.themeLock.enabled ? "locked" : "auto",
    debugMinuteOverride: Number.isFinite(state.debug.overrideMinuteOfDay),
    debugSeasonOverride: state.debug.overrideSeason || "auto",
    debugCinematicEvent: activeCinematicEvent ? activeCinematicEvent.label : "auto",
    debugCinematicCycle: state.debug.cinematicCycleTimerId ? "on" : "off",
  });
  applyTheme(theme, snapshot);
  drawClock(snapshot.clockText);
  scheduleNextTick();
}

validateThemeSchedule(DAY_THEMES);
loadThemeLockState();
loadCinematicState();
installDeveloperConsoleApi();
setupThemeControlListeners();

window.addEventListener("resize", () => {
  drawClock(state.clockText);
  syncSkyCanvasSize();
  state.sky.lastFrameMs = 0;
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
    state.sky.lastFrameMs = 0;
  });
} else if (typeof prefersReducedMotionQuery.addListener === "function") {
  prefersReducedMotionQuery.addListener(() => {
    state.weather.lastFrameMs = 0;
    state.sky.lastFrameMs = 0;
  });
}

startWeatherAnimation();
tick();

if ("serviceWorker" in navigator) {
  let hasRefreshedForNewWorker = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasRefreshedForNewWorker) {
      return;
    }
    hasRefreshedForNewWorker = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((registration) => {
        registration.update().catch(() => {
          // Ignore update check failures.
        });
      })
      .catch(() => {
        // App works without a service worker. Ignore registration issues.
      });
  });
}
