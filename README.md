# TinyTools

TinyTools is a cross-platform desktop hub for small, focused utilities. The current foundation includes the Hub, a searchable tool registry, local development entitlements, a separate product catalog, theming, settings, and **Count.**, a unified counting workspace.

Count supports multiple named counters, list and board views, optional goals, daily
resets, sessions, and local history without splitting those variations into separate
products. It works offline and persists its state locally.

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

Edit `defaultOwned` in `src/core/entitlements/LocalDevEntitlementProvider.ts` to exercise owned and locked states. Free tools remain usable without an entitlement.
