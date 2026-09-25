# AGENTS.md

Guidance for AI agents working on the picture-logic codebase.

## Project Overview

**picture-logic** is a SvelteKit web app for creating, sharing, and solving nonograms (picross / paint-by-numbers puzzles). It is currently in development. Planned and partially-implemented features include:

- Interactive nonogram solving with mouse and touch input
- Z3-based automatic solver (SAT constraint solving via `z3-solver` WASM)
- Puzzle creation and sharing (not yet implemented)
- Persisted user settings (theme, color palette, grid spacing) via `localStorage`

## Tech Stack

- **Framework**: SvelteKit (Svelte 5 with runes — `$state`, `$derived`, `$props`, `$effect`, `$bindable`)
- **Language**: TypeScript (strict mode, `checkJs` enabled)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), `@tailwindcss/forms`, `prettier-plugin-tailwindcss`. Dark mode via `[data-theme=dark]` custom variant.
- **UI components**: `daisy-ui` https://daisyui.com/
- **Solver**: `z3-solver` (WASM) — requires Cross-Origin isolation headers (COOP/COEP)
- **Testing**: Vitest with `@vitest/browser-playwright` (browser tests for `.svelte` files) and node environment (server tests)
- **Package manager**: bun (`bun.lock`); npm scripts defined in `package.json`
- **Adapter**: `@sveltejs/adapter-node` (default, for Docker/standalone) or `@sveltejs/adapter-netlify` (for Netlify), selected at build time via the `ADAPTER` env var in `svelte.config.js`

## Commands

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `bun run dev`       | Start Vite dev server                              |
| `bun run build`     | Production build                                   |
| `bun run preview`   | Preview production build                           |
| `bun run check`     | Type-check with `svelte-check` (run after changes) |
| `bun run lint`      | Prettier check + ESLint (run after changes)        |
| `bun run format`    | Auto-format with Prettier                          |
| `bun run test`      | Run unit tests once (Vitest)                       |
| `bun run test:unit` | Run unit tests in watch mode                       |
| `bun run benchmark` | Run the server-side solver benchmarks              |
| `docker compose up` | Build and run the app + Postgres DB via Compose    |

Always run `bun run lint` and `bun run check` after making changes.

## User Workflow Preferences

- Ask the user before making architectural decisions.
- Prefer easy-to-read code. If an approach cannot remain easy to read, pause and ask the user before implementing it.
- After every plan step or user prompt, run the formatter and commit the changes made for that step or prompt.
- Apply these preferences to delegated subagents and external agents, including Claude.

## Project Structure

```
src/
  app.d.ts              # SvelteKit app types
  app.html              # HTML shell (loads z3-built.js, sets globalThis.initZ3)
  lib/
    index.ts            # $lib barrel (currently empty)
    generator.ts        # Entropy-weighted random nonogram generation
    generator.test.ts   # Generator bounds, clue, and entropy tests
    solver.ts           # Nonogram automata, propagation, and Z3 solver logic
    solver.test.ts      # Solver correctness and encoding-size regressions
    solver-benchmark.ts  # Reusable solver benchmark cases, runners, and reports
    solver.bench.ts     # Vitest benchmark registrations for solver implementations
    storable.ts         # localStorageWritable + global settings stores
    util.ts             # mapXY, starsAndBars, palette helpers, PALETTES
    assets/
      favicon.svg
    components/
      Nonogram.svelte   # Grid rendering, mouse/touch input
      Navbar.svelte     # Top navigation (uses bits-ui NavigationMenu)
      Timer.svelte      # requestAnimationFrame-based timer
      Caret.svelte      # Animated dropdown caret
  routes/
    +layout.svelte      # Global layout (theme, navbar)
    +page.svelte        # Main solve page (hardcoded sample nonogram)
    create/
      +page.svelte      # Entropy-based random puzzle generator
    layout.css          # Tailwind import, dark variant, iconify plugin, palette source
    settings/
      +page.svelte      # Settings page (palette, grid size)
static/
  robots.txt
vite.config.ts          # Z3 static copy + COOP/COEP middleware + vitest config
svelte.config.js        # adapter-node/adapter-netlify (via ADAPTER env var), vitePreprocess
eslint.config.js        # ESLint flat config (TS + Svelte + Prettier)
netlify.toml            # Netlify build config (sets ADAPTER=netlify, COOP/COEP headers)
Containerfile           # OCI image build (bun base, builds and serves app)
compose.yml             # Docker/Podman Compose: app service + Postgres DB
.dockerignore           # Excludes node_modules, build, .svelte-kit, etc. from image
.husky/
  pre-commit            # Runs lint-staged (formats staged files) before commit
```

