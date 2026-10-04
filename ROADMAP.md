# Driver Sweet Lover: driving RPG roadmap

Planning baseline: 2026-09-28. These are full acceptance criteria; an unchecked task may have a playable first pass but is not complete end to end.

Checkpoint update: the first playable slice has a 50 × 50 editable grid, turnable driving, keyboard H-pattern, L3 pressure clutch, one delivery loop, basic wear/service, separate car condition, and local saves. The city now has nearby traffic, signal-controlled junctions, day/night lighting, bumper impacts, five paced road-event types, and observable police citations. A night-only 400 m drag race adds staging, false starts, a timed ghost, and one-time payouts. Traffic avoidance, deeper police behavior, more jobs and races, mobile polish, and release infrastructure remain future work. Physical-controller feel, performance, and economy pacing still need player feedback.

## Direction

A single-player browser driving RPG built around enjoyable manual shifting and clutch control. Keep the Eclipse V6 and Civic Si distinct. Earn money through driving, maintain and upgrade the car, explore an editable city, and race at night.

Start with local saves and a stylized world. Keep simulation rules independent of rendering so they can be tested and reused. Treat production readiness as measurable build, correctness, performance, documentation, and release requirements.

## 1. Preserve the prototype and establish the foundation

- [ ] Capture a baseline of the current driving feel, controller mapping, sound, torque camera response, and existing tests.
- [ ] Initialize version control and a recoverable baseline; keep local experiments separate from release assets.
- [ ] Establish a reproducible dependency setup and production build, with TypeScript, formatting, linting, type checking, and continuous integration.
- [ ] Separate simulation, input, rendering/audio, world, progression, persistence, and UI modules. Keep the frame loop responsible for coordination rather than feature logic.
- [ ] Define shared contracts for vehicles, installed parts, maintenance, map nodes/roads, jobs, transactions, and save data before agents implement independent features.
- [ ] Use a fixed simulation step, explicit units, and seeded world randomness.
- [ ] Add versioned local saves, migration support, export/import, and recovery from invalid saves.
- [ ] Preserve keyboard, controller, and touch input behind one action interface.
- [ ] Write contributor/setup documentation, architecture notes, asset provenance, and dependency notices. Select a code license with the owner before public release.

Acceptance: a clean checkout builds and runs, the existing driving experience remains playable, and automated checks run reproducibly. No public publication is included in this milestone.

## 2. Controls and unrestricted driving

- [ ] Replace straight-road lane steering with heading-based movement, predictable low-speed steering, turning, and reverse for parking and jobs.
- [ ] Retain right-stick H-pattern behavior, including quick-flick Neutral stops and held-direction continuation.
- [ ] Tune keyboard driving with Space throttle, S/Alt brake, A/D steering, Ctrl clutch, and mouse-driven H-pattern throws. Validate mouse sensitivity and Neutral detents with players.
- [ ] Add configurable clutch press/release rates, remapping, dead zones, sensitivity, and short control tutorials.
- [ ] Add controller clutch modes, toggled by an L3 click: direct trigger position and pressure-building control.
- [ ] In pressure mode, holding LT builds clutch depression; releasing lets it return toward engagement. A middle trigger band holds the current amount, allowing the player to catch the bite point. Tune buildup and release independently.
- [ ] Display current clutch mode and effective clutch position; use existing bite-point feedback.
- [ ] Blend mode transitions to avoid a sudden clutch dump caused solely by toggling L3. Persist the chosen mode.

Pressure mode is an optional game mechanic, not a claim about real hydraulic clutch pressure accumulating this way.

Acceptance: a player can launch, shift, stop, reverse, and park with both clutch modes. Mode toggles and disconnected controllers cannot create accidental input spikes. Validate on the user's physical controller as well as automated input tests.

## 3. City and map editor

- [ ] Represent the world as 50 by 50 intersection points: 2,500 points and up to 49 by 49 enclosed blocks. This replaces the endless straight avenue for career play.
- [ ] Define block length, road width, intersections, sidewalks, speed limits, and navigable lanes as shared world data.
- [ ] Generate connected districts with seeded, variable-sized groups of blocks: residential, commercial, industrial, downtown, and suburban themes.
- [ ] Allow turning at intersections; provide a minimap, destination markers, and routes that use actual connected streets.
- [ ] Stream nearby detail and simulate distant activity coarsely. Set and measure performance budgets before increasing traffic density.
- [ ] Remove the scenery-only travel multiplier from the interactive world. Align rendered streets, collision geometry, traffic, and job destinations. Preserve speed feel through camera response, blur, road detail, and nearby landmarks.
- [ ] Add an overhead editor for roads, intersections, districts, garages, shops, job locations, spawn points, and race routes.
- [ ] Support undo/redo, seeded regeneration, map saves, and validated JSON import/export. Validate connectivity and required destinations before playing a map.
- [ ] Define map-edge behavior explicitly rather than silently restoring endless travel.

Acceptance: drive a route with several left/right turns, edit a road or district, reload the map, and obtain a valid route through the changed layout without visible/collision misalignment.

## 4. Vehicle condition, parts, and garage

