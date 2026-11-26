# Meridian Run — Sky Courier

[![Make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/dragonflarre/meridian-run-flight-game/rank.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/dragonflarre/meridian-run-flight-game/reward.svg)](https://make.fun/c/best-flight-game-20261126-0057)

A bush plane, a dusk valley, three sorties. **Meridian Run — Sky Courier** is a
complete 2D flight game in vanilla JavaScript — no libraries, no network
requests, no audio files. Everything (terrain, plane, instruments, sounds)
is generated in code.

## Play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome, or run `python3 -m http.server` inside `game/`.

- **1 — Ring Run:** fly through 10 gold rings before the clock runs out.
  Each ring is +100 points and +fuel.
- **2 — Supply Drop:** drop 3 crates (SPACE) into the marked zones.
  Crates open a red parachute; scoring depends on how close they land.
- **3 — Runway:** fly 4.8 km and land gently on the runway — a touchdown
  softer than 4.5 m/s down scores, softer than 2 m/s scores best.

## Flying

Honest arcade physics: throttle sets target speed, pitch sets climb and
descent. Below about 30 m/s the nose drops and the plane sinks — mind the
stall. Fuel burns fast at full throttle. A hard touch is a crash; a gentle
one is a landing. Three lives per sortie.

- **W/S** or **Up/Down** — throttle
- **A/D** or **Left/Right** — pitch
- **Mouse** — steer (mouse above the plane climbs), **wheel** — throttle
- **SPACE** — drop a crate / restart · **P** — pause · **R** — restart ·
  **M** — mute · **Enter / click** — start

The HUD shows mission, objective, score, timer and distance up top, and an
instrument panel below: airspeed in knots, altitude AGL in feet, vertical
speed, a compass tape, fuel and throttle bars, and lives — plus a flashing
STALL warning when slow.

## Screenshots

`?shot=menu|flight|drop|landing` freezes one deterministic frame per pose,
which is how the four screenshots in `screenshots/` were taken.

## Hand-in

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` (or
`$MAKEFUN_OUTPUT_DIR`) and writes `/output/dossier.json` with `buildDossier`
from `vendor/makefun-game.ts`.

Built for the [make.fun best flight game competition](https://make.fun/c/best-flight-game-20261126-0057).
