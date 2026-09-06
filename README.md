# Enigma & Bombe

A React and TypeScript workbench for Enigma I encryption and Bombe-inspired codebreaking. Inspect each keypress, test a suspected plaintext fragment against ciphertext, and explore drum wiring and paper methods.

Everything runs in the browser. There is no backend, account, or remote message storage. Refreshing clears the current work.

## Run locally

Requires Node.js 24 or newer and pnpm (the version is pinned in `package.json`).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. To preview a production build:

```sh
pnpm build
pnpm preview
```

## Try it

- **Enigma:** enter `AAAAA` with the default settings to get `BDZGO`. Enter `BDZGO` with the same starting settings to recover `AAAAA`. Use the slider to inspect each letter's signal path and rotor stepping.
- **Bombe:** run the generated weather-message example. The full 17,576-position sweep finds starting windows `AAF` with plug pairs `AV BS CG DL`.
- **Send to Bombe:** transfer your ciphertext and up to 40 plaintext letters as a crib. Rotor order, rings, and reflector are retained; starting windows and plug pairs are withheld from the search.
- **Learning views:** explore crib alignment, historical menu notation, the supplied museum menu, drum sensing and carry phases, and punched-strip coincidences.

## Scope and limits

Enigma I supports rotors I–V, reflectors B/C, ring settings, plugboard pairs, and double stepping. Input is normalized to A–Z. Editing a message or its settings replays it from the starting windows.

The Bombe search uses modern constraint propagation and backtracking with exact Enigma stepping. Every candidate is replay-checked against the crib. A match establishes compatibility with the crib; it does not prove unique recovery of the original key.

- Rings and reflector are assumed known. Search one rotor order or all 60.
- Accept up to 500 ciphertext letters and 1–100 crib letters. Short cribs usually produce many candidates. Offsets count normalized letters from zero.
- Cable counts are upper bounds. Each candidate supplies one compatible plugboard; unconstrained letters remain unknown and are left unplugged in the preview.
- Stop after 50 candidates. Each setting has a 20,000-branch budget; exhausted settings are reported as unresolved.
- Search runs in a Web Worker. Stopping retains partial results from the latest progress update; changing assumptions clears them.

The historical views are teaching models. Drums use normalized wiring-core coordinates, a discrete 39-point sensing/carry cycle, and subsets of up to 12 menu connections. Paper methods demonstrate coincidences rather than full Banburismus scoring.

Sources and modelling details:

- [Enigma and Bombe research](docs/research/enigma-and-bombe.md)
- [Historical interfaces and limitations](docs/research/historical-bombe-interfaces.md)
- [Historical accuracy audit](docs/research/historical-accuracy-audit.md)

## Verify

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
```

Tests cover independent cipher fixtures, stepping, crib validation, solver consistency, session cleanup, transfers, and desktop/mobile interactions. Typechecks also compile the computational modules without browser or Node globals (`tsconfig.engine.json`).

## Deployment

[GitHub Actions](.github/workflows/ci.yml) runs checks, tests, and a production build on pull requests and branch pushes. Only a successful **push to the default branch** deploys to GitHub Pages. Failed browser tests retain diagnostics for seven days.

Pages uses **GitHub Actions** as its publishing source. CI builds `dist/` with `pnpm build --base=./`. Vite's [relative base](https://vite.dev/guide/build.html#relative-base) lets the same build work at the repository URL and at a custom domain root. Switching to `base: "/"` is unnecessary and would make asset URLs point outside the repository path before the domain move.

To connect a domain later, set **Settings → Pages → Custom domain** and configure the domain's DNS using [GitHub's instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). No build change is needed. The deployment job reports the published URL.

## Code layout

- `src/engine/`: Enigma, crib/menu rules, the solver, historical calculations, and worker/session adapters.
- `src/workbench/`: demo and transfer preparation, preserving known assumptions while withholding the searched key.
- `src/components/`: workspaces, controls, and learning views. `useBombeSearch` owns search edits and result invalidation; `BombeResults` renders progress and candidates.
- `tests/`: engine and workbench tests, plus Playwright browser scenarios.
