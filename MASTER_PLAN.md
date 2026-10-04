# Driver Sweet Lover — master plan

Direction updated October 4, 2026. This is the primary product plan; ROADMAP.md remains the older detailed implementation checklist. Where they differ, this plan wins. Feature descriptions below are planned unless explicitly marked implemented. Balance numbers are proposals, not promises.

## The game

A manual-driving arcade resource-management game: a little like QWOP for clutch and shifter control. Player skill creates profit, protects the car, and changes the city. Fast driving is one skill, not the answer to every job. Smooth passenger trips conserve fuel and parts; night races reward speed and risk. Tight parking tests precise clutch control. The environment tells the larger story as donations improve districts and introduce new tradeoffs.

Core loop: choose work → drive and park → earn → refuel, maintain, and meet personal needs → upgrade or donate → see the city change → discover new opportunities.

Keep the Eclipse's direct V6 character and the Civic's turbo character. Preserve the current manual controls and miniature-car style while allowing a future art overhaul. Keep the development garage's free full-car reset. Durable progression/save work is deferred until the loops feel good, per the owner's request.

## Current baseline and work just prepared

- Playable: grid city, traffic, manual driving, wear/service, fuel, delivery loop, police, night drag, phone, dashboard, and local saves. Depth and polish vary.
- Implemented: keyboard Space builds throttle, V is full throttle, B selects reverse with clutch at a stop; tuning lives in src/config/gameplay.js.
- Implemented foundation: player vehicle view has its own replaceable presentation adapter and art registry. Model materials are owned per car instance. This is not a completed whole-engine separation.
- Implemented: collapsible phone/objective watch, P and Xbox Menu toggles, selected-stop tracking with return to the active job. Browser collapse/restore checked; physical controller still needs player testing.
- First passes implemented: lot/parallel parking, parked-car impacts, bathroom need and free/paid service, staged city donations with park/road/camera effects, recurring black-car rival, and generic coupe/sedan SVG paint templates. See README.md for play and development fixtures.
- First passes implemented: owned car instances, dealership purchases, Kai's unique race wins and hiring request, spare-car assignment/reclaim, seeded background deliveries, fuel replacement, maintenance reserves/service, and itemized owner income. Existing careers migrate to version 2 with a retained version-one backup.
- Pending: more drivers/cars, fleet balance, broader renderer separation, and progression polish. Needs and cosmetic respect remain session-only. Ownership, condition, skins, city contributions, driver wins/assignments, job timing, reserves, and receipts survive reload; offline income is deliberately absent.

## 1. Phone and objective watch — first pass implemented

Let the player show the large phone or collapse it to a smartwatch-sized panel. The compact view shows only the tracked objective: short instruction, destination/distance, and relevant progress. An expand affordance returns to the same app. Hiding the phone must not cancel a job or reset navigation.

Use a single objective model for phone, watch, and map. An accepted delivery remains active when the player temporarily tracks a bathroom, garage, or fuel stop. Do not silently replace paid work with an incidental notification. No active objective means a small idle message.

Acceptance: collapse during a delivery, drive, expand, and see the same job and app state. Compact mode leaves the road visible and remains usable at smaller screen sizes. Input cannot leak through phone interactions into driving.

## 2. Parking and location interactions — first pass implemented

Add explicit parking bays to service/job locations, independent of decorative meshes. Include easy pull-in bays, crowded lots, and parallel street parking. Selected pickup and bathroom locations require parking; not every stop needs a difficult maneuver.

A shared parking validator checks the car footprint inside a bay, heading tolerance, low speed, and a short settled duration. Proposed first thresholds: below 0.3 m/s, within 15 degrees of the allowed heading, settled for 1 second. Put these in tuning data. Bay geometry defines whether either orientation is allowed. Reverse stays available.

Parked vehicles use the same collision/damage rules as moving traffic. Spawn occupancy must leave a reachable legal bay. Show which condition is missing rather than merely refusing interaction. Later job variants can reward clean parking and penalize impacts.

Acceptance: forward/reverse parking, both valid parallel orientations where allowed, partial-outside rejection, no service while driving past, and no double impact charge during one sustained contact. Test with mouse/clutch and physical controller.

## 3. Poop meter and bathroom app — first pass implemented

The meter rises with active simulation time, pauses with gameplay, and reaches 100%. The bathroom app lists nearby reachable bathrooms, shows their fees and availability, and can track one on the map. Some are free, some paid. Drive there, meet its parking condition, then use the app to empty the meter. Charge once only after a valid interaction; a failed attempt does not deduct money.

