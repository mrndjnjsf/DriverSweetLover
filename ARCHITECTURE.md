# Architecture

The browser page in `index.html` starts `src/main.js`. The main module owns the render loop, controller polling, HUD, and wiring between pure game rules and the scene. Gameplay defaults now live in `src/config/`; `TUNING.md` explains the supported knobs. The driving dashboard has its own cached renderer in `src/driving-hud.js`. Main still coordinates scene, phone, audio, and input; those remain candidates for later extraction.

## Modules

| Area | Files | Responsibility |
| --- | --- | --- |
| Gameplay configuration | `src/config/vehicles.js`, `driving.js`, `gameplay.js`, `maintenance.js`, `economy.js` | Shared vehicle specs, input feel, physics, wear, economy, and runtime budgets |
| Driving HUD / owned resources | `src/driving-hud.js`, `src/scene-resources.js` | Change-only display writes and car resource disposal |
| Drivetrain and movement | `src/physics.js` | Engine, clutch coupling, gears, straight/grid steering, reverse, stalls, over-rev |
| Shifter and clutch controls | `src/shifter.js`, `src/mouse-shifter.js`, `src/clutch-input.js` | H-pattern state, mouse gate, Neutral timing, direct/pressure clutch modes |
| Vehicle condition and fuel | `src/condition.js`, `src/fuel.js` | Parts, wear, fuel use and pricing, oil service, damage, upgrade effects, quotes |
| Career | `src/career.js` | Separate vehicle condition, money, purchases, deliveries, citations, save validation |
| Map model | `src/grid-map.js` | Seeded 50 × 50 grid, roads, districts, locations, routes, validation |
| City view and editor | `src/grid-world.js`, `src/map-editor.js` | Nearby instanced world geometry and the overhead editor |
| Traffic and impacts | `src/traffic.js`, `src/traffic-view.js`, `src/collision.js` | Bounded street traffic, signals, roadside fixtures, and contact detection |
| Road events | `src/road-events.js`, `src/road-events-view.js` | Seeded nearby hazards, safe animal/pedestrian cues, and pooled models |
| Police | `src/police.js`, `src/police-view.js` | Bounded parked observers, violations, and pooled cruiser models |
| City time | `src/time-of-day.js` | Saved time progression and daylight curve |
| Night drag | `src/drag-race.js`, `src/drag-race-view.js` | Straight-course selection, staging, countdown, ghost timing, finish rules, and markers |
| Parking and needs | `src/parking.js`, `src/needs.js`, `src/presentation/parking-view.js` | Derived accessible bays, footprint/settle checks, parked obstacles, active-time need, free/paid service |
| Life session | `src/life-session.js`, `src/parked-contact.js` | Headless needs/parking/rival lifecycle, reset semantics, sustained parked-contact latch |
| Ownership and employee work | `src/fleet.js`, `src/config/fleet.js`, `src/fleet-phone-view.js` | Separate owned IDs/models, race friendships, seeded coarse work/service quotes, itemized phone screens; transactions commit through career.js |
| City projects | `src/city-projects.js`, `src/city-phone-view.js`, `src/presentation/city-project-view.js`, `src/speed-cameras.js` | Receipt-derived funding/unlocks, park artwork, road benefits, camera tradeoff |
| Black-car rival | `src/rival.js`, `src/presentation/rival-view.js` | Encounter/acceptance/result rules, respect feedback, loss need consequence |
| Generic skins | `src/generic-car-model.js`, `src/config/appearance.js`, `assets/skins/` | Versioned coupe/sedan UV atlas, owned asynchronous SVG textures |
| Presentation | `src/main.js`, `src/*-model.js`, `src/engine-audio.js`, `src/feedback.js`, `src/camera-response.js` | Car meshes, HUD, audio, rumble, camera, world updates |

The `tests/` directory checks rule-level behavior, including clutch wear, service transactions, payout idempotency, map connectivity, driving, and shifter timing. Use `node --test tests/*.test.mjs` before merging changes.

## Units and data

Physics uses metres, seconds, metres/second, radians, and RPM. The HUD converts speed to MPH. Vehicle health is 0–1. Career money is integer cents. A career save has a schema version and validated wallet history; a map export has its own version and validation. Map intersections use columns/rows and world coordinates; `gridPoint` is the conversion boundary.

The career and map save independently in browser local storage. Never change a persisted field without a migration plan. Import validators must reject unsupported or disconnected maps. An invalid career save stays untouched until the player chooses to replace it.

