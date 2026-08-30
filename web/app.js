// ============================================================
// HARDHOF DISC GOLF – WEB APP
// Course conflicts + glow recommendation
// ============================================================

const CONFIG = {

  // Cloudflare Worker proxy
  scheduleUrl:
    "https://hardhof-schedule.ale-distefano.workers.dev/",

  latitude: 47.393,
  longitude: 8.482,

  minutesPerHoleMin: 6,
  minutesPerHoleMax: 9,

  holes: 18,

  rules: [
    {
      tee: 1,
      field: "R 06",
      level: "caution",
      reason: "OB right"
    },
    {
      tee: 2,
      field: "R 08",
      level: "blocked",
      reason: "Fairway"
    },
    {
      tee: 4,
      field: "KR 09",
      level: "caution",
      reason: "Spectators"
    },
    {
      tee: 6,
      field: "R 11",
      level: "caution",
      reason: "OB right"
    },
    {
      tee: 8,
      field: "R 08",
      level: "blocked",
      reason: "Fairway"
    },
    {
      tee: 17,
      field: "R 02",
      level: "caution",
      reason: "OB left"
    },
    {
      tee: 18,
      field: "R 02",
      level: "blocked",
      reason: "OB right"
    }
  ]
};


// ============================================================
// STATE
// ============================================================

let startTime =
  new Date();

let scheduleRows =
  null;

let scheduleLoaded =
  false;


// ============================================================
// HELPERS
// ============================================================

function pad(number) {

  return String(number)
    .padStart(2, "0");
}


function formatTime(date) {

  return (
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}


function addMinutes(
  date,
  minutes
) {

  return new Date(
    date.getTime() +
    minutes * 60 * 1000
  );
}


function minutesSinceMidnight(
  date
) {

  return (
    date.getHours() * 60 +
    date.getMinutes()
  );
}


function nowWithoutSeconds() {

  const now =
    new Date();

  now.setSeconds(
    0,
    0
  );

  return now;
}


function rangesOverlap(
  startA,
  endA,
  startB,
  endB
) {

  return (
    startA < endB &&
    endA > startB
  );
}


// ============================================================
// START TIME
// ============================================================

function setStartFromOffset(
  offset
) {

  const now =
    nowWithoutSeconds();

  startTime =
    addMinutes(
      now,
      offset
    );

  document.getElementById(
    "customTime"
  ).value = "";

  render();
}


function setCustomTime(
  value
) {

  if (!value)
    return;


  const [
    hours,
    minutes
  ] =
    value
      .split(":")
      .map(Number);


  const candidate =
    new Date();


  candidate.setHours(
    hours,
    minutes,
    0,
    0
  );


  const now =
    nowWithoutSeconds();


  // ----------------------------------------------------------
  // NO PAST START TIMES
  // ----------------------------------------------------------

  if (
    candidate <
    now
  ) {

    alert(
      "Please choose a start time from now onwards."
    );


    document.getElementById(
      "customTime"
    ).value = "";


    return;
  }


  startTime =
    candidate;


  render();
}


// ============================================================
// ARRIVAL WINDOWS
// ============================================================

function arrivalWindow(
  tee
) {

  const holesBefore =
    tee - 1;


  const min =
    holesBefore *
    CONFIG.minutesPerHoleMin;


  const max =
    holesBefore *
    CONFIG.minutesPerHoleMax;


  return {

    start:
      addMinutes(
        startTime,
        min
      ),

    end:
      addMinutes(
        startTime,
        max
      )
  };
}


// ============================================================
// SUNSET
// ============================================================

function dayOfYear(
  date
) {

  const start =
    new Date(
      date.getFullYear(),
      0,
      0
    );


  return Math.floor(
    (
      date -
      start
    ) /
    86400000
  );
}


function normalizeDegrees(
  value
) {

  let result =
    value % 360;


  if (
    result < 0
  ) {

    result += 360;
  }


  return result;
}


function solarTime(
  date,
  latitude,
  longitude,
  zenith
) {

  const N =
    dayOfYear(date);


  const lngHour =
    longitude / 15;


  const t =
    N +
    (
      (18 - lngHour) /
      24
    );


  const M =
    (0.9856 * t) -
    3.289;


  let L =
    M +
    (
      1.916 *
      Math.sin(
        M *
        Math.PI /
        180
      )
    ) +
    (
      0.020 *
      Math.sin(
        2 *
        M *
        Math.PI /
        180
      )
    ) +
    282.634;


  L =
    normalizeDegrees(
      L
    );


  let RA =
    Math.atan(
      0.91764 *
      Math.tan(
        L *
        Math.PI /
        180
      )
    ) *
    180 /
    Math.PI;


  RA =
    normalizeDegrees(
      RA
    );


  const Lquadrant =
    Math.floor(
      L / 90
    ) * 90;


  const RAquadrant =
    Math.floor(
      RA / 90
    ) * 90;


  RA +=
    Lquadrant -
    RAquadrant;


  RA /= 15;


  const sinDec =
    0.39782 *
    Math.sin(
      L *
      Math.PI /
      180
    );


  const cosDec =
    Math.cos(
      Math.asin(
        sinDec
      )
    );


  const cosH =
    (
      Math.cos(
        zenith *
        Math.PI /
        180
      ) -
      (
        sinDec *
        Math.sin(
          latitude *
          Math.PI /
          180
        )
      )
    ) /
    (
      cosDec *
      Math.cos(
        latitude *
        Math.PI /
        180
      )
    );


  if (
    cosH < -1 ||
    cosH > 1
  ) {

    return null;
  }


  let H =
    Math.acos(
      cosH
    ) *
    180 /
    Math.PI;


  H /= 15;


  const T =
    H +
    RA -
    (
      0.06571 *
      t
    ) -
    6.622;


  let UT =
    T -
    lngHour;


  UT =
    (
      (
        UT % 24
      ) +
      24
    ) %
    24;


  const midnightUTC =
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0
    );


  return new Date(
    midnightUTC +
    UT *
    60 *
    60 *
    1000
  );
}


