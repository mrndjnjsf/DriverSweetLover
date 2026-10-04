# Static deployment

## Current playable release

Published October 4, 2026 through Sites: https://driver-sweet-lover.janjosef-miranda.chatgpt.site . Version 1 is public and requires no game account. The host confirmed deployment success; browser QA verified the rendered Mustang tutorial without captured warnings/errors. Physical Xbox/device checks still need player testing. GitHub publication is deferred; no GitHub repository was created or made public.

Site identity is persisted in `.openai/hosting.json`; deployment/version identifiers and the exact source SHA are in `.openai/deployment.json`. Reuse this Site, never register it again. Its separate source checkout is `sites/driver-sweet-lover` and contains the exported release plus its hosting manifest. It is ignored by the main project's future GitHub repository. To update: build the main project, synchronize the new dist files into that checkout without disturbing its Git history/hosting identity, obtain a fresh credential for this Site, then use the Sites source helper to commit/push/package and save/deploy the verified version. Credentials go through hidden stdin only, never files or shell arguments.

On this Windows host, run the source helper with `C:\Program Files\Git\bin` prepended to PATH and `TAR_OPTIONS=--force-local` in that process environment. This selects installed Git Bash instead of uninstalled WSL and makes GNU tar treat Windows drive paths as local files. Deployment preparation uses `artifacts/driver-sweet-lover-site.tar.gz`; preserve a saved version's archive until saving succeeds.

The game needs no backend. Physics, jobs, city, traffic, audio, and career rules execute in the browser. Saves use localStorage on the current origin/device. Node runs checks, produces a release, and optionally previews files. There are no accounts, network multiplayer, cloud saves, real payments, or server-authoritative scores.

## Build and preview

Use Node 22 or later. No npm packages need installing.

```sh
node scripts/check.mjs
node --test tests/*.test.mjs
node scripts/build.mjs
node server.mjs --release
```

Publish `dist/`, never the repository root. It contains only game HTML/CSS/modules, bundled Three.js/license, and original SVG skins. Release development controls are disabled; source development controls remain available. The build rejects symlinks and unexpected output files. Asset paths are relative and support GitHub project sites under `/repository-name/`.

## GitHub Pages

1. Create the destination repository and push source including `.github/workflows/`. Ignore artifacts, builds, credentials, and local saves.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Restrict the `github-pages` environment to the intended release branch, optionally requiring approval.
4. Run **Publish static game** manually from Actions on that branch. It checks syntax, runs tests, builds, uploads `dist`, and deploys. Ordinary pushes/PRs only run checks.
5. Open the HTTPS URL; check tutorial/starter choice, phone, jobs, skins, save/reload, mouse lock, and physical Xbox controller. Localhost saves do not transfer to the new origin.

Actions use verified commit pins; checkout does not retain credentials. Only the deploy job has Pages/OIDC write permissions. Update pins deliberately.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Security and limits

Release HTML has a Content Security Policy restricting scripts/resources to this site and disabling plugins/forms. Inline styles remain allowed for animated HUD/renderer style properties. No inline scripts or dynamic evaluation are needed. Referrers are suppressed. Local preview adds MIME sniffing and anti-framing headers. GitHub Pages does not support arbitrary custom response headers; on a configurable host add `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and CSP `frame-ancestors 'none'`. Meta CSP cannot enforce anti-framing.

Saves are player-editable, not an anti-cheat boundary. Sandbox/profile queries are practice/diagnostic modes with isolated temporary storage. Developer Mustang access requires loopback and an enabled flag, disabled in releases. Free resets and time jumps remain intentional prototype gameplay tools; review them before commercial release.

A backend is needed for shared multiplayer, trusted leaderboards/economy, accounts, cloud sync, or real purchases. Validate those transactions server-side rather than trusting localStorage.

## Before publication

- Choose a license for your code/assets before calling this open source. No project license has been selected; the Three.js MIT notice is retained.
- Review car branding/models for the intended release. Reference collages are not shipped.
- Choose GitHub account/repository and visibility. Preparation does not create, push, or publish a repository.
- Review SECURITY_AUDIT.md and complete the hosted/device checklist. Local checks do not verify account settings or physical controller compatibility.