- [ ] Give each installed part an identity, compatibility, condition, price, and relevant performance properties.
- [ ] Start with clutch, brake pads/rotors, tires, engine, oil/filter, transmission, and front/rear bumpers.
- [ ] Calculate clutch wear from frictional work while slipping under load. A fully disengaged or fully locked clutch should not suffer slip wear.
- [ ] Calculate brake wear and heat from braking work, with temporary fade separated from permanent wear.
- [ ] Track oil age/use, condition, and engine temperature/load. Neglect gradually increases engine wear and failure risk; oil changes do not restore already-lost engine condition.
- [ ] Apply collision damage by impact location and severity, beginning with bumper damage and repair cost.
- [ ] Make deteriorating condition affect operation progressively, with clear symptoms and warnings before failure where appropriate.
- [ ] Add shops offering diagnostics, oil changes, repair, replacement, and installation. Show parts, labor, compatibility, cost, and expected effect before purchase.
- [ ] Add upgrades with tradeoffs: clutch torque capacity, brake fade resistance, tire grip, and engine/turbo tuning balanced against durability, heat, and cost.
- [ ] Make service-life scaling configurable so realistic causes produce meaningful gameplay without requiring real-world maintenance intervals.
- [ ] Separate sandbox reset from career recovery. Career damage requires service or towing; provide a low-cost recovery path so an empty wallet does not permanently end a save.

Acceptance: a slipping launch increases clutch wear, braking affects brake condition, an oil service resets service status without healing engine damage, and repair/purchase transactions persist correctly without duplicate charges.

## 5. First complete career loop

- [ ] Add wallet, expenses, inventory, garage ownership/state, and a transaction history.
- [ ] Build one reusable job lifecycle: offer, accept, pickup, travel, drop-off, payout, failure/cancellation, and save recovery.
- [ ] Implement food/package delivery first, with reachable destinations and clear pickup/drop-off conditions.
- [ ] Add taxi and rideshare-style passenger jobs, then fictional cannabis delivery variants using the same job system and distinct rewards/risks.
- [ ] Add reputation and job unlocks based on completed work and driving quality.
- [ ] Balance payouts against fuel/service costs, repairs, upgrades, and towing. Ensure legitimate early jobs can fund routine maintenance.
- [ ] Save active jobs and completed payouts so reloads neither duplicate rewards nor erase legitimate progress.

Acceptance: complete a delivery, receive one payment, service or upgrade a worn part, reload, and retain the correct car, money, and job state.

## 6. Traffic, streets, and road events

- [ ] Add pooled traffic vehicles following connected lanes, junction rules, stop lines, signals, and obstacle avoidance.
- [ ] Extend working traffic signals, streetlights, and the day/night cycle with tuned night visibility and measured performance.
- [ ] Extend collisions, impact feedback, and bumper damage with recovery from stuck traffic.
- [ ] Tune the paced road-event system: stopped cars, construction, debris, crossing dogs, and children playing near residential streets. Current events have cues, collision cooldowns, and safe spawns; playtest warning distance and encounter pacing.
- [ ] Extend parked police observation and fines for speeding, red lights, and collisions into patrol and pursuit behavior. Verify citation fairness in physical playtests.
- [ ] Keep nearby detailed simulation bounded and prevent offscreen population growth.

Acceptance: traffic completes turns and obeys signals, collisions affect the correct vehicle condition, hazards can be anticipated, and sustained driving stays within the agreed frame-time budget.

## 7. Night races

- [ ] Expand the first night-only 400 m drag event with multiple sites, rival behaviors, launch tuning, and race history. Its staging, countdown, false starts, finish detection, and payouts are playable.
- [ ] Add checkpoint street races on connected roads with opponent driving and reset/recovery rules.
- [ ] Connect race rewards, reputation, police response, and mechanical wear to the existing career systems.
- [ ] Balance races so manual technique, car condition, and upgrades all matter.

Acceptance: races have reliable starts/finishes, cannot pay twice, and return the player to free driving with persistent condition and money.

## 8. Release and open-source readiness

- [ ] Validate saves and imported maps; handle invalid data without corrupting the current save.
- [ ] Test main career flows, input disconnects, interrupted saves, economy exploits, map edits, traffic performance, and regression of the original driving feel.
- [ ] Define and verify desktop and mobile support separately, including physical-device testing and reduced-motion settings.
- [ ] Audit distributable assets/dependencies and keep license records. Separate the code license from asset licenses.
- [ ] Add public setup, contribution, issue-reporting, release, and known-limit documentation.
- [ ] Review production hosting/build configuration, confirm release license choices, and perform a release audit before any requested publication.

## Parallel work ownership

Use at most three feature agents plus the lead integrator in the current session. Define shared contracts first and assign exclusive files/modules; avoid parallel edits to the main loop and shared schemas.

1. Lead: architecture, shared contracts, integration, acceptance tests, and playable checkpoints.
2. Agent A: world graph, districts, rendering chunks, and map editor; later traffic.
3. Agent B: condition, installed parts, upgrades, maintenance, and garage services.
4. Agent C: input modes and keyboard controls first; career UI and jobs after those contracts stabilize.

Independent reviews can replace a completed feature assignment. Parallel work reduces waiting on independent tasks but can increase usage through coordination and duplicated context; only run agents when their tasks are ready.

## First playable milestone

Deliver the foundation, two clutch modes, turnable streets, a basic editable map, one delivery type, one garage, initial clutch/brake/oil wear, wallet, and reliable saves. Keep the entire 50 by 50 map representable, while initially dressing and testing a small district. Add dense traffic, road events, police, and night races in later playable checkpoints.

## Decisions before implementation/release

- Confirm the selected model/reasoning setting before the architecture implementation, following the owner's standing preference.
- Tune the proposed 0.45-second shifter hold behavior and pressure clutch through physical-controller playtesting.
- Choose code licensing before publishing; no repository publication or production deployment is implied by this plan.
- Confirm the initial performance target and service-life pacing during the first playable checkpoint.

> October 2, 2026: [MASTER_PLAN.md](MASTER_PLAN.md) supersedes this older checklist for product direction and priority. Progression saving remains deferred while gameplay loops are developed.