// ============================================================
// GLOW ANALYSIS
// ============================================================

function analyseGlow() {

  const sunset =
    solarTime(
      startTime,
      CONFIG.latitude,
      CONFIG.longitude,
      90.833
    );


  const fastFinish =
    addMinutes(
      startTime,
      CONFIG.holes *
      CONFIG.minutesPerHoleMin
    );


  const slowFinish =
    addMinutes(
      startTime,
      CONFIG.holes *
      CONFIG.minutesPerHoleMax
    );


  if (!sunset) {

    return {

      glowNeeded: false,

      lightTight: false,

      glowFromHole: null,

      sunset: null,

      fastFinish,
      slowFinish
    };
  }


  // ----------------------------------------------------------
  // WHOLE ROUND BEFORE SUNSET
  // ----------------------------------------------------------

  if (
    slowFinish <=
    sunset
  ) {

    return {

      glowNeeded: false,

      lightTight: false,

      glowFromHole: null,

      sunset,

      fastFinish,
      slowFinish
    };
  }


  // ----------------------------------------------------------
  // START IS ALREADY AFTER SUNSET
  // ----------------------------------------------------------

  if (
    startTime >=
    sunset
  ) {

    return {

      glowNeeded: true,

      lightTight: false,

      glowFromHole: 1,

      sunset,

      fastFinish,
      slowFinish
    };
  }


  // ----------------------------------------------------------
  // SUNSET DURING ROUND
  // ----------------------------------------------------------

  let glowFromHole =
    null;


  for (
    let tee = 1;
    tee <= CONFIG.holes;
    tee++
  ) {

    const latestArrival =
      addMinutes(
        startTime,
        (
          tee - 1
        ) *
        CONFIG.minutesPerHoleMax
      );


    if (
      latestArrival >=
      sunset
    ) {

      glowFromHole =
        tee;

      break;
    }
  }


  if (
    glowFromHole ===
    null
  ) {

    glowFromHole =
      CONFIG.holes;
  }


  return {

    glowNeeded: true,

    lightTight: true,

    glowFromHole,

    sunset,

    fastFinish,
    slowFinish
  };
}