Keep at least one reachable free bathroom so an empty wallet does not trap the player. At full need, give clear urgency feedback; any extra penalties beyond the rival gag remain undecided. Start with infrequent, readable interruptions rather than a constant chore. The physical need persists when switching cars. Free development reset should have an explicit separate needs reset if we add one.

Acceptance: time advances the meter, pause does not, a valid free/paid visit empties it, wrong location or insufficient funds cannot charge, and the map points to an accessible entrance/bay. Meter growth, service time, fees, and warnings are tunable.

## 4. City donations and environmental story — first pass implemented

Create local projects with stable IDs, district, funding target, contribution total, prerequisites, visual stage, benefits, and tradeoffs. Players donate an explicit affordable amount through a city app. Partial contributions persist in the session; crossing a target applies completion exactly once.

Examples: fix pavement/reduce hazards; renovate parks; expand buildings and local commerce; upgrade transport and policing. Improvements can also fund cameras and faster police vehicles or change street-event populations, such as joggers replacing some dog crossings. These are gameplay tradeoffs, not a claim that every upgrade is strictly better.

Preview each project's known effects before donation. After completion, change a recognizable landmark and send a short in-world message. Apply structural road changes only when the area is safe to refresh; never spawn construction or a bigger collider on the player. Cosmetic building growth must not silently change road collision geometry.

Suggested reveal order: basic jobs/maintenance → first neighborhood project → new job demand and rivals → second project introduces dealership → repeated race friendships reveal hiring → fleet work opens larger city projects. Thresholds are provisional and data-driven. Reveal new apps through messages and locations when earned, without a screen full of locked menus.

Acceptance: partial donations, exact-threshold completion, excess-donation handling, insufficient funds, idempotent unlocks, visible before/after district changes, and no unreachable destinations. Prefer reject or cap excess with a clear quoted amount; never silently consume it.

## 5. Recurring black-car rival and respect — first pass implemented

A distinctive black car appears occasionally and challenges the player. Use an encounter cooldown and safe spawn/staging rules; do not interrupt a bathroom interaction, tutorial, or active passenger job. A challenge can be declined. The recurring rival is separate from the current timed drag ghost.

Loss: no money, vehicle, or ownership loss from the result itself. Show a theatrical respect-down graphic and immediately set the poop meter to 100%, as requested. Normal race wear/collision consequences remain. Initially respect is presentation-only; do not secretly lock content behind losses. Win: show respect up. Additional perks are deliberately undecided.

Acceptance: one result event per race, loss fills need once, victory never fills it, declines are harmless, and cooldown prevents repeated harassment. Avoid assuming an unanswered challenge is a loss.

## 6. Cars, friendships, and hired drivers — first pass implemented

After the automatic Mustang tutorial, new players choose one free manual starter: Eclipse or Civic. Street renewal reveals a dealership in Garage; stop at the Garage map marker to buy the unchosen car or another Eclipse ($300) or Civic ($350). Existing saves retain cars already owned. These prices are development balance values. Each copy has its own condition, fuel, upgrades, and appearance. Garage holds at most eight cars. Garage shortcuts and the owned-car chooser select only owned instances.

Planned future purchase: a separate Mustang with a supercharged V8 and manual transmission. This is a performance car earned through progression and bought at the dealership; it is distinct from the damaged automatic V6 Mustang used in the tutorial and development test drive. Keep a separate vehicle definition so its engine, supercharger power delivery, manual gearbox, sound, wear, and appearance can be tuned independently. Model year, price, power, gear ratios, and unlock milestone remain undecided. This car is planned, not currently playable.

Three unique black-car wins plus the park project reveal Kai's work request in Messages and the Drivers app. Assign an available spare car. Kai completes a seeded delivery every 60 active seconds, replaces the fuel used, and deposits $1 per job into a maintenance reserve. The player receives 10% of gross minus fuel and reserve contribution; Kai keeps the remaining net. Repairs/oil service spend the reserve. If needed service exceeds the reserve or the car is unsafe/unfueled, work pauses with a reason. Add $25 to the reserve, or reclaim, service/reset the car, and assign it again. Reclaiming discards unfinished work without awarding or repeating a payout. There is one named driver in this first pass.

Separate a vehicle definition (car model/spec) from an owned vehicle instance (unique ID, condition, fuel, upgrades, appearance). Version-two saves key condition by owned instance; each condition still declares its mechanics model. Keep dealership prices, capacities, and eligibility in data.

