# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

# @tastic/physics

2D arcade-game physics: circle/rect/rounded-rect collision detection and response, friction, gravity
wells, springs, and velocity clamping. Pure, framework-agnostic functions built on
[`@tastic/core`](https://github.com/jayrdeaton/react-native-game-core)'s `Vec2` — no React or React
Native dependency, so they're callable equally from a plain JS game loop or from inside a Reanimated
worklet (several functions carry a `'worklet'` directive for that reason).

Part of the `@tastic` package ecosystem. Sibling package: `@tastic/core`
(`../React-Native-Game-Core`). Published at https://www.npmjs.com/package/@tastic/physics.

## Commands

```bash
npm run lint         # ESLint
npm run fix          # ESLint --fix
npm run build        # tsup, outputs CJS + ESM + types to dist/
npm run build:watch  # tsup --watch
npm test             # Jest (51 tests, coverage on by default)
npm run test:watch   # Jest in watch mode
npm run typecheck    # TypeScript type check (tsc --noEmit)
npm run verify       # lint + test + typecheck + build, in that order
```

Always run `npm run lint` before finishing any task.

## Release

Published, tag-based, using npm trusted publishing (OIDC, no token required) — currently `0.1.3` on
the registry, published via GitHub Actions.

```bash
npm run release:patch   # npm version patch && git push --follow-tags (or release:minor / release:major)
```

`preversion` runs `npm run verify` first. `prepublishOnly` runs `npm run build`. `publish.yml` fires on
`v*` tags and delegates to the shared reusable workflow
(`infinitetoken/Workflows/.github/workflows/npm-publish.yml@v1`) with `id-token: write` permission for
OIDC trusted publishing. `ci.yml` runs on every PR and push to `main` via the shared `npm-ci.yml`
reusable workflow, which runs `npm run verify`.

## Architecture

```
src/
  index.ts       - public export barrel, re-exports everything below
  boundary.ts    - reflectAxis (single-axis wall bounce), reflectCircleInRoundedRect (contains a
                   circle inside a rounded-rect boundary, bouncing off whichever edge/corner it crosses)
  collision.ts   - circleVsRect, circleVsCircle (narrow-phase detection, unit normal + depth),
                   reflectOffNormal (bounce a velocity off a surface), resolveCircleCollision
                   (two-body elastic/inelastic circle-vs-circle response)
  friction.ts    - applyFriction: frame-rate-independent exponential drag
  gravity.ts     - applyGravityWells (bounded, quadratic-falloff attractor/repeller field, one or
                   many wells), applyGravityPull (unbounded linear pull toward a single center)
  spring.ts      - applySpringForce: damped spring pull toward a target point
  velocity.ts    - clampSpeed: caps a velocity's magnitude without changing its direction
  __tests__/
    boundary.test.ts
    collision.test.ts
    friction.test.ts
    gravity.test.ts
    spring.test.ts
    velocity.test.ts
```

Single build entry point (`src/index.ts`), no subpath exports. No `__mocks__/` directory — nothing here
touches a native module, so nothing needs mocking.

## Public API

From `src/index.ts`:

- **boundary** — `reflectAxis`, `reflectCircleInRoundedRect`; types `AxisReflection`,
  `CircleBoundaryReflection`, `RoundedRectBounds`
- **collision** — `circleVsCircle`, `circleVsRect`, `reflectOffNormal`, `resolveCircleCollision`;
  types `Collision`, `CircleBody`, `CircleCollisionResult`
- **friction** — `applyFriction`
- **gravity** — `applyGravityPull`, `applyGravityWells`; types `ApplyGravityWellsOptions`, `GravityWell`
- **spring** — `applySpringForce`
- **velocity** — `clampSpeed`

## Peer Dependencies

- `@tastic/core` `>=0.1.0` — required (internal fleet package, `../React-Native-Game-Core`). Supplies
  the `Vec2` type and the vector-math functions this package builds on (`add`, `subtract`, `scale`,
  `length`, `dot`) — never `useGameLoop` or anything else from that package's React side, so this floor
  stays loose deliberately.

## Testing

- Framework: Jest (`@infinitetoken/jest-config/react-native`), jsdom environment — pure math, no DOM
  APIs actually exercised in the tests themselves; jsdom is just what the shared RN preset defaults to
- No mocks, no `moduleNameMapper` override — nothing in `src/` imports a native module
- No local `jest.config.cjs` overrides — `@infinitetoken/jest-config@0.2.1`'s `/react-native` preset
  now defaults `testEnvironmentOptions.customExportConditions: []` itself, so the local override this
  repo used to need was removed once the pin was bumped. Previously: jsdom's default
  "browser" export condition would otherwise resolve `@tastic/core` to its untranspiled
  `src/index.ts` instead of the built `dist/index.js` — this override is load-bearing, not
  decorative (removing it breaks 4 of 6 suites with a "Must use import to load ES Module" error)
- 51 tests across 6 suites, one per source module
- Coverage (measured 2026-08-30): **100 / 96.15 / 100 / 100** (statements/branches/functions/lines),
  against the shared preset's 70% floor on all four metrics — no local `coverageThreshold` override.
  The only branch gap is in `collision.ts` (lines 30, 41): the `dist < 0.001` exact-overlap fallback in
  `circleVsRect`/`circleVsCircle`, an edge case that's a real branch in the code but not worth
  contriving a test for
- `collectCoverageFrom` (shared default, no local override) is `src/**/*.{ts,tsx}` minus `*.d.ts` and
  `src/index.ts` — the barrel file itself is excluded from coverage measurement

## Code Style

Enforced by ESLint + Prettier, run `npm run lint` before finishing any task. `eslint.config.cjs` is a
bare `require('@infinitetoken/eslint-config/react-native')` — no local rules or ignores.

**Prettier config** (`@infinitetoken/eslint-config/prettier`):
- Single quotes, JSX single quotes
- No semicolons
- No trailing commas
- Print width: 1000 (effectively disabled)

**ESLint rules (warnings unless noted):**
- `simple-import-sort/imports`, `simple-import-sort/exports` — imports and exports must be sorted
- `no-console` — no console statements
- `@typescript-eslint/no-unused-vars` — `varsIgnorePattern`/`argsIgnorePattern`/
  `caughtErrorsIgnorePattern: '^_'` (unused vars/args/caught errors prefixed `_` are allowed)
- `@typescript-eslint/no-require-imports` — off (needed for this repo's own `.cjs` config files)
- `@typescript-eslint/no-explicit-any` — off in `__tests__/`/`__mocks__/`; on in `src/` proper
- `package-json/order-properties`, `package-json/sort-collections` — on `package.json` itself
- `react-hooks/rules-of-hooks` — error, not a warning; `react-hooks/exhaustive-deps`,
  `react-hooks/refs`, `react-hooks/immutability`, `react-hooks/preserve-manual-memoization`,
  `react-hooks/set-state-in-effect` — warn
- `react-native/no-inline-styles`, `react-native/no-unused-styles` — warn (`no-raw-text` off)

The `react-hooks`/`react-native` rules ship with the shared `react-native` preset fleet-wide but are
inert in this package — there are no hooks or RN components in `src/`, it's pure math.

`tsconfig.json` is `extends: "@infinitetoken/tsconfig/react-native"` with `include: ["src"]`, no local
compiler-option overrides. `tsup.config.cjs` is `require('@infinitetoken/tsconfig/tsup/lib')()`
(target `es2020`, CJS + ESM + `.d.ts`/`.d.mts`, matching `package.json`'s single `"."` `exports` entry).
