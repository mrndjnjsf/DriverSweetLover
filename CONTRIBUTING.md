# Contributing

This playable prototype has a public source repository but no project license or formal contribution process yet. Public visibility does not grant an open-source license. The owner will choose a license before accepting outside contributions.

For local development, run `node server.mjs` and visit <http://localhost:5174/>. Run `node --test tests/*.test.mjs` for the rule checks. No package installation is needed. Keep driving physics, vehicle condition, career transactions, and map data separate from DOM and Three.js code. Add a focused behavior test when changing a rule that can affect saves, money, gear selection, damage, or route validity.

Use explicit physical units and integer cents. Validate files and persisted data before using them. Keep browser storage backward compatible or provide a migration. Avoid editing the same shared module in parallel with another contributor; agree on the interface first, then integrate from separate modules.

The supplied car reference collages informed original stylized models. Do not add third-party photos, car meshes, sounds, or fonts without recording their source and redistribution terms. Record known limitations and physical-device results with each playable checkpoint.
