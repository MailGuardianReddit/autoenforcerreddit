# AutoEnforcer Companion (Chrome / Opera Extension)

Mod-side companion for the [AutoEnforcer](../README.md) Devvit app. Injects inline
rule-match badges on reddit.com posts and comments, a slash-style command
palette (`!` in any composer or `Ctrl+Shift+Space`), and a floating mod-queue
overlay (FAB or `Ctrl+Shift+Q`) that works on any Reddit page.

## Build

```pwsh
cd extension
npm install
npm run build
```

Output lands in `extension/dist/` (minified by Vite + esbuild).

## Package + publish a release

```pwsh
cd extension
npm run release                     # build, zip, draft GitHub release (default)
npm run release -- --publish        # publish immediately (not draft)
npm run release -- --tag ext-v0.2.0 # override tag
npm run release -- --notes "..."  # custom release notes
```

`scripts/release.mjs` cleans `dist/`, runs `vite build`, zips the contents into
`extension/release/autoenforcer-extension-v<version>.zip`, then calls
`gh release create` against the configured remote. Requires the GitHub CLI
(`gh auth status`) to be logged in with `repo` scope.

The zip packs the contents of `dist/` (not the `dist/` folder itself) so users
can unzip and Load Unpacked directly.

## Generate icons (one-time)

1. Open `extension/icons/build-icons.html` in any browser.
2. Click each download button (16, 32, 48, 128).
3. Move the resulting PNGs into `extension/icons/`.
4. Re-run `npm run build`.

## Load it

### Chrome / Edge / Brave
1. Visit `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and pick `extension/dist/`.

### Opera
1. Visit `opera://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and pick `extension/dist/`.

> Opera works because the extension uses only the cross-Chromium MV3 surface
> (no `chrome.sidePanel`, no advanced `declarativeNetRequest`). Opera users can
> also install via the Chrome Web Store after we ship there (via Opera's
> "Install Chrome Extensions" add-on).

## Configure

1. Click the toolbar icon.
2. Paste your deployed Devvit web URL in **Server URL**.
3. Paste a mod bearer token (issued from Rule Studio - TODO endpoint).
4. Hit **Test** to verify reachability, then **Save**.

## Server-side TODOs

These need to be added to `src/server/routes/api.ts`:

- `GET /api/diagnostics/:thingId` -> reads `reportLockDiagnosticsStore` + `modlogStore`.
- `GET /api/user-dossier/:username` -> wraps `userExternalProfile` + `memberScoring` + `activityMetrics`.
- CORS preflight (`OPTIONS`) returning `Access-Control-Allow-Origin: chrome-extension://*`
  and `Access-Control-Allow-Headers: authorization, content-type`.
- Bearer-token issuance endpoint (mints + Redis-hashed under `amu:mod-token:<hash>` with TTL).

## Layout

```
extension/
  manifest.json
  package.json
  tsconfig.json
  vite.config.ts
  icons/
    source.svg
    build-icons.html
  scripts/
    release.mjs               # build + zip + gh release create
  src/
    background.ts             # MV3 service worker - message router
    content/
      badge.ts / badge.css         # inline rule-match badges + user dossier modal
      command-menu.ts / .css       # !-prefixed command palette
      queue-tools.ts / .css        # FAB + queue overlay (Ctrl+Shift+Q) + inline queue toolbars
    popup/
      popup.html / .css / .ts # toolbar UI (multi-sub slots + encryption keys)
    lib/
      api.ts                  # snapshot + modqueue fetch, AES-GCM decrypt
      storage.ts              # chrome.storage.local wrapper
      types.ts
```
