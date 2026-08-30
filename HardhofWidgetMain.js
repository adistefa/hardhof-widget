// ============================================================
// HARDHOF DISC GOLF – COURSE & DAYLIGHT CHECK
// Scriptable Widget
//
// TAP:
//   Now
//   +30 min
//   +60 min
//   Custom time
//
// Course pace:
//   6–9 minutes per hole
//
// Checks:
//   • Football field conflicts
//   • Estimated arrival at affected tees
//   • Sunset
//   • Civil twilight
//   • Estimated round finish
// ============================================================

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------

const CONFIG = {

  url:
    "https://www.sportanlagen-app.net/Public/Spielplan?k=6&m=GrünStadtZürich&size=1&tag=0",

  minutesPerHoleMin: 6,
  minutesPerHoleMax: 9,

  holes: 18,

  storageKey:
    "hardhof-discgolf-starttime",

  // Hardhof, Zürich
  latitude: 47.393,
  longitude: 8.482,

  rules: [

    {
      field: "R 06",
      hole: "T1",
      holeOffset: 0,
      severity: "warning",
      message: "OB right"
    },

    {
      field: "R 08",
      hole: "T2",
      holeOffset: 1,
      severity: "blocked",
      message: "Fairway"
    },

    {
      field: "KR 09",
      hole: "T4",
      holeOffset: 3,
      severity: "warning",
      message: "Spectators"
    },

    {
      field: "R 11",
      hole: "T6",
      holeOffset: 5,
      severity: "warning",
      message: "OB right"
    },

    {
      field: "R 08",
      hole: "T8",
      holeOffset: 7,
      severity: "blocked",
      message: "Fairway"
    },

    {
      field: "R 02",
      hole: "T17",
      holeOffset: 16,
      severity: "warning",
      message: "OB left"
    },

    {
      field: "R 02",
      hole: "T18",
      holeOffset: 17,
      severity: "blocked",
      message: "OB right"
    }

  ]
};


// ------------------------------------------------------------
// COLORS
// ------------------------------------------------------------

