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

Keyboard throttle: `gameplay.js` → `THROTTLE` controls Space build/release rates and pressure taper. Defaults: 1.5 build, 0.75 release, 0.8 taper. Pedal movement slows as pressure rises: buildup starts at 150 percentage points per second and slows to 30 near full pressure. Release follows the same curve at half speed (about 2.7 seconds from full to empty, versus 1.3 seconds to fill). A zero taper gives linear movement; keep taper below 1 so Space can reach full throttle. V overrides to full throttle instantly.

Opening tutorial: `src/config/intro.js` controls drive distances, brake hold, initial worn condition, and crash delay. Mustang automatic shift and converter values live under `VEHICLES.mustang.automatic` in `src/config/vehicles.js`. The automatic only appears in the intro; Eclipse/Civic tuning is unchanged.

Development tools: `src/config/development.js` is the release switch. Disable it for production, including local production testing. The temporary Mustang free drive uses the same worn initial condition as the intro and bypasses its stage transitions.
