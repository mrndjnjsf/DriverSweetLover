# Performance notes

This maintenance pass preserves default drivetrain behavior and introduces no new dependencies.

| Change | Evidence / scope |
| --- | --- |
| Hoist torque lookup curves into shared configuration | 200,000 torque calls: median 20.59 ms before, 3.53 ms after in the same local Node environment (7 measured runs after 2 warmups) |
| Cache driving HUD nodes and values | Regression test: 100 identical updates produce zero extra DOM writes; a speed-only change produces one |
| Reuse camera vectors and pose tables | Removes per-frame creation of two vectors and four pose arrays |
| Release old car materials and deduplicate disposal | Regression test verifies shared geometry/materials are disposed once when removing a model |

Both cars' deterministic 20-second driving snapshots and the torque checksum matched exactly before/after the initial refactor. The existing physics, career, wear, traffic, and controller tests also remain the behavioral baseline.

These CPU/allocation improvements are not an overall FPS claim. GPU work from shadows, lights, blur passes, and scene complexity can still dominate. `?profile&speed=30` provides a repeatable moving preview (speed is m/s); add `&night`, `&noBlur`, or `&noShadows` to isolate rendering costs. Profile/sandbox modes use temporary storage.

Run `node scripts/benchmark.mjs` to repeat the CPU check. Compare warmed runs on the same machine, with similar background load. Hardware controller feel and sustained browser/GPU performance still require playtesting.

## Parking / city / rival checkpoint

The new parking contact path reuses an overlap scratch array in physics substeps and uses a squared-distance broad phase. Sustained-contact state prevents repeated bumper charges while pushing against the same parked car. City effects are cached by receipt count; project artwork rebuilds only when map position or funding effects change. Parking artwork rebuilds only on map edits. Generic textures are loaded outside simulation and explicitly disposed when changing bodies.

`artifacts/life-milestone-benchmark.json` records the same deterministic drivetrain snapshots and torque checksum as the refactor baseline. A warmed local in-app preview at `?profile&speed=30` (67 MPH, day, DPR 1) showed approximately 80 FPS, p95 12.6 ms frame gap, and 1.5 ms frame CPU including rendering. This is a short snapshot on this computer, not a sustained GPU benchmark or physical controller/device certification.

## Ownership / fleet checkpoint

Employee work uses a bounded one-second active-time tick and a coarse seeded delivery per 60 seconds. Employees do not add distant driving meshes, full physics actors, or route searches. Ownership is capped at eight cars; phone option lists rebuild only when ownership, assignment, or selection changes. `artifacts/fleet-milestone-benchmark.json` confirms unchanged car replay snapshots and torque checksum. This is behavioral regression evidence, not a sustained fleet FPS measurement; long transaction histories still need profiling before release.
