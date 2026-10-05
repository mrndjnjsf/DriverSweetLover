# Gameplay tuning

Edit a value in `src/config/`, save, then **reload the browser**. There is no build step or live settings editor. Defaults preserve the current driving feel. Change one group at a time, and use Garage's free full reset when comparing healthy cars.

New loops: `life.js` controls parking containment/settle thresholds, need growth, warnings, and bathroom price. `city-projects.js` defines staged funding targets, prerequisites, and effects. `rival.js` controls encounter/expiry timing, race targets, and respect changes. `appearance.js` describes cosmetic choices, compatible body families, and UV tiles. Money values use cents; timers use seconds. Appearance changes never tune mechanics.

`activity.js` controls day/night mission availability. Daytime deliveries queue up to 3 requests, replenishing every 15 gameplay seconds; nighttime deliveries queue 1, replenishing every 75 seconds. Daytime races queue 1 invitation every 180 seconds; nighttime races queue 3, replenishing every 30 seconds. Arrival rates blend through sunrise/sunset. Queues shrink to the current capacity, but accepted deliveries and staged races are never canceled. Waiting pauses with gameplay, and full queues do not bank extra arrivals. Availability is session-only; reloading starts with the current shift's full queue. Sandbox racing remains unlimited practice, and accepted black-car challenges have their own invitation. The black-car driver still primarily appears after dark.

`fleet.js` sets prototype dealership prices, garage capacity, unique wins needed to hire Kai, delivery duration/distance/fuel, gross receipts, owner share, maintenance thresholds, per-job reserve deposit, and reserve top-up amount. Share is stored as basis points in receipts so future percentage tuning does not reinterpret past income. Keep `ownerShare` in 0–1, positive job duration, and gross revenue above fuel plus reserve. Reducing garage capacity below an existing fleet or changing unlock thresholds can invalidate assignments; test existing saves before shipping those changes. Physical car specs remain in vehicles.js, regardless of how many copies are owned.

| What you want to change | File and setting | Effect |
| --- | --- | --- |
| Horsepower, torque, redline | `vehicles.js` → `VEHICLES` | Engine output; the horsepower ceiling also limits high-RPM torque |
| Faster free revving | `vehicles.js` → `engineInertia` | Lower values rev faster; very low values can make physics unstable |
| Acceleration in each gear | `vehicles.js` → `ratios`, `final` | Higher ratios accelerate harder but reach redline at lower road speed |
| V6/turbo power bands | `vehicles.js` → `TORQUE_CURVES` | Ordered pairs of RPM and fraction of peak torque; keep RPM ascending |
| Turbo lag | `gameplay.js` → `TURBO.spoolSeconds` | Lower means faster spool; RPM and throttle settings determine when it starts |
| Clutch build/release speed | `gameplay.js` → `CLUTCH` | Separate keyboard and controller rates, in full-pedal travel per second |
| Bite point and worn grip | `gameplay.js` → `healthyBite`, `wornBiteRise`, `minimumGrip` | Pedal depression is 0–1; 1 means fully pressed |
| Early-shift/launch penalties | `gameplay.js` → `CLUTCH`; `maintenance.js` → `WEAR_CONFIG` | Shift multipliers, hard-throttle threshold, release window, and clutch lifetime |
| Mouse throw and notches | `gameplay.js` → `SHIFTER` | Distances in pixels, catch/hold times in milliseconds; notches must be shorter than travel |
| Stalling, braking, steering | `driving.js` → `DRIVING` | RPM thresholds, delays, brake deceleration, and turn rate |
| Camera pull | `gameplay.js` → `CAMERA` | Pull strength, catch-up speed, and view positions [side, height, behind] |
| Traffic/hazard density | `gameplay.js` → `WORLD` | Logical and visible pools use the same counts |
| Day/night rate and drag rival | `gameplay.js` → `WORLD` | City hours per real second and per-car rival finish time |
| Fuel burn, tanks, prices | `economy.js` → `FUEL` | Litres, integer cents per litre, and a gameplay burn multiplier |
| Starting cash and drag reward | `economy.js` → `ECONOMY` | Integer cents; starting cash applies only to new careers |
| Parts, upgrades, oil intervals | `maintenance.js` | Service prices, performance strengths, wear and oil lifetimes |
| Render cost and update rates | `gameplay.js` → `RUNTIME` | Pixel budget, refresh cap, physics step, phone/save/wear intervals |

## Practical examples

Driving tips: `gameplay.js` → `COACH.clearSeconds` holds a warning until its trigger has stayed clear for 3 gameplay seconds. Recurring redline/bogging restarts the countdown. More urgent warnings replace a held tip immediately; paused or hidden gameplay does not drain its hold time. Engine failure clears driving tips because the failure screen explains recovery.

- A longer mouse throw: raise `mouseTravelPx` and both notch distances together, keeping notches below travel.
- Faster keyboard clutch: increase `keyboardBuildPerSecond`; lowering `keyboardReleasePerSecond` makes release gentler.
- Less punishing maintenance: increase `clutchLifeWorkJ` and lower `earlyShiftHealthCost`. Higher lifetime means less wear.
- Earlier turbo hit: lower `spoolStartRpm` or `spoolRpmRange`. Faster spool alone changes delay, not the RPM target.
- Lower rendering load: lower `maxScenePixels` first. Traffic count affects both simulation and drawing.

## Boundaries