Bathroom and donation debits use idempotent career transactions. City project totals derive from validated donation receipts. Need and cosmetic respect remain session-only; car switching preserves the player's need. Appearance now belongs to each saved owned instance. Sandbox mode never writes test purchases to the saved career. Parking sites derive from connected map locations and rebuild when the map changes. Parking contacts are checked in driving substeps with a sustained-contact latch; visual meshes do not decide bay validity.

Career schema 2 keeps the original storage key. `vehicles` maps owned IDs to condition; `condition.vehicleId` is the mechanics model. `vehicleMeta` holds model/appearance, and `activeVehicleId` identifies the driven instance. The original `eclipse`/`civic` IDs remain starter cars for compatibility. `activeVehicle(career)` resolves the selected condition. All mutable copies deep-copy every owned car and driver; service/fuel receipts identify the instance. Migration preserves version-one conditions, fuel, wallet, jobs, and receipts. The first version-two write retains the original string at `<save-key>:backup:v1` before replacing it.

Driver wins refer to unique paid race receipts; main awards these friendships only for black-car wins. Assignments require an available spare car and the city/win unlock. Assignment and driving cannot refer to the same instance. `advanceFleet` receives bounded active time and runs once per simulated second; it resolves one deterministic work event per interval without scene meshes or routes. Fuel is replaced from gross receipts, reserve deposits reduce distributable net, maintenance spends the reserve, and owner/driver shares are recorded together. Work clocks/sequence numbers and receipts survive reload; there is no elapsed-wall-clock or offline payout. Reclaim clears unfinished work, retaining completed receipts and reserves.

`createLifeSession()` owns needs, parking readiness, and rival state. `advanceLifeSession(session, dt, context)` advances them with explicit active time, map, sites, car pose, and encounter eligibility. Paused calls do not advance timers. `resetLifeLocations()` clears parking and invitations while retaining need and respect. These rules run in Node with no renderer; the rest of the driving/session orchestration still lives in main.js. This is a tested partial extraction, not complete engine portability.

## Runtime boundaries

The render loop runs the simulation in outer substeps of at most 10 ms, with 2.5 ms drivetrain integration, then updates wear periodically. Scene geometry near the player is pooled; map data covers all 2,500 intersections. Drawing, collision, routing, and job locations must use the same world coordinates. The prior visual scenery multiplier belongs only to the old straight-road prototype and is not used by grid mode.

Before increasing traffic density or road-event count, define a frame-time budget and check sustained driving on target hardware. Before publishing, choose a code license, audit asset licenses, add a reproducible build and continuous integration, and test on physical target devices.

## Maintenance checks

`node scripts/check.mjs` checks first-party JavaScript syntax. `node --test tests/*.test.mjs` runs the rule and regression tests. `node scripts/benchmark.mjs` measures the torque hot path and prints driving snapshots; see `PERFORMANCE.md` for measured results and limitations. Existing imports from physics/condition/fuel keep their compatibility exports. Career format is version 2 with a validated version-one migration; its storage key stays unchanged.

## Player vehicle presentation boundary

`src/presentation/vehicle-view.js` now owns player-car artwork selection, model lifetime, transform, and wheel animation. Main supplies scalar view data; the adapter never mutates simulation state. `VEHICLE_ART` is the presentation registry; colors in the mechanics catalog remain legacy compatibility fields. Model materials are per instance. `tests/simulation-boundary.test.mjs` guards core rule dependency graphs against presentation/browser coupling; `tests/vehicle-view.test.mjs` checks independent ownership, replacement cleanup, and scalar input. Main still owns broader orchestration, scene, camera, effects, audio, and phone work. See MASTER_PLAN.md for the staged headless-session extraction, and ART_PIPELINE.md for the proposed asset contract.

The opening tutorial uses the headless `intro.js` state machine (drive → brake → final-drive → crash → replacement) with separate config. Its temporary Mustang career never enters normal career saving. The main adapter stages the impact and restores the retained original career when the player accepts the Eclipse. `automatic-transmission.js` supplies shift scheduling and converter coupling only for vehicles marked automatic; the existing manual branch remains intact. Mustang art uses the same disposable vehicle-view adapter as the manual cars.

Starter ownership: new careers contain one provisional manual car until `chooseStarter` confirms Eclipse or Civic. `starterVehicleIds` records free ownership; all other cars require a purchase receipt. Starter choice is saved with the career and cannot replace a career with progression. Older saves lacking these fields are migrated as already chosen and retain their existing free starter cars. The tutorial replacement adapter preserves the selected starter and restored progression.