const COLORS = {

  background: new Color("#101114"),

  free: new Color("#8ED081"),
  warning: new Color("#F2C14E"),
  blocked: new Color("#FF5D5D"),

  primary: Color.white(),
  secondary: new Color("#A0A2A8"),
  muted: new Color("#696B72")
};


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function normalize(text) {

  return String(text ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function pad(value) {
  return String(value).padStart(2, "0");
}


function minutesToTime(minutes) {

  minutes =
    ((minutes % 1440) + 1440) % 1440;

  const h =
    Math.floor(minutes / 60);

  const m =
    minutes % 60;

  return `${pad(h)}:${pad(m)}`;
}


function timeToMinutes(value) {

  const match =
    String(value).match(
      /^(\d{1,2}):(\d{2})$/
    );

  if (!match)
    return null;

  const hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return (
    hours * 60 +
    minutes
  );
}


function getNowMinutes() {

  const now =
    new Date();

  return (
    now.getHours() * 60 +
    now.getMinutes()
  );
}


function dateToMinutes(date) {

  return (
    date.getHours() * 60 +
    date.getMinutes()
  );
}


// ------------------------------------------------------------
// START TIME STORAGE
// ------------------------------------------------------------

function saveStartMode(value) {

  Keychain.set(
    CONFIG.storageKey,
    value
  );
}


function loadStartMode() {

  if (
    !Keychain.contains(
      CONFIG.storageKey
    )
  ) {
    return "now";
  }

  return Keychain.get(
    CONFIG.storageKey
  );
}


function getStartMinutes() {

  const mode =
    loadStartMode();

  if (mode === "now") {

    return getNowMinutes();
  }


  if (
    mode.startsWith("time:")
  ) {

    const value =
      mode.substring(5);

    const minutes =
      timeToMinutes(value);

    if (minutes !== null) {

      return minutes;
    }
  }


  return getNowMinutes();
}


function isDynamicNow() {

  return (
    loadStartMode() === "now"
  );
}


// ------------------------------------------------------------
// TAP MENU
// ------------------------------------------------------------

async function chooseStartTime() {

  const now =
    getNowMinutes();


  const alert =
    new Alert();


  alert.title =
    "Hardhof";

  alert.message =
    "When do you want to start at T1?";


  alert.addAction(
    `Now · ${minutesToTime(now)}`
  );

  alert.addAction(
    `+30 min · ${minutesToTime(now + 30)}`
  );

  alert.addAction(
    `+60 min · ${minutesToTime(now + 60)}`
  );

  alert.addAction(
    "Custom start time"
  );

  alert.addCancelAction(
    "Cancel"
  );


  const choice =
    await alert.presentSheet();


  if (choice === 0) {

    saveStartMode("now");

    return true;
  }


  if (choice === 1) {

    saveStartMode(
      "time:" +
      minutesToTime(now + 30)
    );

    return true;
  }


  if (choice === 2) {

    saveStartMode(
      "time:" +
      minutesToTime(now + 60)
    );

    return true;
  }


  if (choice === 3) {

    return await askCustomTime();
  }


  return false;
}


// ------------------------------------------------------------
// CUSTOM START TIME
// ------------------------------------------------------------

async function askCustomTime() {

  const alert =
    new Alert();


  alert.title =
    "Start time";

  alert.message =
    "Enter time as HH:MM";


  alert.addTextField(
    "e.g. 14:30",
    minutesToTime(
      getStartMinutes()
    )
  );


  alert.addAction(
    "Apply"
  );

  alert.addCancelAction(
    "Cancel"
  );


  const result =
    await alert.presentAlert();


  if (result !== 0)
    return false;


  const value =
    alert
      .textFieldValue(0)
      .trim();


  const minutes =
    timeToMinutes(value);


  if (minutes === null) {

    const error =
      new Alert();

    error.title =
      "Invalid time";

    error.message =
      "Please enter e.g. 14:30.";

    error.addAction("OK");

    await error.presentAlert();

    return await askCustomTime();
  }


  saveStartMode(
    "time:" +
    minutesToTime(minutes)
  );


  return true;
}


// ============================================================
// SUN / DAYLIGHT
// ============================================================
//
// Local astronomical calculation.
// No additional web service required.
//
// Returns:
// sunset
// civilTwilightEnd
//
// ------------------------------------------------------------

function toRadians(degrees) {

  return degrees *
    Math.PI / 180;
}


function toDegrees(radians) {

  return radians *
    180 / Math.PI;
}


function normalizeDegrees(value) {

  value %= 360;

  if (value < 0)
    value += 360;

  return value;
}


function dayOfYear(date) {

  const start =
    new Date(
      date.getFullYear(),
      0,
      0
    );

  const diff =
    date - start;

  return Math.floor(
    diff / 86400000
  );
}


// ------------------------------------------------------------
// NOAA-style sunset calculation
// ------------------------------------------------------------

function calculateSunTime(
  date,
  latitude,
  longitude,
  zenith
) {

  const N =
    dayOfYear(date);


  // Approximate time
  const lngHour =
    longitude / 15;


  const t =
    N +
    (
      (18 - lngHour) /
      24
    );


  // Mean anomaly
  const M =
    (0.9856 * t) -
    3.289;


  // True longitude
  let L =
    M +
    (
      1.916 *
      Math.sin(
        toRadians(M)
      )
    ) +
    (
      0.020 *
      Math.sin(
        toRadians(2 * M)
      )
    ) +
    282.634;


  L =
    normalizeDegrees(L);


  // Right ascension
  let RA =
    toDegrees(
      Math.atan(
        0.91764 *
        Math.tan(
          toRadians(L)
        )
      )
    );


  RA =
    normalizeDegrees(RA);


  const Lquadrant =
    Math.floor(L / 90) * 90;


  const RAquadrant =
    Math.floor(RA / 90) * 90;


  RA =
    RA +
    (
      Lquadrant -
      RAquadrant
    );


  RA =
    RA / 15;


  // Declination
  const sinDec =
    0.39782 *
    Math.sin(
      toRadians(L)
    );


  const cosDec =
    Math.cos(
      Math.asin(
        sinDec
      )
    );


  // Local hour angle
  const cosH =

    (
      Math.cos(
        toRadians(zenith)
      ) -

      (
        sinDec *
        Math.sin(
          toRadians(latitude)
        )
      )

    ) /

    (
      cosDec *
      Math.cos(
        toRadians(latitude)
      )
    );


  // No sunset
  if (
    cosH > 1 ||
    cosH < -1
  ) {

    return null;
  }


  // Sunset = arccos
  let H =
    toDegrees(
      Math.acos(cosH)
    );


  H =
    H / 15;


  // Local mean time
  const T =
    H +
    RA -
    (
      0.06571 * t
    ) -
    6.622;


  // UTC
  let UT =
    T -
    lngHour;


  UT %= 24;

  if (UT < 0)
    UT += 24;


  // Build UTC date
  const utcHours =
    Math.floor(UT);


  const utcMinutesFloat =
    (UT - utcHours) * 60;


  const utcMinutes =
    Math.floor(
      utcMinutesFloat
    );


  const utcSeconds =
    Math.round(
      (
        utcMinutesFloat -
        utcMinutes
      ) * 60
    );


  const result =
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        utcHours,
        utcMinutes,
        utcSeconds
      )
    );


  return result;
}