## Architecture

### Nonogram Solver (`src/lib/solver.ts`)

The `Nonogram` class holds `horizontal` (column clues) and `vertical` (row clues) as `number[][]`. It implements `Solvable<SolvedNonogram>` via `solve(ctx)` and exposes `solveDetailed(ctx)` for diagnostics:

- Validates clue lengths and copies the input arrays.
- Compiles each clue line into a cached finite automaton instead of enumerating complete placements.
- Runs forward/backward line reachability in a queued row/column propagation pass. Easy puzzles can finish without creating a Z3 solver.
- For unresolved cells, creates one Boolean variable per cell and encodes automaton boundary-state transitions with Boolean constraints.
- Checks satisfiability with `solver.check()`, evaluates the model with completion, validates both clue axes, and returns `{ cells }` or `'unsat'` through the compatibility API.
- `solveDetailed(ctx)` additionally reports `sat`, `unsat`, or `unknown` and records propagation, encoding, check, model, cache, and formula-size metrics.

`NonogramGame` tracks `move_history` (positions + checkpoints) and optional `timeMs`.

### Solver Benchmarks (`src/lib/solver-benchmark.ts`)

- Defines reusable benchmark cases and solver callback registrations.
- Measures wall-clock time, status counts, and averaged `NonogramSolveMetrics` fields.
- `src/lib/solver.bench.ts` registers the current solver with Vitest's server project; add future solver callbacks to the local `solvers` list.
- Run with `bun run benchmark`. Vitest sampling is bounded per case because repeated Z3 WASM allocations can exhaust the module heap.

### Entropy Generator (`src/lib/generator.ts`)

- `generateEntropyNonogram()` chooses a square size from 10 through 50 and returns the generated solution, derived clues, fill ratio, and normalized binary entropy.
- Cell density is sampled from entropy-weighted candidates, favoring balanced patterns while retaining randomness.
- The generated solution is column-major (`solution[x][y]`) to match the solver's cell representation; the create page keeps it hidden from the playable grid.

### Settings & Storage (`src/lib/storable.ts`)

`localStorageWritable<T>` creates a Svelte writable store backed by `localStorage` with serialization, validity checks, and cross-tab `storage` event sync. Global stores:

- `THEME` (`boolean`, dark mode toggle)
- `ENHANCED_BORDER_SPACING` (`number > 0`, controls thick border every N cells)

### Utilities (`src/lib/util.ts`)

- `mapXY(width, height, fn)` — 2D array builder.
- `starsAndBars(balls, buckets)` — enumerates compositions for solver clause generation (first/last bucket may be empty).
- `PALETTES` — tuple of Tailwind color names; `Palette` type.
- `getPalleteClasses(palette, utility, step, darkStep?, enabled?, pseudoClass?)` — returns an object of conditional Tailwind class keys for dynamic palette theming. Note the typo `getPalleteClasses` (missing 't') — keep consistent with existing usage.

### Z3 / WASM Integration