Keep pedal fractions in 0–1, positive masses/inertias/ratios, six forward ratios per car, and the worn bite point below 1. Keep simulation catch-up at or below one second and wear intervals at 0.5 seconds or less (condition samples enforce those limits). Do not use simulation step size to change acceleration; it is a stability setting.

The map editor remains the place to change roads and districts. New map defaults live in `grid-map.js`; saved maps retain their dimensions. Police rules, delivery offer generation, audio synthesis, and decorative effects remain in their named modules; this refactor does not pretend every numeric literal is a gameplay knob. Save keys, schema versions, and validation limits are compatibility contracts, not tuning settings.

Fuel tank size changes can invalidate a saved tank exceeding the new capacity. Existing money, upgrades, and health remain saved. Back up a save before changing identifiers or capacities. The free Garage reset restores health and fuel for ordinary tuning comparisons.

## Checks

```powershell
node scripts/check.mjs
node --test tests/*.test.mjs
node scripts/benchmark.mjs
```

The benchmark measures torque computation on the CPU and emits deterministic driving snapshots. It does **not** measure WebGL FPS. Test actual driving and shifts after tuning; regression tests encode current defaults and may need deliberate updates if you intentionally change behavior.

Keyboard throttle: X builds with a taper near full pressure. Space reduces pressure quickly. With neither key pressed, pressure drops by one percentage point per second; see the X / Space section below.

Opening tutorial: `src/config/intro.js` controls drive distances, brake hold, initial worn condition, and crash delay. Mustang automatic shift and converter values live under `VEHICLES.mustang.automatic` in `src/config/vehicles.js`. The automatic only appears in the intro; Eclipse/Civic tuning is unchanged.

Development tools: `src/config/development.js` is the release switch. Disable it for production, including local production testing. The temporary Mustang free drive uses the same worn initial condition as the intro and bypasses its stage transitions.

Pedal progression: Mini Lube's existing paid engine upgrade unlocks smooth/responsive throttle presets (faster X buildup, less taper, faster engine response, and the existing power gain). The paid clutch upgrade unlocks low/standard/high bite presets, faster pressure buildup, gentler release, and existing torque capacity/durability gains. Direct controller clutch retains analog input; pressure-mode controller clutch receives the improved rates. Settings are per car, survive saves/wear, and weaken as the upgraded part wears. The free development reset keeps purchased upgrades/tuning. Manual positive RPM rise uses driving.js rpmRiseMultiplier = 0.75; engine braking, redlines, gear ratios, and automatic tutorial behavior are preserved.

Compact navigation: the objective watch always draws the local map. Tracking a service, bathroom, city project, rival, or delivery adds a gold street route and the next left/right turn with distance in metres. Routing uses connected roads and refreshes at intersections or map changes; unreachable destinations report no connected route.

## Manual reverse gate

`VEHICLES.*.reverseGate` sets the extra H-pattern lane: Eclipse `lane: -2, row: -1` (left of 1st), Civic `lane: 2, row: 1` (right of 6th). Mouse movement uses the same notches and clutch wear as forward gears. On controller, hold fully sideways in the outer forward neutral lane for 350 ms to reach the reverse lane, then move up/down. Pull back into neutral to exit. Selection is rejected for any positive forward speed; existing road-mode and clutch restrictions apply. The B shortcut remains available for accessibility, using the same selection checks and displayed reverse position.

## X / Space throttle control

X increases the selected keyboard throttle; Space reduces it at 2.5 pressure units/second and takes priority if both are pressed. Neither key slowly depletes the selected level at one percentage point per second. Reapplying either key resets the coast timer. V no longer overrides throttle. See THROTTLE.keyboardReducePerSecond and keyboardCoastDecayPerSecond (.01). keyboardCoastSeconds is zero; increase it to add an initial hold delay. Engine upgrades still improve buildup. Focus loss, menus, pause, and changing input method clear the selected pressure. Controller RT uses pressure control (see below). Civic revHangSeconds (.2) and revHangDecelerationScale (.25) briefly soften unloaded RPM fall after throttle cuts to zero; Eclipse has no rev hang. In a gripping gear, road speed and gear ratio still determine RPM.

Space held after throttle empties waits keyboardBrakeDelaySeconds (2), then ramps at keyboardBrakeRampPerSecond (.35) to keyboardGentleBrake (.35). Releasing Space or building with X resets the brake timer and releases gentle braking. Alt/S retains immediate full braking. Input resets also clear this timer.

C instantly sets keyboard throttle pressure to 100% and clears the coast/brake timers. After releasing C, pressure drains at the Space reduction rate (2.5 units/second: full to zero in 0.4 seconds). This automatic release does not trigger braking. X takes over gradual pressure control and returns release to the slow 1-percentage-point-per-second drift. Space reduction takes priority over C when both are held.

Holding either Alt key immediately clears keyboard throttle pressure and its timers, taking priority over X and C while full braking applies. After releasing Alt, pressure stays zero until throttle is applied again.

## Controller throttle pressure

Light RT (above 5%, below 95%) builds remembered throttle at a rate proportional to the pull. Full RT (95%+) slams to full and lifting drains to zero in 0.4 seconds, including when the trigger passes through partial travel. Ordinary pressure drifts at 1 percentage point per second. RB reduces pressure at controllerReducePerSecond (.6: full to empty in about 1.7 seconds), then gently brakes after 2 seconds at zero using the same rules as Space. LB immediately clears throttle and applies full braking. Engine upgrades improve pressure buildup. RB no longer starts a drag race: use the Messages app. Focus loss, pause, reset, and input-method changes clear stored controller pressure and brake timers.