// ------------------------------------------------------------
// SUN DATA
// ------------------------------------------------------------

function getSunData() {

  const today =
    new Date();


  // Official sunset:
  // sun centre approx 0.833° below horizon
  const sunset =
    calculateSunTime(
      today,
      CONFIG.latitude,
      CONFIG.longitude,
      90.833
    );


  // Civil twilight:
  // sun 6° below horizon
  const civilTwilightEnd =
    calculateSunTime(
      today,
      CONFIG.latitude,
      CONFIG.longitude,
      96
    );


  return {
    sunset,
    civilTwilightEnd
  };
}


// ------------------------------------------------------------
// DAYLIGHT STATUS
// ------------------------------------------------------------

function analyseDaylight(
  startMinutes,
  sunData
) {

  // 18 holes × 6–9 minutes
  const fastFinish =
    startMinutes +
    (
      CONFIG.holes *
      CONFIG.minutesPerHoleMin
    );


  const slowFinish =
    startMinutes +
    (
      CONFIG.holes *
      CONFIG.minutesPerHoleMax
    );


  if (
    !sunData.sunset ||
    !sunData.civilTwilightEnd
  ) {

    return {

      level: "warning",

      label:
        "LIGHT UNKNOWN",

      fastFinish,
      slowFinish,

      sunsetMinutes: null,
      twilightMinutes: null
    };
  }


  const sunsetMinutes =
    dateToMinutes(
      sunData.sunset
    );


  const twilightMinutes =
    dateToMinutes(
      sunData.civilTwilightEnd
    );


  // Even fastest round ends after civil twilight
  if (
    fastFinish >
    twilightMinutes
  ) {

    return {

      level: "blocked",

      label:
        "TOO LATE",

      fastFinish,
      slowFinish,

      sunsetMinutes,
      twilightMinutes
    };
  }


  // Slow round ends after civil twilight
  if (
    slowFinish >
    twilightMinutes
  ) {

    return {

      level: "warning",

      label:
        "DAYLIGHT RISK",

      fastFinish,
      slowFinish,

      sunsetMinutes,
      twilightMinutes
    };
  }


  // Slow round ends after sunset
  if (
    slowFinish >
    sunsetMinutes
  ) {

    return {

      level: "warning",

      label:
        "LIGHT TIGHT",

      fastFinish,
      slowFinish,

      sunsetMinutes,
      twilightMinutes
    };
  }


  return {

    level: "free",

    label:
      "LIGHT OK",

    fastFinish,
    slowFinish,

    sunsetMinutes,
    twilightMinutes
  };
}


// ============================================================
// SPORTS FIELD DATA
// ============================================================

