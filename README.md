# Driver Sweet Lover

**[Play online on GitHub Pages](https://mrndjnjsf.github.io/DriverSweetLover/)** · [Source repository](https://github.com/mrndjnjsf/DriverSweetLover)

Static hosting is supported without a backend. See [DEPLOYMENT.md](DEPLOYMENT.md) for the isolated release build and GitHub Pages workflow, and [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for the audit scope, fixes, and limits.

Normal play starts the automatic Mustang tutorial whenever no career save exists, even if an old tutorial-complete flag remains. After the accident, choose the Eclipse or Civic. Returning players with a valid chosen-starter save resume their career. Unreadable saves remain protected for recovery; sandbox/profile and the local developer test drive keep their explicit startup modes.

A local browser driving RPG prototype built around manual shifting and clutch control. Drive a stylized 2007 Eclipse V6 or 2023 Civic Si through a 50 × 50 street grid, take deliveries, earn money, and maintain each car. The city, career, and shop systems are an early playable checkpoint. [MASTER_PLAN.md](MASTER_PLAN.md) defines the current direction and next milestones.

## Run

Use Node.js to run `node server.mjs` in this folder, then open <http://localhost:5174/> in a desktop browser. The server listens only on `127.0.0.1`; no package installation or online service is required. Run `node --test tests/*.test.mjs` for the logic checks.

The game uses the browser Gamepad API for a standard Xbox controller. Controller rumble depends on the controller, OS, and browser. Sound is enabled by default and starts on the first click, tap, or keyboard press; the Sound button mutes it. The touch layout remains experimental.

## Drive and shift

| Action | Xbox controller | Keyboard and mouse |
| --- | --- | --- |
| Steer and turn | Left stick | A / D |
| Gas / brake | Light RT builds, full RT slams; RB releases then brakes; LB full brake | X increases gas, C full gas, Space decreases gas, then gently brakes after 2 seconds empty / Alt or S slams brakes |
| Clutch | LT | Hold Ctrl to build pressure; release to let it out |
| Manual H-pattern | Right stick | Hold Ctrl, then move the mouse through the gate |
| Reverse at a stop | B, with clutch pressed | B, with clutch pressed |
| Start / reset | Y / Reset button | Enter / R |
| Handbrake | A | H |
| Camera | D-pad | 1–4 |
| Jump between day and night | Time button | N or time button |
| Stage a drag race | Messages app at the start stripe | T or Stage Race button |

The right-stick pattern keeps its brief Neutral detents. For keyboard driving, hold Ctrl to build clutch pressure at 1.5 per second; releasing it lets pressure fall at 0.8 per second. Once clutch depression exceeds a 2% input deadzone, the mouse can move the virtual shift knob. The browser locks and hides the mouse while the clutch is held. If the first lock request needs a click, hold Ctrl and use the Lock Mouse prompt. If the browser blocks pointer lock, the cursor stays visible and edge assistance keeps the virtual shifter moving at a window boundary. Move left then up from center Neutral for 1st; move down to Neutral, right to the center lane, then up for 3rd. The mouse throw is longer and crossing center Neutral catches briefly. A quick sweep stops at center; keep moving sideways after the catch to reach the far lane. You can throw up or down into a gear from any lane with any deliberate clutch press. Release Ctrl to engage the clutch and release the mouse. The shifter display follows your mouse while held.

Click L3 to switch the controller clutch between **Direct** and **Pressure**. Direct follows LT position. In Pressure mode, holding LT past roughly two-thirds builds clutch depression, the middle trigger range holds its current position, and releasing LT gradually engages the clutch. The HUD shows the active mode and effective clutch amount. This is a tunable game control, not a literal hydraulic simulation.

The clutch gauge marks the bite point. As clutch health falls, the marker moves higher and the clutch transfers less torque under hard acceleration, making slip more likely. Any deliberate clutch press lets you move into or out of gear. Before bite, shifting causes heavier wear; after bite, the cost tapers to zero at full pedal depression. Hard throttle while releasing through the near-bite window also causes wear. Gentle release and throttle after the clutch grips are wear-free; actual load-related slipping still wears it. Release work is accumulated each frame so quick releases are not skipped. Repairs or replacement restore the bite point and grip.

The Eclipse pulls immediately to a 6,500 RPM redline; the Civic has a stylized close-ratio six-speed and revs quickly to 8,000 RPM while its turbo torque builds under load. A healthy, spooled Civic holds its advertised 200 hp through the upper rev range, retains some turbo speed through a quick upshift, and keeps pulling at highway speed. The Eclipse's 263 hp still gives it stronger high-speed acceleration. Both can bog, stall, and suffer an over-rev failure from a wrong downshift. The cars have stylized original low-poly bodies inspired by the supplied reference collages. Their physics, sounds, and performance are tuned for play rather than OEM measurement.

## Career checkpoint

The **Your Shift** phone groups activities into apps. **Uber** offers deliveries: accept a job, follow the gold target, park fully inside the pickup bay for one second and confirm, then drive to the drop-off and confirm. **Messages** holds drag races and recurring black-car challenges. **Maps** shows nearby traffic and stops; choose Mini Lube, Fuel, or Garage to place a navigation marker, or open the city editor. Money and part condition are saved locally in the browser. Switching cars retains separate condition for each car.

**Bathrooms** lists a free community stop and a $2 café stop. Track a turquoise bay, fit the whole car inside it, straighten up, brake, and hold still for a second. The app explains the missing parking condition. Use the bathroom to empty the active-time need meter. Nearby parked cars are solid obstacles and can damage bumpers. Need pauses with gameplay and stays with the player when switching cars; it resets on reload while progression saving is deferred.

**City** accepts $25 contributions, capped at each project's remaining target. Fund the $100 park to turn a vacant lot into paths, trees, and walkers; this reveals $150 street renewal, then $200 modern enforcement. Renewal removes debris/construction events; enforcement grows nearby buildings and adds $45 speed cameras. Benefits and tradeoffs are shown before funding. Contributions use the wallet ledger and survive reload.

An occasional black-car driver sends a challenge at night while you are free and moving slowly. Accept in **Messages**, drive to the purple stripe, and stage. Declining or letting the invitation expire has no penalty. Losing shows respect down and fills the bathroom meter; winning shows respect up. Respect is cosmetic and session-only. Ordinary race wear and the existing win payout still apply.

**Garage → Owned car / Appearance** selects your car instance and switches between original bodies and generic coupe/sedan bodies with editable SVG paint/racing skins. See [ART_PIPELINE.md](ART_PIPELINE.md) for source templates and UV layout. Appearance preserves mechanics and is saved per car. New players choose one free starter: Eclipse or Civic. Garage shortcuts appear only for owned models and can select purchased instances too. Existing saves that already owned both keep both.

Street renewal reveals a **Local dealership** in Garage. Drive to the Garage marker in Maps, stop, and buy another Eclipse ($300) or Civic ($350). These are prototype prices. Each copy keeps its own fuel, condition, upgrades, and appearance; the garage holds eight cars.

Win three unique races against the black-car driver and fund the community park. **Messages** then reveals Kai's request for work and the **Drivers** app appears. Assign a spare car; assigned cars cannot be driven until reclaimed. Kai completes a delivery every 60 active seconds, buys back used fuel, and sets aside $1 per job for maintenance. You receive 10% of gross minus fuel and the reserve contribution. The app shows gross, costs, both shares, and service paid from the reserve. Needed repairs/oil changes use the reserve; unsafe/unfueled cars or an insufficient reserve pause work. Add $25 to the reserve or reclaim and service/reset the car. Reclaim discards unfinished work; completed earnings and reserves stay recorded. There is no offline income.

Career schema 2 migrates existing saves while preserving both starter cars, their condition/fuel, jobs, wallet, and receipts. The first write keeps a version-one backup in local storage under `driver-sweet-lover:career:v1:backup:v1`. Owned cars, paint, driver wins, assignments, work progress, reserves, and payout receipts now survive reload. Needs/cosmetic respect remain session-only; broader progression/save polish is still deferred.

Development fixtures use temporary saves: `?sandbox=1&parking=public-bathroom`, `?sandbox=1&parking=cafe-bathroom`, or `?sandbox=1&rival=1`. Parking fixtures place the healthy car in the chosen bay; the rival fixture invites immediately and can be staged during either shift. Sandbox disables deliveries, wear, fines, and earnings; service/donation tests stay in temporary storage.

`?sandbox=1&fleet=1` is an isolated ownership/hiring preview: the park/renewal and Kai's wins are pre-earned through real rules, the car starts at the Garage, and each assignment's first job finishes after one active second for easy verification. Later jobs take the normal 60 seconds. Purchases, earnings, wear, and reserves in this fixture affect only temporary storage. Reload restarts the fixture; it does not overwrite the player's career.

**Mini Lube** shows repair, replacement, upgrade, and oil-change quotes. Drive to the blue service marker and stop before buying service. Clutch slip, braking, distance, and oil neglect affect condition. Part health influences power, clutch capacity, braking, and grip. The panoramic electronic dashboard shows fuel, engine health, oil life, clutch health, brake health, and tires, with a sweeping tachometer, pedal gauges, and an animated H-pattern shifter. The **Garage** app currently offers a free full reset of the selected car from anywhere while the game is being built; it restores parts, oil, fuel, and driving state without changing the wallet, jobs, or other car. The current service intervals are scaled for a game and should be tuned through playtesting.

The **Fuel** app shows the selected car's tank. Higher speed, throttle, and RPM burn more gas; the rate is accelerated to make short city trips matter. Drive to the green F marker and stop to buy a full tank. An empty tank stops the engine and prevents a restart until it is refilled or the free Garage reset is used. Fuel purchases use the in-game wallet.

The streets have a bounded set of moving cars, working red/green intersections, streetlights, and a day/night cycle. Use the clock button or N to jump between day and night; city time is saved in the browser. Traffic follows connected roads and turns through junctions. A hard contact slows your car, gives a brief impact cue, and damages its front or rear bumper; service restores that condition. The small map marks nearby traffic.

Stalled cars, roadwork, and debris appear as avoidable hard obstacles. Dogs and children appear near the road as caution cues but cannot be struck or damaged. Encounters recycle around the player and avoid the spawn and service markers. Parked police observe nearby speeding over the 35 mph limit, red-light crossings, and collisions. A citation shows its reason and amount, and charges the in-game wallet once, up to its available balance. This is a first playable pass: traffic does not yet avoid all road events or react intelligently to every player maneuver, and police do not pursue the player.

The purple marker leads to a 400 m drag start near the spawn. Stop on its stripe facing the finish and use Messages, T, or **Stage Race**. The three-count allows clutch and throttle setup; crossing early is a false start. Beat the violet ghost over the line to win $150. The ghost has no collision body, and traffic, road events, and police are cleared from the race strip during the run. Race wins are saved as one-time transactions. The rival time is currently 21.5 seconds for the Eclipse and 29 seconds for the Civic, set from a baseline drivetrain simulation and still needing controller playtesting. Reset returns the car to spawn for another attempt.

**Edit City Map** in Maps opens the 50 × 50 overhead editor. You can change roads, district themes, and service/job/fuel locations, undo and redo, generate another seed, and import/export a validated JSON map. Click **Save here** to keep the current map in this browser. Map and career saves are local to that browser profile; clearing browser storage removes them. Older local maps gain a gas station on import. An unreadable career save is left intact for recovery until the player chooses to replace it.

## Code and status

Simulation, shifting, clutch input, vehicle condition, career, map data, map rendering, map editing, audio, and camera response are separate modules under `src/`. The app currently has no build dependencies; `vendor/three.module.js` is bundled with its notice in `vendor/THREE-LICENSE.txt`. The local server and UI wiring are still prototype scale. This project has not yet been published or assigned a redistribution license.

The renderer limits high-density scenes to about 2.5 million drawing pixels and skips excess frames on high-refresh displays. It pauses simulation and rendering while the tab is hidden. Daylight hides unused local lights; night uses one nearby streetlight and one headlight cone. For a local performance readout, open `http://localhost:5174/?profile`; the diagnostic run uses an isolated in-memory career and does not change your normal save. Add `&speed=45&night` to inspect a repeatable 101 mph night scene. Browser and controller performance still depends on the user's actual hardware.

Taxi/cannabis jobs, more race modes and opponents, robust mobile support, traffic avoidance, and production release checks remain on the roadmap. Automated tests cover the rules and a browser smoke check covers initial rendering; a physical-controller feel and performance check remain necessary.

## Tuning and maintenance

Start with [TUNING.md](TUNING.md). Vehicle specs and common gameplay values live in `src/config/`; edit, save, and reload. [PERFORMANCE.md](PERFORMANCE.md) records the measured CPU improvement and its limits. Run `node scripts/check.mjs` and `node --test tests/*.test.mjs` after changes; `node scripts/benchmark.mjs` runs the reproducible CPU benchmark. npm aliases are `check`, `test`, and `benchmark`.

The current product direction and delivery order are in [MASTER_PLAN.md](MASTER_PLAN.md). The proposed replaceable-art and texture-template workflow is in [ART_PIPELINE.md](ART_PIPELINE.md).

Phone: click HIDE to collapse to the objective watch; click the watch to reopen the same app. P or Xbox Menu toggles either view. Maps lets you track a service stop without cancelling a delivery; Current job restores delivery tracking.

### Opening tutorial

The first normal-mode launch begins in a tired mineral-grey 2001 Mustang V6 automatic. Learn throttle, steering, and a complete brake-held stop, then drive a final stretch. A scripted side-impact wrecks the temporary car; choose **Eclipse** or **Civic** to reveal the manual-only game and its controls. The intro does not write car damage, expenses, or jobs to the player career. Players choose one manual starter after the accident and can buy the other after street renewal; the Mustang is not sold or assigned to employees. **Garage → Replay First Drive** replays it; `?intro=1` forces it for development. Completion is remembered separately from the career save.

Automatic mechanics use converter creep, four forward ratios, throttle-dependent shifts, safe kickdown, and B to toggle Reverse/Drive at a stop. Manual clutch and mouse/right-stick shifts do not operate the Mustang. Configure the tutorial in `src/config/intro.js` and its arcade drivetrain in `src/config/vehicles.js`. Reference: [Ford 2001 Mustang brochure](https://xr793.com/wp-content/uploads/2025/02/2001-Ford-Mustang-CAN.pdf). Body and driving values are original, stylized approximations.

### Development Mustang test drive

On localhost, **DEV · TEST MUSTANG** in the header or **Garage → DEV · Test Drive Mustang** starts an isolated free drive in the worn automatic V6. There is no scripted tutorial crash. **End Mustang Test** or selecting a manual car restores the original career/car; test damage, fuel, purchases and appearance are discarded. Traffic and road hazards are active in normal mode; `sandbox` still disables normal wear and moving-traffic damage. Jobs/races and employee work remain unavailable during this temporary test. A direct link is `http://localhost:5174/?testdrive=mustang`.

Before shipping, set `DEVELOPMENT.enabled=false` in `src/config/development.js`. Development entry points are hidden and ignored when this flag is off or when hosted on a non-loopback hostname. The production opening tutorial remains available, with its scripted accident and manual starter choice; the Mustang remains unavailable at the dealership.