- `vite-plugin-static-copy` copies `z3-built.*` from `node_modules/z3-solver/build` to the build root.
- `vite.config.ts` adds a middleware setting `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` for `/`, `/z3-built.wasm`, `/z3-built.js` to enable `SharedArrayBuffer` (required by z3-solver).
- `app.html` loads `z3-built.js` via a script tag and sets `globalThis.global = { initZ3: globalThis.initZ3 }` (workaround for z3 issue #6768).
- In-page usage: `import { init } from 'z3-solver'; const { Context } = await init(); const ctx = Context('main');` then `nonogram.solve(ctx)`.

## Conventions

### Code Style

- **Formatting**: Prettier with tabs, single quotes, no trailing commas, `printWidth: 100` (see `.prettierrc`). Tailwind class sorting via `prettier-plugin-tailwindcss`.
- **Svelte 5 runes**: Use `$state`, `$derived`, `$props`, `$effect`, `$bindable` — do not use legacy `export let` / `let = value` reactivity.
- **Props typing**: Components define a `Props` interface and destructure via `$props()`; optional class prop named `class` (often aliased to `classes`/`className`) accepts `Record<string, boolean | string>`.
- **Class bindings**: Use object syntax `{}` for conditional classes (Svelte 5 / Tailwind). Dynamic palette classes come from `getPalleteClasses(...)`.
- **Snippets**: Use `{#snippet name(args)}...{/snippet}` and `{@render name(args)}` (see `Nonogram.svelte`).
- **Exports from components**: Use `export function` inside `<script>` for imperative APIs accessed via `bind:this` (e.g., `Timer`'s `startTimer`/`stopTimer`).
- **Comments**: Do not add comments unless explicitly requested (per repo lint/agent rules). Existing code contains JSDoc on `localStorageWritable`.
- **TypeScript**: Strict mode. `no-unused-vars` and `@typescript-eslint/no-unused-vars` are disabled in ESLint; rely on `tsc`/`svelte-check` for type errors.

### File Naming

- Svelte components: PascalCase (e.g., `Nonogram.svelte`, `Timer.svelte`).
- TS modules: lowercase (e.g., `solver.ts`, `storable.ts`, `util.ts`).
- Routes: SvelteKit convention (`+page.svelte`, `+layout.svelte`).

### Imports

- Use the `$lib` alias for `src/lib` imports (e.g., `import { Nonogram } from '$lib/solver'`).
- SvelteKit provided imports: `import { browser } from '$app/environment'`, `import { writable } from 'svelte/store'`.

## Testing

Vitest config in `vite.config.ts` defines two projects:

- **client**: browser (Playwright/chromium) tests — include `src/**/*.svelte.{test,spec}.{js,ts}`, excludes `src/lib/server/**`.
- **server**: node environment — include `src/**/*.{test,spec}.{js,ts}` excluding the `.svelte` tests.

`test.expect.requireAssertions: true` — every test must contain at least one assertion.

Place component tests as `Foo.svelte.test.ts` next to the component; place logic tests as `foo.test.ts`.

`src/lib/solver.test.ts` covers exact-fit, impossible, empty, ambiguous, larger-grid, crossing-contradiction, and malformed-clue cases. `solveDetailed` metrics provide the basis for future repeatable benchmarks.

## Git Hooks

Pre-commit is managed by **husky** (`.husky/pre-commit`) and runs **lint-staged**. lint-staged runs `prettier --write` on staged files matching `*.{js,ts,svelte,json,css,md}` and re-stages the result. The `prepare` script (`husky && svelte-kit sync || echo ''`) installs the hooks automatically after `bun install`.

## Containerization

The same codebase deploys to either target via the `ADAPTER` env var (see `svelte.config.js`): unset/`node` → `adapter-node` (Docker/standalone), `netlify` → `adapter-netlify`. `netlify.toml` sets `ADAPTER=netlify` for Netlify builds and also emits the COOP/COEP isolation headers required by Z3 across the whole site.

`Containerfile` is a multi-stage build from `oven/bun`: it installs deps with `--frozen-lockfile`, runs `bun run build` with `ADAPTER=node` (adapter-node emits a self-contained server in `build/`), then runs `bun run ./build/index.js` on port `3000`. `compose.yml` defines two services:

- **db**: `postgres:17-alpine` with a healthcheck and a named volume (`pgdata`) for persistence.
- **app**: builds from `Containerfile`, depends on `db` being healthy, and receives `DATABASE_URL` (`postgres://picturelogic:picturelogic@db:5432/picturelogic`).

The app does not yet consume the database; the infra is scaffolded for future use. `.dockerignore` excludes `node_modules`, `build`, `.svelte-kit`, `.netlify`, and `.git`.

## Maintaining This File

Update `AGENTS.md` whenever significant changes are made to the codebase — e.g. adding/removing dependencies or scripts, introducing new top-level files or directories, changing architecture, conventions, or tooling. Keep the Project Structure tree, Commands table, and Architecture sections in sync with reality. Do not let this file go stale.

## Current State / TODOs

- Main page (`+page.svelte`) uses a hardcoded sample nonogram (`[[],[],[5],[1],[],[]]` / `[[1]...]`). Puzzle sharing is not yet implemented; `/create` generates playable random puzzles.
- Win detection / solved check is stubbed (see TODOs in `+page.svelte`).
- Error messaging for `'unsat'` uses `alert()` (placeholder).
- COOP/COEP isolation headers for Z3/`SharedArrayBuffer` are set via Vite middleware in dev and via `netlify.toml` on Netlify; the adapter-node production server (Docker) does not yet set them.

- Create Navbar + Nonogram component
  - Nonogram component
    - Timer
    - Cross out with right click
    - Checkpoints
  - Navbar
    - Index Page
    - Create Page
    - Upload Page
      - Let user change preview
      - fix theming for daisy-ui
      - create secondary mode using edge detection algorithm
    - Theme controller
    - Search?
- Setup DB
  - Generate schema for nonogram
  - Nonogram foreign key to user table with solved boolean
  - Expose database backup via page if I take down page at some point

Next time:

- Add a repeatable benchmark command for propagation versus Z3 encoding.
- Compare the automaton encoding with integer start-position and BitVec experiments only after measuring WASM support and end-to-end performance.
- Look over all TODO's
- Deploy to Netlify/Vercel
- Write to supervisor
