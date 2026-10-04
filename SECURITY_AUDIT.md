# Security audit — October 4, 2026

Scope: application modules, HTML/CSS/SVG, local server, map/save validation, bundled dependency, publication surface, and release/CI workflows. Source review and regression/release checks are not penetration-test certification or a guarantee of zero defects.

| Finding | Resolution |
| --- | --- |
| Local server exposed arbitrary checkout files, unsafe if made public later | Game-path allowlist, loopback binding retained, realpath containment against symlink escape, GET/HEAD only |
| No isolated release; root publishing could expose artifacts | Allowlisted dist build excludes tests/server/docs/artifacts/dotfiles; rejects symlinks/unexpected output |
| No browser content policy | Release CSP/referrer meta and local server security headers |
| Map files read before size check | Check bytes before reading; existing JSON/grid/location/road/connectivity validation retained |
| Save parser had no input bound | Reject non-string/over-5-million-character input before parsing; semantic validation/migration retained |
| Publication ignores incomplete | Ignore artifacts and local agent directories alongside env/log exclusions |
| No publication checks | CI/manual Pages workflow checks/tests/build, disables dev release flag, pins official actions, limits permissions |

Application DOM uses textContent/DOM construction. The sole innerHTML assignment is a constant map-editor template with no player/import interpolation. No application eval, Function constructor, external scripts, or analytics endpoint was found. Texture paths are fixed original local SVGs; arbitrary uploads are not supported.

Career rules validate integer money, transaction/ownership consistency, conditions, appearance IDs, and driver assignments/receipts. Invalid saves use existing recovery handling. Saves are not authenticated and players can edit their own careers. Sandbox/profile access and free resets are prototype design choices, unsuitable for a trusted competitive economy.

Three.js is vendored locally at revision **186**, with MIT license. There are no package dependencies/install hooks, so npm audit is not applicable. Upstream reported no published advisories when checked: https://github.com/mrdoob/three.js/security . This does not prove zero vulnerabilities; monitor upstream especially before adding imported asset loaders. No version upgrade was made solely for the audit.

A pattern scan of publishable first-party source found no recognizable private keys or common API/GitHub/AWS token patterns. This is a limited scan, not proof that no secret exists. No Git history existed at audit start. Reference collages and local screenshots are not release assets.

No backend/database/authentication exists to audit. Audio, gamepad and pointer lock use browser-controlled APIs. Physical controller/device and hosted verification remain separate from local checks.

Before public release choose repository/visibility and a project license, publish only dist over HTTPS, and complete DEPLOYMENT.md checks. Pages cannot supply custom anti-framing headers; use a configurable host if required.

## Verification results

- 159 tests passed, including real HTTP GET/HEAD, private-file rejection, unsupported-method rejection, input bounds, and release module/asset completeness.
- 118 JavaScript files passed syntax checking. Release contains 86 static files, with development config disabled and no excluded files.
- Browser release smoke check: normal tutorial renders despite the developer test-drive query; Civic practice city/phone/dashboard render with no captured warning/error logs. Screenshot: `artifacts/static-release-audit.png` (excluded from publication).
- Action commit pins were resolved from official GitHub repositories. GitHub-hosted workflow execution and physical controller checks have not been performed.
