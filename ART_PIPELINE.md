# Art replacement and vehicle skins

## Supported today

`src/presentation/vehicle-view.js` owns player-car model selection, transforms, wheel animation, and disposal. `VEHICLE_ART` maps the gameplay ID to a builder and paint color. `createVehicleView(THREE, registry)` allows a replacement registry. Main passes scalar position/speed/steering data; builders do not import physics or career rules. The original reference-inspired cars are procedural; the generic bodies now have a versioned UV paint atlas.

Each builder receives `(THREE, parent, color)` and returns wheel rigs `{ pivot, tyre, front }`. `tyre` is the rotating wheel group; `pivot` handles steering. The adapter root uses metres, Y up, forward -Z, ground at Y=0; heading zero faces -Z. The view exposes `setVehicle(id)`, `update(snapshot, dt)`, `root`, and `dispose()`. Main still references root for render-pass visibility. This is a player-car boundary, not a finished renderer abstraction for the entire game.

Materials/geometries belong to one instance and are disposed on replacement. Builders create separate materials per instance so changing one car's paint cannot repaint another. Generic SVG textures are explicitly owned and disposed with their model. Late texture loads cannot repaint a disposed selection. Missing textures retain the built-in paint color.

## Editable templates available now

In Garage, choose an owned car, then **Generic body · paint template** or **Generic body · racing stripes**. Eclipse mechanics use the generic `coupe-v1`; Civic mechanics use `sedan-v1`. Changing appearance preserves fuel, condition, gears, and driving state. Selection is saved per owned instance, so two copies of the same model can wear different skins.

Edit `assets/skins/coupe-v1-solid.svg`, `coupe-v1-race.svg`, `sedan-v1-solid.svg`, or `sedan-v1-race.svg` in an SVG editor, save, and reload. `body-uv-guide.svg` labels the six body panels and separate roof panel; keep guide labels out of the applied texture. Each source is 1024 × 1024. Panel coordinates live in `src/config/appearance.js`; geometry uses `atlasBox` in `src/generic-car-model.js`. The source documents are the editable interface; external pack upload and a garage paint editor are future work.

These are intentionally simple boxy toy bodies that demonstrate the art boundary. Painted details cannot change their silhouette. GLB loading, physically detailed bodies, PBR packs, and an import manifest remain planned.

## Proposed production asset contract — not implemented yet

- Mesh delivery: GLB/glTF, normalized scale and origin, declared bounds, wheel pivot nodes, and optional lamp/exhaust/camera sockets. Collision footprint stays in mechanics data and is checked against the mesh dimensions.
- Material slots: body paint, trim, glass, tires, rims, headlights, brake lights. Prefer named slots over source mesh ordering.
- Body families: `coupe-v1` and `sedan-v1`, each with an authored stable UV layout. Another body shape needs its own compatible template or deliberate UV transfer.
- Editable source: layered paint file plus an SVG/PNG UV guide with clearly labeled hood, roof, trunk, and door regions. Export a flattened base-color PNG; optional normal and roughness/metalness maps come later.
- Manifest: version, pack ID, compatible body ID, UV version, model/texture paths, material mapping, attribution, and license metadata. Cosmetic values never override torque, money, condition, or collision rules.
- Validate supported versions, bounded image/model size, known local asset paths, required slots, and body compatibility. Packs are data/assets, not executable scripts. Provide a built-in fallback while loading or on failure.
- Start with one modest-resolution skin, then set measured GPU-memory, draw-call, and download budgets before offering higher-resolution tiers. Add LODs/texture compression after measurements establish a need.
- Asynchronous GLB loading needs a request generation token: a late car-A load must not replace car B selected afterward. Dispose abandoned results. Keep this work out of the simulation loop.

## Artist workflow

1. Author the generic body and wheel pivots once.
2. Unwrap and freeze its versioned UV layout; export the paint guide.
3. Paint the guide in an image editor, preserving seam alignment and excluding guide lines from the final export.
4. Export the skin and declare compatibility in the pack manifest.
5. Preview front/back/sides, wheels, lighting, and silhouette in a garage viewer.
6. Run the same headless driving replay with both skins and verify identical mechanics.

Changing a texture can change paint, decals, and surface finish. It cannot change silhouette, door count, or mesh detail. Replacing all graphics also requires world, UI, effects, camera, and audio adapters; main.js still contains some of that work. Reusing gameplay in another engine may require a port, even with clean boundaries.

## References

- [Blender UV layout export](https://docs.blender.org/manual/en/5.0/addons/import_export/mesh_uv_layout.html): exports an image guide for painting textures externally.
- [Khronos glTF](https://www.khronos.org/gltf/): interoperable runtime model/material delivery.
- [glTF PBR materials](https://www.khronos.org/gltf/pbr): standardized surface parameters.
