# Enigma & Bombe

An interactive React and TypeScript cipher workbench. Encipher with Enigma I, inspect each letter's signal path, and use a crib to search for compatible keys with a Bombe-inspired solver.

## Run locally

Requires Node.js 24 or newer.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. Processing happens in the browser. There is no backend, account, or remote message storage. Refreshing clears the current work.

## Try it

- In **Enigma**, select **Play an example**, or enter `AAAAA` with the default settings to get `BDZGO`. Select a letter with the trace slider to inspect its rotor positions and substitutions.
- Set rotor order, rings, starting windows, reflector, and disjoint plug pairs such as `AV BS CG DL`. Selecting an already-installed rotor swaps it with the previous occupant. All positions and rotor orders are displayed left to right.
- Input is normalized to A–Z. Editing input or settings recomputes the entire message from the starting windows. Clearing the message returns to those starting windows. Decipher by entering ciphertext with the same settings.
- In **Bombe**, run the generated weather-message example. Its full 17,576-position sweep finds the AAF candidate with `AV BS CG DL`. Expand the example description to see how it was generated.
- **Send to Bombe** transfers your ciphertext, rings, reflector, rotor order, and up to 40 letters of plaintext as the crib. Starting windows and plug pairs are not supplied to the search. The transferred cable limit is 13; narrow it if known.

## Historical and search scope

Enigma I supports rotors I–V, B/C reflectors, ring settings, plugboard, pre-encipherment stepping, and the middle rotor's double step. There are no naval M4 or commercial Enigma variants in this release.

The Bombe workspace implements modern constraint propagation and backtracking inspired by the British Turing–Welchman Bombe. The separate Drums & wiring lesson models sensing/carry phases and electrical reachability. It is not a calibrated physical replica.

For each starting-window hypothesis, the solver builds the exact rotor sequence, including characters before the crib and turnover inside it. Each menu edge enforces `P(cᵢ) = Sᵢ(P(pᵢ))`, and plugboard assignments must be reciprocal. Disconnected menu components are checked too. Every emitted candidate is replay-verified against the crib.

Search assumptions and limits are explicit:

- Rings and reflector are known. Search the selected rotor order or all 60 orders from I–V.
- The cable setting is a **maximum**, not an exact number. Unknown letters may be left unplugged for a valid completion.
- Return one compatible plugboard witness per rotor setting, not all plugboards. Unresolved letters remain marked unknown; plaintext previews leave them unplugged.
- Stop after 50 candidate settings. This is an incomplete sweep unless all positions were visited.
- Limit backtracking to 20,000 attempted assignments per setting. Budget exhaustion increments the unresolved count; it is never reported as rejection.
- Support up to 500 ciphertext letters and 8–100 crib letters. Crib offsets count normalized letters from zero.
- Search runs in a dedicated Web Worker. Stopping terminates it immediately; displayed counts are from the latest progress update (every 128 positions), and the UI labels the results as partial.

A crib-compatible candidate is not proof of unique key recovery. Weak or incorrect cribs can admit other candidates. See [the research reference](docs/research/enigma-and-bombe.md) for primary sources, equations, and historical distinctions.

## Learning views

- The signal trace explicitly shows the outward plugboard, reflector return, second plugboard pass, and separate lamp.
- Expand the “?” terms for context. Help uses native disclosures that work with a keyboard and touch; essential field instructions remain visible.
- **Crib & search:** slide the crib strip and see self-encryption conflicts. Switch the menu to **Historical notation** for a wiring schedule or the supplied museum diagram; repeated G–R lines at positions 6 and 12 are preserved. Put that supplied menu on the drums without altering the current search.
- **Drums & wiring:** run, pause, or step a 39-point drive; 26 sensing points alternate with 13 unsensed carry points. Inspect each three-drum scrambler, actual rotor permutations, indicator-register wires, and the reciprocal diagonal board. Top is the Enigma-left equivalent, even though it moves fastest during the Bombe search.
- Drum letters are normalized wiring-core coordinates at ring A, not actual drum engravings or the exact search's settings. The model keeps relative bottom-drum offsets and assumes no middle turnover inside the menu. It does not model calibrated direction, gear geometry, continuous carry motion, or braking. Menus larger than 12 edges are paged as teaching subsets, not extra historical chains; the electrical verdict applies to the displayed subset.
- **Paper methods:** slide two synthetic, editable punched ciphertext strips and count coincident holes. This demonstrates the comparison step of Banbury sheets, not full Banburismus scoring or decryption. Zygalski sheets are described as a different possible exhibit; we cannot identify the remembered display with certainty.

See [the historical-interface research](docs/research/historical-bombe-interfaces.md) for primary sources and modelling boundaries.

## Verify

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm format:check
npx playwright install chromium
pnpm test:browser
```

`pnpm typecheck` checks application source, engine tests, browser tests, and Playwright configuration with strict TypeScript settings. It also compiles the cipher, menu, solver, historical calculations, and exercise preparation without browser or Node globals (`tsconfig.engine.json`). Worker and session adapters remain in the browser compilation.

The engine tests cover independent Enigma fixtures, double stepping, non-A rings, plug validation, reciprocity, crib offsets, solver budget handling, and agreement with exhaustive toy-alphabet plugboards. Browser tests exercise both desktop and mobile: encoding, trace inspection, validation, message transfer, full demo search, cancellation, and horizontal overflow.

## Structure

- `src/engine/enigma.ts`: framework-independent rotor machine and per-key traces.
- `src/engine/crib-menu.ts`: crib placement, self-encryption conflicts, and menu construction shared by search and learning views.
- `src/engine/bombe.ts`: plugboard propagation and search generator; retains the original menu exports for existing callers.
- `src/engine/bombe-session.ts`: worker lifecycle, progress, cancellation, elapsed time, and rejection of late events.
- `src/engine/bombe.worker.ts`: worker message boundary.
- `src/workbench/search-exercise.ts`: transfer contract and demo preparation; preserves known assumptions while withholding starting windows and plug pairs.
- `src/components/useBombeSearch.ts`: owns search inputs and invalidates old results whenever assumptions change. Raw field setters and the session stay private.
- `src/components/BombeResults.tsx`: displays a search snapshot and candidate selection without controlling the worker.
- `src/components/`: controls, workspaces, learning views, and field guide. The Bombe workspace owns lesson navigation independently of the search session.
- `src/styles.css`: responsive visual system, with locally bundled fonts.
- `tests/`: engine tests and Playwright browser scenarios.

Create a static production bundle with `pnpm build`, then serve `dist/` using any static host. `pnpm preview` serves the bundle locally for verification.

The [historical accuracy audit](docs/research/historical-accuracy-audit.md) records the source review, feature-by-feature verification, independent reflector-C fixtures, resolved findings, and the remaining teaching simplifications.