// ============================================================
// SCHEDULE PARSING
// ============================================================

function parseTimeRange(
  text
) {

  const match =
    text.match(
      /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/
    );


  if (!match)
    return null;


  return {

    start:
      Number(
        match[1]
      ) *
      60 +
      Number(
        match[2]
      ),

    end:
      Number(
        match[3]
      ) *
      60 +
      Number(
        match[4]
      )
  };
}


// ============================================================
// LOAD SCHEDULE
// ============================================================

async function loadSchedule() {

  const fieldInfo =
    document.getElementById(
      "fieldInfo"
    );


  fieldInfo.textContent =
    "Checking schedule…";


  try {

    const response =
      await fetch(
        CONFIG.scheduleUrl,
        {
          cache:
            "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }


    const html =
      await response.text();


    const documentHTML =
      new DOMParser()
        .parseFromString(
          html,
          "text/html"
        );


    const bodyText =
      documentHTML
        .body
        ?.innerText
        ?.replace(
          /\s+/g,
          " "
        )
        .trim() ||
      "";


    // --------------------------------------------------------
    // IMPORTANT:
    // Successful request + "No data available"
    // means there are currently no bookings.
    //
    // This is FIELD CLEAR, not UNKNOWN.
    // --------------------------------------------------------

    if (
      bodyText
        .toLowerCase()
        .includes(
          "no data available"
        )
    ) {

      scheduleRows =
        [];

      scheduleLoaded =
        true;


      fieldInfo.textContent =
        "No football bookings";

      render();

      return;
    }


    scheduleRows =
      [
        ...documentHTML
          .querySelectorAll(
            "tr"
          )
      ]
        .map(
          row =>
            row
              .innerText
              .replace(
                /\s+/g,
                " "
              )
              .trim()
        )
        .filter(
          Boolean
        );


    scheduleLoaded =
      true;


    fieldInfo.textContent =
      "Live football schedule";


  } catch (
    error
  ) {

    console.warn(
      "Schedule unavailable:",
      error
    );


    scheduleRows =
      null;


    scheduleLoaded =
      false;


    fieldInfo.textContent =
      "Schedule unavailable";
  }


  render();
}


// ============================================================
// COURSE ANALYSIS
// ============================================================

function analyseRule(
  rule
) {

  const arrival =
    arrivalWindow(
      rule.tee
    );


  // True network / server failure
  if (
    !scheduleLoaded ||
    scheduleRows ===
      null
  ) {

    return {

      ...rule,

      arrival,

      status:
        "unknown"
    };
  }


  const relevantRows =
    scheduleRows.filter(
      row =>
        row.includes(
          rule.field
        )
    );


  const arrivalStart =
    minutesSinceMidnight(
      arrival.start
    );


  const arrivalEnd =
    minutesSinceMidnight(
      arrival.end
    );


  let affected =
    false;


  for (
    const row
    of relevantRows
  ) {

    const range =
      parseTimeRange(
        row
      );


    if (!range)
      continue;


    if (
      rangesOverlap(
        arrivalStart,
        arrivalEnd + 1,
        range.start,
        range.end
      )
    ) {

      affected =
        true;

      break;
    }
  }


  if (
    !affected
  ) {

    return {

      ...rule,

      arrival,

      status:
        "clear"
    };
  }


  return {

    ...rule,

    arrival,

    status:
      rule.level
  };
}


// ============================================================
// OVERALL COURSE STATUS
// ============================================================

function overallStatus(
  rules
) {

  if (
    rules.some(
      rule =>
        rule.status ===
        "blocked"
    )
  ) {

    return "restricted";
  }


  if (
    rules.some(
      rule =>
        rule.status ===
        "caution"
    )
  ) {

    return "caution";
  }


  if (
    rules.some(
      rule =>
        rule.status ===
        "unknown"
    )
  ) {

    return "unknown";
  }


  return "playable";
}

// ============================================================
// BEST STARTING TIME
// ============================================================

function arrivalWindowForStart(
  candidateStart,
  tee
) {

  const holesBefore =
    tee - 1;

  return {

    start:
      addMinutes(
        candidateStart,
        holesBefore *
        CONFIG.minutesPerHoleMin
      ),

    end:
      addMinutes(
        candidateStart,
        holesBefore *
        CONFIG.minutesPerHoleMax
      )
  };
}


function analyseRuleForStart(
  rule,
  candidateStart
) {

  const arrival =
    arrivalWindowForStart(
      candidateStart,
      rule.tee
    );


  if (
    !scheduleLoaded ||
    scheduleRows === null
  ) {

    return {
      ...rule,
      arrival,
      status: "unknown"
    };
  }


  const relevantRows =
    scheduleRows.filter(
      row =>
        row.includes(
          rule.field
        )
    );


  const arrivalStart =
    minutesSinceMidnight(
      arrival.start
    );


  const arrivalEnd =
    minutesSinceMidnight(
      arrival.end
    );


  for (
    const row
    of relevantRows
  ) {

    const range =
      parseTimeRange(
        row
      );


    if (!range)
      continue;


    if (
      rangesOverlap(
        arrivalStart,
        arrivalEnd + 1,
        range.start,
        range.end
      )
    ) {

      return {

        ...rule,

        arrival,

        status:
          rule.level
      };
    }
  }


  return {

    ...rule,

    arrival,

    status:
      "clear"
  };
}


function analyseCourseForStart(
  candidateStart
) {

  const rules =
    CONFIG.rules.map(
      rule =>
        analyseRuleForStart(
          rule,
          candidateStart
        )
    );


  return {

    rules,

    status:
      overallStatus(
        rules
      )
  };
}


function analyseGlowForStart(
  candidateStart
) {

  const originalStart =
    startTime;


  startTime =
    candidateStart;


  const result =
    analyseGlow();


  startTime =
    originalStart;


  return result;
}


// ------------------------------------------------------------
// SCORE ONE POSSIBLE START
// ------------------------------------------------------------

function evaluateCandidateStart(
  candidateStart
) {

  const course =
    analyseCourseForStart(
      candidateStart
    );


  if (
    course.status ===
      "restricted"
  ) {

    return {
      score: 99,
      course,
      glow: null
    };
  }


  if (
    course.status ===
      "unknown"
  ) {

    return {
      score: 99,
      course,
      glow: null
    };
  }


  const glow =
    analyseGlowForStart(
      candidateStart
    );


  // Course conflicts matter more than darkness.
  //
  // 0 = field clear + daylight
  // 1 = field clear + glow
  // 2 = caution + daylight
  // 3 = caution + glow

  let score;


  if (
    course.status ===
      "playable"
  ) {

    score =
      glow.glowNeeded
        ? 1
        : 0;

  } else {

    score =
      glow.glowNeeded
        ? 3
        : 2;
  }


  return {
    score,
    course,
    glow
  };
}


// ------------------------------------------------------------
// SEARCH TODAY
// ------------------------------------------------------------

function findBestStartingWindow() {

  if (
    !scheduleLoaded ||
    scheduleRows === null
  ) {

    return null;
  }


  const now =
    nowWithoutSeconds();


  // Round to next 5-minute point.
  const rounded =
    new Date(now);


  const remainder =
    rounded.getMinutes() % 5;


  if (
    remainder !== 0
  ) {

    rounded.setMinutes(
      rounded.getMinutes() +
      (5 - remainder)
    );
  }


  rounded.setSeconds(
    0,
    0
  );


  const endOfDay =
    new Date(now);


  endOfDay.setHours(
    23,
    55,
    0,
    0
  );


  const candidates =
    [];


  for (
    let candidate =
      new Date(rounded);

    candidate <=
      endOfDay;

    candidate =
      addMinutes(
        candidate,
        5
      )
  ) {

    const evaluation =
      evaluateCandidateStart(
        candidate
      );


    if (
      evaluation.score <
      99
    ) {

      candidates.push({

        time:
          new Date(
            candidate
          ),

        ...evaluation
      });
    }
  }


  if (
    candidates.length === 0
  ) {

    return {
      available: false
    };
  }


  const bestScore =
    Math.min(
      ...candidates.map(
        candidate =>
          candidate.score
      )
    );


  const best =
    candidates.filter(
      candidate =>
        candidate.score ===
        bestScore
    );


  // ----------------------------------------------------------
  // BUILD CONTINUOUS WINDOWS
  // ----------------------------------------------------------

  const windows =
    [];


  let current =
    null;


  for (
    const candidate
    of best
  ) {

    if (!current) {

      current = {

        from:
          candidate.time,

        to:
          candidate.time,

        score:
          bestScore
      };


      continue;
    }


    const difference =
      (
        candidate.time -
        current.to
      ) /
      60000;


    if (
      difference === 5
    ) {

      current.to =
        candidate.time;

    } else {

      windows.push(
        current
      );


      current = {

        from:
          candidate.time,

        to:
          candidate.time,

        score:
          bestScore
      };
    }
  }


  if (current) {

    windows.push(
      current
    );
  }


  // Prefer a window containing NOW.
  let selected =
    windows.find(
      window =>
        now >= window.from &&
        now <=
          addMinutes(
            window.to,
            5
          )
    );


  // Otherwise choose the earliest
  // highest-quality window.
  if (!selected) {

    selected =
      windows[0];
  }


  return {

    available: true,

    from:
      selected.from,

    to:
      selected.to,

    score:
      selected.score,

    glow:
      selected.score === 1 ||
      selected.score === 3,

    caution:
      selected.score >= 2
  };
}


// ------------------------------------------------------------
// DISPLAY BEST START
// ------------------------------------------------------------

function renderBestStartingTime() {

  const timeElement =
    document.getElementById(
      "bestStartTime"
    );


  const infoElement =
    document.getElementById(
      "bestStartInfo"
    );


  const button =
    document.getElementById(
      "useBestStart"
    );


  const best =
    findBestStartingWindow();


  if (!best) {

    timeElement.textContent =
      "CHECKING";

    infoElement.textContent =
      "Waiting for field schedule…";

    button.hidden =
      true;

    return;
  }


  if (
    !best.available
  ) {

    timeElement.textContent =
      "NO CLEAR WINDOW";

    infoElement.textContent =
      "No suitable start found today.";

    button.hidden =
      true;

    return;
  }


  const now =
    nowWithoutSeconds();


  const containsNow =
    now >= best.from &&
    now <=
      addMinutes(
        best.to,
        5
      );


  const fromLabel =
    containsNow
      ? "NOW"
      : formatTime(
          best.from
        );


  // +5 because a candidate at e.g. 17:10 means
  // approximately until 17:15 remains within window.
  const windowEnd =
    addMinutes(
      best.to,
      5
    );


  if (
    windowEnd >
    best.from
  ) {

    timeElement.textContent =
      `${fromLabel}–${formatTime(
        windowEnd
      )}`;

  } else {

    timeElement.textContent =
      fromLabel;
  }


  if (
    best.caution
  ) {

    infoElement.textContent =
      best.glow
        ? "Playable with caution · glow round"
        : "Playable with caution";

  } else {

    infoElement.textContent =
      best.glow
        ? "Field clear · glow round"
        : "Field clear · daylight";
  }


  button.hidden =
    containsNow;


  button.onclick =
    () => {

      startTime =
        new Date(
          best.from
        );


      document.getElementById(
        "customTime"
      ).value =
        formatTime(
          best.from
        );


      render();
    };
}

// ============================================================
// RENDER
// ============================================================

function render() {

  // ----------------------------------------------------------
  // START
  // ----------------------------------------------------------

  document.getElementById(
    "startTime"
  ).textContent =
    formatTime(
      startTime
    );


  // ----------------------------------------------------------
  // GLOW
  // ----------------------------------------------------------

  const glow =
    analyseGlow();


  const lightStatus =
    document.getElementById(
      "lightStatus"
    );


  const finishTime =
    document.getElementById(
      "finishTime"
    );


  const sunset =
    document.getElementById(
      "sunset"
    );


  const twilight =
    document.getElementById(
      "twilight"
    );


  finishTime.textContent =
    `Finish ${formatTime(
      glow.fastFinish
    )}–${formatTime(
      glow.slowFinish
    )}`;


  sunset.textContent =
    glow.sunset
      ? formatTime(
          glow.sunset
        )
      : "—";


  // Twilight no longer relevant.
  twilight.textContent =
    "";


  // ----------------------------------------------------------
  // NO LIGHT INFO IF GLOW IS NOT NEEDED
  // ----------------------------------------------------------

  if (
    !glow.glowNeeded
  ) {

    lightStatus.textContent =
      "";

    lightStatus.className =
      "light-status";

  } else if (
    glow.lightTight
  ) {

    lightStatus.innerHTML =
      `LIGHT TIGHT · <span class="glow-text">GLOW FROM T${glow.glowFromHole}</span>`;

    lightStatus.className =
      "light-status";

  } else {

    lightStatus.innerHTML =
      `<span class="glow-text">GLOW FROM T${glow.glowFromHole}</span>`;

    lightStatus.className =
      "light-status";
  }


  // ----------------------------------------------------------
  // FIELD RULES
  // ----------------------------------------------------------

  const analysedRules =
    CONFIG.rules.map(
      analyseRule
    );


  const teeList =
    document.getElementById(
      "teeList"
    );


  teeList.innerHTML =
    "";


  for (
    const rule
    of analysedRules
  ) {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "tee";


    const label =
      rule.status ===
        "blocked"
        ? "BLOCKED"
        : rule.status ===
          "caution"
        ? "CAUTION"
        : rule.status ===
          "clear"
        ? "CLEAR"
        : "UNKNOWN";


    row.innerHTML = `

      <div class="tee-name">
        T${rule.tee}
      </div>

      <div class="tee-window">
        ${formatTime(rule.arrival.start)}–${formatTime(rule.arrival.end)}
        · ${rule.field}
      </div>

      <div class="tee-status ${rule.status}">
        ${label}
      </div>
    `;


    teeList.appendChild(
      row
    );
  }


  // ----------------------------------------------------------
  // COURSE STATUS BADGE
  // ----------------------------------------------------------

  const status =
    overallStatus(
      analysedRules
    );


  const badge =
    document.getElementById(
      "statusBadge"
    );


  badge.className =
    `status ${status}`;


  badge.textContent =
    status ===
      "playable"
      ? "PLAYABLE"
      : status ===
        "caution"
      ? "CAUTION"
      : status ===
        "restricted"
      ? "RESTRICTED"
      : "SCHEDULE UNKNOWN";

    renderBestStartingTime();
}


// ============================================================
// EVENTS
// ============================================================

document
  .querySelectorAll(
    "[data-offset]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const offset =
            Number(
              button.dataset.offset
            );


          setStartFromOffset(
            offset
          );
        }
      );
    }
  );


document
  .getElementById(
    "customTime"
  )
  .addEventListener(
    "change",
    event => {

      setCustomTime(
        event.target.value
      );
    }
  );


document
  .getElementById(
    "refreshButton"
  )
  .addEventListener(
    "click",
    loadSchedule
  );


// ============================================================
// START
// ============================================================

startTime =
  nowWithoutSeconds();


render();

loadSchedule();