Beating named drivers increases their relationship win count. After a configurable number of wins and the relevant city milestone, a driver texts asking for work. Friendship is distinct from the cosmetic rival respect graphic. Only eligible unassigned spare cars can be given to a hired driver.

Hired drivers perform deliveries, use fuel and parts, and maintain their assigned car. They provide the player a small share, initially proposed as 10%. Recommended accounting: gross receipts minus fuel/service costs, then a 10% owner share of positive net; show the breakdown. Whether the intended 10% is gross or net remains a tuning/design decision. No silent negative wallet drains: pause work when maintenance reserves run out. Do not simulate every distant employee at full driving fidelity; resolve coarse job ticks with seeded outcomes. Offline income is deferred.

Acceptance: one driver/car assignment at a time, player cannot simultaneously drive an assigned car, payout and maintenance occur once, injured-condition cars cannot print unlimited profit, and reassignment does not duplicate a job.

## 7. Custom appearances and replaceable art — generic SVG example implemented

Use authored generic coupe/sedan bodies with named paint/glass/trim/light/wheel surfaces, a consistent scale/origin, wheel pivots, and a UV layout per compatible body family. The editable interface document is a UV paint template: export an SVG/PNG guide, paint a layered source document, then export a body texture. A pack declares its compatible body/UV version and its texture assets. Shape changes require another mesh; a paint template alone cannot turn a coupe into a sedan.

See ART_PIPELINE.md for the supported foundation and proposed GLB/texture contract. Keep branded reference-inspired cars playable during this work. A new art direction must not alter collision sizes, torque, jobs, or money merely because artwork changed.

Acceptance: one generic body rendered with two visibly different skins using unchanged driving rules; wrong UV version fails clearly; missing assets fall back to the built-in appearance. Full texture import/editor UI is future work.

## Delivery order and gates

| Milestone | Deliverable | Exit check |
| --- | --- | --- |
| A | Plan + vehicle presentation boundary (this change) | Current tests and driving snapshots preserved; visual resources isolated |
| B | Phone/watch and shared tracked objective | Collapse/restore without losing work |
| C | One parking lot + one parallel bay | Precise manual parking and reliable interaction eligibility |
| D | Bathroom app + meter + free/paid visits | One complete resource loop without an empty-wallet trap |
| E | One funded city project | Visible district transformation and one subtle unlock |
| F | Recurring black rival | Challenge, win/loss, respect gag, need consequence |
| G | Generic body + two texture skins | Demonstrate independent art replacement |
| H | Vehicle ownership instances + named friendships | Own two cars and unlock one driver's request |
| I | One hired driver | Assign spare car, complete work, account for costs/share |
| J | Balance, progression saves, polish | Sustained mixed driving session and recoverable progression |

Do one small playable example of each loop before adding content volume. Parking and bathroom destinations share location rules; city unlocks and hiring share progression rules. Keep per-frame work bounded and profile before increasing traffic, landmarks, or texture quality. Save migrations and release engineering remain required later, but are not the current priority.

## Architecture work in stages

1. Keep existing pure rules independent of browser/Three.js imports; enforce this in tests. Player car presentation is now an adapter.
2. Extract simulation orchestration from main.js into a headless session: step(actions, dt), commands, a read-only presentation snapshot, and consumable events. Preserve existing substep timing before altering architecture further. First extraction implemented: life-session.js owns need, parking readiness, and rival timers/reset semantics; parked-contact.js owns sustained-contact rules. Full drivetrain orchestration and command/snapshot adapters remain pending.
3. Move phone/HUD, camera, audio, effects, and input mapping into adapters. Views consume scalar snapshots/events and dispatch commands; they never award cash, apply wear, or advance time.
4. Add parking/needs/progression/fleet as pure rules with explicit time, seeded randomness, and transaction IDs. Keep art manifests independent from mechanics definitions.
5. Deliver an art replacement example and headless replay before claiming full reskin or engine portability. A native-engine rewrite can reuse contracts/rules conceptually but is not a drop-in JavaScript renderer swap.

## Open design choices (not blockers for preparation)

- Need-meter duration and full-meter penalties beyond the rival loss gag.
- Exact city funding thresholds, project names, and unlock sequence.
- Rival win perks and whether respect eventually becomes persistent progression.
- Friendship win count, vehicle prices, employee revenue basis, and maintenance reserve policy.
- Final art style, asset budgets, template resolution, and mod distribution format.

Keep these adjustable; do not bury provisional decisions inside renderer code.