function findTimeRange(text) {

  const match =
    text.match(
      /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/
    );


  if (!match)
    return null;


  const fromMinutes =
    timeToMinutes(
      match[1]
    );


  const toMinutes =
    timeToMinutes(
      match[2]
    );


  if (
    fromMinutes === null ||
    toMinutes === null
  ) {

    return null;
  }


  return {

    from: match[1],
    to: match[2],

    fromMinutes,
    toMinutes
  };
}


// ------------------------------------------------------------
// OVERLAP
// ------------------------------------------------------------

function overlaps(
  arrivalFrom,
  arrivalTo,
  bookingFrom,
  bookingTo
) {

  if (
    arrivalFrom ===
    arrivalTo
  ) {

    return (
      arrivalFrom >= bookingFrom &&
      arrivalFrom < bookingTo
    );
  }


  return (
    arrivalFrom < bookingTo &&
    arrivalTo > bookingFrom
  );
}


// ------------------------------------------------------------
// LOAD HARDHOF SCHEDULE
// ------------------------------------------------------------

async function loadRows() {

  const web =
    new WebView();


  await web.loadURL(
    CONFIG.url
  );


  await new Promise(
    resolve =>
      Timer.schedule(
        1.2,
        false,
        resolve
      )
  );


  const rows =
    await web.evaluateJavaScript(`

      (() => {

        const result = [];

        document
          .querySelectorAll("tr")
          .forEach(tr => {

            const cells =
              Array.from(
                tr.querySelectorAll(
                  "th, td"
                )
              )
              .map(
                td =>
                  td.innerText.trim()
              );


            if (
              cells.length > 0
            ) {

              result.push(
                cells.join(" | ")
              );
            }

          });


        if (
          result.length === 0
        ) {

          return document
            .body
            .innerText
            .split("\\n")
            .filter(
              x =>
                x.trim().length
            );
        }


        return result;

      })();

    `);


  return rows.map(
    normalize
  );
}


// ------------------------------------------------------------
// ARRIVAL WINDOW
// ------------------------------------------------------------

function arrivalWindow(
  startMinutes,
  holeOffset
) {

  const min =
    startMinutes +
    holeOffset *
    CONFIG.minutesPerHoleMin;


  const max =
    startMinutes +
    holeOffset *
    CONFIG.minutesPerHoleMax;


  return {

    fromMinutes: min,
    toMinutes: max,

    from:
      minutesToTime(min),

    to:
      minutesToTime(max)
  };
}


// ------------------------------------------------------------
// ANALYSE RULE
// ------------------------------------------------------------

function analyseRule(
  rule,
  rows,
  startMinutes
) {

  const arrival =
    arrivalWindow(
      startMinutes,
      rule.holeOffset
    );


  const matchingRows =
    rows.filter(
      row =>
        row.includes(
          rule.field
        )
    );


  const conflicts = [];


  for (
    const row
    of matchingRows
  ) {

    const booking =
      findTimeRange(row);


    if (!booking)
      continue;


    if (
      overlaps(
        arrival.fromMinutes,
        arrival.toMinutes,
        booking.fromMinutes,
        booking.toMinutes
      )
    ) {

      conflicts.push({
        from: booking.from,
        to: booking.to,
        row
      });
    }
  }


  return {

    ...rule,

    arrival,

    conflicts,

    affected:
      conflicts.length > 0
  };
}


// ------------------------------------------------------------
// COURSE ANALYSIS
// ------------------------------------------------------------

function analyseCourse(
  rows,
  startMinutes
) {

  return CONFIG.rules.map(
    rule =>
      analyseRule(
        rule,
        rows,
        startMinutes
      )
  );
}


// ------------------------------------------------------------
// COURSE STATUS
// ------------------------------------------------------------

function overallStatus(results) {

  const affected =
    results.filter(
      x => x.affected
    );


  if (
    affected.some(
      x =>
        x.severity ===
        "blocked"
    )
  ) {

    return {

      level:
        "blocked",

      title:
        "RESTRICTED",

      subtitle:
        "Course partially blocked"
    };
  }


  if (
    affected.some(
      x =>
        x.severity ===
        "warning"
    )
  ) {

    return {

      level:
        "warning",

      title:
        "CAUTION",

      subtitle:
        "Course playable with caution"
    };
  }


  return {

    level:
      "free",

    title:
      "PLAYABLE",

    subtitle:
      "No field conflicts expected"
  };
}


