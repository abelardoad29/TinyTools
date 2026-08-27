# TinyTools

TinyTools is a hub of small, focused utilities that runs as a web app first and a
cross-platform desktop app (Tauri) second. Every tool works fully offline in the
browser using a local-storage adapter, or in the desktop app via the Tauri Store.

Free toolkits today: **Count.**, **Time.** (timer/stopwatch/Pomodoro/countdown),
**Dev Toolkit.** (JSON/CSV/Base64/UUID/hash/regex/JWT/Unix time), **Text Toolkit.**
(case/count/clean/clipboard/find-replace/lines/slug/lorem/diff), **Calculators
Toolkit.** (units/storage/DPI/aspect/dates/percentages/rule-of-three/time-decimal/
bytes/coordinates), and **QR & Barcode Toolkit.** Every tool is fully usable for
free; a single **TinyTools Pro** entitlement (`app.pro`) unlocks a handful of
advanced features across them — see `CODEX.md` §1.1 for the model.

## Requirements

- Node.js 20 or newer
- pnpm 10
- For desktop development: the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for Windows or macOS, including Rust

## Install

```bash
corepack enable
pnpm install
```

## Development

Run the frontend in a browser:

```bash
pnpm dev
```

Run the desktop application:

```bash
pnpm tauri:dev
```

If pnpm is managed through Corepack and is not installed globally, use
`corepack pnpm tauri:dev`. Tauri's lifecycle hooks also invoke pnpm through
Corepack so desktop commands work with this setup.

Browser development uses a local-storage adapter. The packaged desktop app uses the official Tauri Store plugin, behind the same neutral storage interface.

## Quality and builds

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm build
pnpm tauri:build
```

For the Rust shell:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo check --manifest-path src-tauri/Cargo.toml
```

## Structure

- `src/app` — routing, Hub layout, command palette, pages, and error boundary
- `src/components` — shared UI and the reusable tool shell
- `src/core` — catalog, entitlements, and platform-neutral storage
- `src/design-system` — theme tokens and visual foundations
- `src/stores` — small application-wide state
- `src/tools` — isolated tool manifests and implementations
- `src-tauri` — minimal native Tauri 2 shell and permissions

Tool metadata lives in each tool's manifest and is composed once by `src/tools/registry.ts`. Commercial data is intentionally separate in `src/core/catalog`.

## Development entitlements

The app ships with `GumroadEntitlementProvider` (`src/core/entitlements/GumroadEntitlementProvider.ts`), which checks Pro status against `/api/verify-license` — a real license key and a deployed Functions endpoint. Free tools remain fully usable without any entitlement.

To force a Pro or free state locally instead of going through a real license, swap the `entitlementService` import in `src/stores/appStore.ts` for `new LocalDevEntitlementProvider(new Set(["app.pro"]))` (or an empty set) from `src/core/entitlements/LocalDevEntitlementProvider.ts` — don't commit that swap.

## Deploy (web)

The web build is a static site plus one Edge Function (`api/verify-license.ts`), targeting [Vercel](https://vercel.com):

```bash
corepack pnpm exec vercel login   # one-time, opens a browser to authenticate
corepack pnpm exec vercel link    # one-time, links this folder to a Vercel project
pnpm vercel:deploy                # builds and deploys to production
```

Vercel auto-detects the Vite framework preset (build command, `dist/` output) and picks up `api/verify-license.ts` as an Edge Function with no extra config. First deploy gives you a free `https://<project>.vercel.app` URL — no custom domain required to go live. To try the function locally before deploying, `pnpm vercel:dev` runs the app behind the Vercel dev server.

Set `GUMROAD_PRODUCT_ID` as an environment variable in the Vercel project settings (Settings → Environment Variables) once the "TinyTools Pro" product exists on Gumroad (see `HERRAMIENTAS_PENDIENTES.md`, Fase C) — the verify endpoint won't work without it. Optional: `VITE_ADSENSE_CLIENT_ID` / `VITE_ADSENSE_SLOT_ID` (see `.env.example`) enable the ad banner once there's an approved AdSense account for the live domain.

Note: Vercel's free Hobby plan is intended for non-commercial projects per its terms — worth knowing since this project sells things, though plenty of small side projects run there anyway; upgrade to Pro (or move to a host like Cloudflare Pages, whose free tier explicitly allows commercial use) if that ever becomes a concern.

The Tauri desktop build (`pnpm tauri:build`) doesn't need any of this and never shows ads. Its Pro activation flow calls the deployed web app's endpoint over the internet instead of a relative path — set `VITE_VERIFY_ENDPOINT` (see `.env.example`) to the live URL before building for desktop, once one exists. Desktop distribution itself is deferred to Fase D (`HERRAMIENTAS_PENDIENTES.md`).
