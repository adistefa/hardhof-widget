# 🥏 Hardhof Disc Golf Widget

A Scriptable widget for checking whether the **Hardhof Disc Golf Course in Zürich** is playable for a selected start time.

The widget checks the current football field schedule and estimates whether football activities may affect your round.

It also considers **sunset, civil twilight and estimated round duration**.

---

## What it does

Choose your planned start time and the widget estimates when you will reach the affected tees.

The calculation assumes approximately **6–9 minutes per hole**.

The widget checks:

- Current Hardhof football field bookings
- Estimated arrival time at affected tees
- Blocked fairways
- Areas requiring caution
- Estimated 18-hole finish time
- Sunset
- Civil twilight
- Remaining daylight

---

## Hardhof course rules

| Football field | Disc Golf impact |
|---|---|
| **R 06** | T1 — CAUTION · OB right |
| **R 08** | T2 — BLOCKED · Fairway |
| **KR 09** | T4 — CAUTION · Spectators may stand in fairway |
| **R 11** | T6 — CAUTION · OB right |
| **R 08** | T8 — BLOCKED · Fairway |
| **R 02** | T17 — CAUTION · OB left |
| **R 02** | T18 — BLOCKED · OB right |

---

## Course status

### 🟢 PLAYABLE

No relevant football field conflicts are expected during your round.

### 🟡 CAUTION

The course should remain playable, but football activity may affect safety around one or more tees.

### 🔴 RESTRICTED

At least one fairway is expected to be blocked when you reach it.

---

## Daylight

The widget estimates your finish time based on a pace of **6–9 minutes per hole**.

Possible daylight statuses:

- 🟢 `LIGHT OK`
- 🟡 `LIGHT TIGHT`
- 🟡 `DAYLIGHT RISK`
- 🔴 `TOO LATE`

Sunset and civil twilight are calculated for Hardhof in Zürich.

---

# Installation

## 1. Install Scriptable

Install **Scriptable** on your iPhone or iPad.

https://scriptable.app/

---

## 2. Install the Hardhof Widget

Run the provided:

```text
install.js