// ============================================================
// WIDGET HELPERS
// ============================================================

function addText(
  stack,
  value,
  size,
  color,
  weight = "regular"
) {

  const text =
    stack.addText(value);


  text.font =
    weight === "bold"
      ? Font.boldSystemFont(size)
      : Font.systemFont(size);


  text.textColor =
    color;


  text.lineLimit = 1;


  return text;
}


function arrivalLabel(result) {

  if (
    result.arrival.from ===
    result.arrival.to
  ) {

    return result.arrival.from;
  }


  return (
    `${result.arrival.from}–` +
    `${result.arrival.to}`
  );
}


// ------------------------------------------------------------
// TAP URL
// ------------------------------------------------------------

function getTapURL() {

  const scriptName =
    encodeURIComponent(
      Script.name()
    );


  return (
    `scriptable:///run?scriptName=${scriptName}` +
    `&action=choose`
  );
}


// ============================================================
// WIDGET
// ============================================================

function makeWidget(
  results,
  status,
  daylight,
  startMinutes
) {

  const widget =
    new ListWidget();


  widget.backgroundColor =
    COLORS.background;


  widget.setPadding(
    12,
    15,
    11,
    15
  );


  widget.url =
    getTapURL();


  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  const header =
    widget.addStack();


  header.layoutHorizontally();

  header.centerAlignContent();


  const title =
    header.addStack();


  title.layoutVertically();


  addText(
    title,
    "HARDHOF",
    10,
    COLORS.secondary,
    "bold"
  );


  addText(
    title,
    status.title,
    21,
    COLORS[
      status.level
    ],
    "bold"
  );


  header.addSpacer();


  const start =
    header.addStack();


  start.layoutVertically();


  addText(
    start,
    isDynamicNow()
      ? "START NOW"
      : "START",
    8,
    COLORS.secondary,
    "bold"
  );


  addText(
    start,
    minutesToTime(
      startMinutes
    ),
    16,
    COLORS.primary,
    "bold"
  );


  widget.addSpacer(3);


  addText(
    widget,
    status.subtitle,
    9,
    COLORS.secondary
  );


  widget.addSpacer(7);


  // ----------------------------------------------------------
  // DAYLIGHT
  // ----------------------------------------------------------

  const lightRow =
    widget.addStack();


  lightRow.layoutHorizontally();

  lightRow.centerAlignContent();


  addText(
    lightRow,
    "☀",
    11,
    COLORS[
      daylight.level
    ]
  );


  lightRow.addSpacer(5);


  addText(
    lightRow,
    daylight.label,
    10,
    COLORS[
      daylight.level
    ],
    "bold"
  );


  lightRow.addSpacer();


  if (
    daylight.sunsetMinutes !==
    null
  ) {

    addText(
      lightRow,
      `Sunset ${minutesToTime(
        daylight.sunsetMinutes
      )}`,
      9,
      COLORS.secondary
    );
  }


  widget.addSpacer(3);


  const finishRow =
    widget.addStack();


  finishRow.layoutHorizontally();


  addText(
    finishRow,
    "Finish",
    9,
    COLORS.secondary
  );


  finishRow.addSpacer(5);


  addText(
    finishRow,
    `${minutesToTime(
      daylight.fastFinish
    )}–${minutesToTime(
      daylight.slowFinish
    )}`,
    9,
    COLORS.primary,
    "bold"
  );


  finishRow.addSpacer();


  if (
    daylight.twilightMinutes !==
    null
  ) {

    addText(
      finishRow,
      `Twilight ${minutesToTime(
        daylight.twilightMinutes
      )}`,
      8,
      COLORS.muted
    );
  }


  widget.addSpacer(7);


  // ----------------------------------------------------------
  // FIELD CONFLICTS
  // ----------------------------------------------------------

  const affected =
    results.filter(
      x => x.affected
    );


  if (
    affected.length === 0
  ) {

    const line =
      widget.addStack();


    line.layoutHorizontally();

    line.centerAlignContent();


    addText(
      line,
      "●",
      10,
      COLORS.free
    );


    line.addSpacer(5);


    addText(
      line,
      "18 holes",
      12,
      COLORS.primary,
      "bold"
    );


    line.addSpacer(6);


    addText(
      line,
      "FIELD CLEAR",
      9,
      COLORS.free,
      "bold"
    );

  } else {

    affected.sort(
      (a, b) => {

        if (
          a.severity ===
            "blocked" &&
          b.severity !==
            "blocked"
        )
          return -1;


        if (
          b.severity ===
            "blocked" &&
          a.severity !==
            "blocked"
        )
          return 1;


        return (
          a.holeOffset -
          b.holeOffset
        );
      }
    );


    for (
      const item
      of affected.slice(0, 4)
    ) {

      const row =
        widget.addStack();


      row.layoutHorizontally();

      row.centerAlignContent();


      const color =
        item.severity ===
        "blocked"
          ? COLORS.blocked
          : COLORS.warning;


      addText(
        row,
        "●",
        9,
        color
      );


      row.addSpacer(5);


      addText(
        row,
        item.hole,
        12,
        COLORS.primary,
        "bold"
      );


      row.addSpacer(5);


      addText(
        row,
        arrivalLabel(item),
        9,
        COLORS.secondary
      );


      row.addSpacer();


      addText(
        row,
        item.severity ===
          "blocked"
          ? "BLOCKED"
          : "CAUTION",
        9,
        color,
        "bold"
      );


      widget.addSpacer(2);
    }
  }


  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  widget.addSpacer();


  addText(
    widget,
    "Tap · change start time",
    8,
    COLORS.muted
  );


  return widget;
}


// ============================================================
// ERROR WIDGET
// ============================================================

function errorWidget(
  startMinutes
) {

  const widget =
    new ListWidget();


  widget.backgroundColor =
    COLORS.background;


  widget.setPadding(
    15,
    15,
    15,
    15
  );


  widget.url =
    getTapURL();


  addText(
    widget,
    "HARDHOF",
    10,
    COLORS.secondary,
    "bold"
  );


  addText(
    widget,
    "STATUS UNKNOWN",
    20,
    COLORS.warning,
    "bold"
  );


  widget.addSpacer(5);


  addText(
    widget,
    `Start ${minutesToTime(
      startMinutes
    )}`,
    11,
    COLORS.primary
  );


  widget.addSpacer(3);


  addText(
    widget,
    "Schedule unavailable",
    10,
    COLORS.secondary
  );


  return widget;
}


// ============================================================
// MAIN
// ============================================================

// Widget tapped
if (
  !config.runsInWidget &&
  args.queryParameters.action ===
    "choose"
) {

  const changed =
    await chooseStartTime();


  if (!changed) {

    Script.complete();

    return;
  }
}


const startMinutes =
  getStartMinutes();


try {

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const rows =
    await loadRows();


  const results =
    analyseCourse(
      rows,
      startMinutes
    );


  const status =
    overallStatus(
      results
    );


  const sunData =
    getSunData();


  const daylight =
    analyseDaylight(
      startMinutes,
      sunData
    );


  // ----------------------------------------------------------
  // WIDGET
  // ----------------------------------------------------------

  const widget =
    makeWidget(
      results,
      status,
      daylight,
      startMinutes
    );


  // Refresh approx every 5 minutes
  widget.refreshAfterDate =
    new Date(
      Date.now() +
      5 * 60 * 1000
    );


  if (
    config.runsInWidget
  ) {

    Script.setWidget(
      widget
    );

  } else {

    await widget.presentMedium();
  }


} catch (error) {

  console.error(error);


  const widget =
    errorWidget(
      startMinutes
    );


  if (
    config.runsInWidget
  ) {

    Script.setWidget(
      widget
    );

  } else {

    await widget.presentMedium();
  }
}


Script.complete();