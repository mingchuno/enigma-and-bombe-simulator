# Architecture review — 6 September 2026

The application is a browser-only simulator deployed as a static PWA. The review traced Enigma message replay and transfer, Bombe draft edits through worker execution and cancellation, and historical drum calculations. It also inspected engine tests, browser scenarios, typecheck boundaries, and deployment configuration.

## Findings and changes

The existing dependency direction is sound: React views use workbench preparation and computational modules; the cipher and search algorithms have no browser dependency. `BombeSearchSession` already owns worker retirement, elapsed time, and stale-event suppression. Those boundaries do not need replacement.

`bombe.ts` mixed constraint propagation and recursive backtracking with message validation, key enumeration, replay verification, and progress publication. The solver is now in `plugboard-solver.ts`, which owns its branch budget and match/reject/unresolved outcomes. Search preparation and candidate replay verification are private functions in `bombe.ts`. A maintainer can change solver heuristics without navigating generator progress handling, or change search reporting without editing propagation logic.

The existing `bombe.ts` exports remain available. The extraction adds one module and no framework, interface layer, or dependency. Solver traversal is unchanged; in particular, trying self-pairing first still controls which witness plugboard is returned. The existing exhaustive toy-plugboard tests exercise this solver through the compatible entry point.

Browser verification also exposed a stale assertion: the signal trace test searched for removed `.signal-node` elements. It now finds plugboard row headers in the outward and return tables by accessible names, preserving the original behavioral check.

## Protected contracts

- Exact Enigma stepping, including nonzero rings and stepping before the crib.
- Rotor-order enumeration and ascending AAA–ZZZ windows within each order.
- Existing validation order and error text, before any progress is yielded.
- The default 20,000-branch budget and distinction between rejection and unresolved work.
- Replay verification before publishing each candidate.
- Progress every 128 tested settings, independent candidate-list snapshots, and distinct complete/limit outcomes.
- Worker messages, cancellation behavior, partial results, and transfer assumptions.

## Verification and operation

New characterization tests cover a complete 17,576-setting sweep, ordered candidates, replay correctness, stable prior progress, and invalid search assumptions. The progress test was checked against an intentional shared-array mutation and failed as expected. Existing session tests cover worker startup, dispatch, runtime and decoding failures, cancellation, restart, and late events.

The engine-only TypeScript configuration follows the new solver import and compiles it without browser or Node globals. Production browser tests cover the real worker bundle, search completion, cancellation, candidate limits, and offline reload. No storage, deployment protocol, telemetry, or runtime dependency changes are required. Reverting the source changes and rebuilding restores the previous structure; there is no data migration.

## Remaining risks

- `searchBombe` trusts an explicitly supplied `resultLimit`; zero, negative, fractional, or NaN values have no validation contract. The UI uses the fixed default. Defining rejected values would be a behavior change, so this refactor preserves the current API.
- `scramblerEdges` accepts a caller-owned cache keyed only by windows. Reusing it across different rotor/ring/reflector configurations can produce incorrect mappings. The search correctly creates a cache for each order with fixed rings and reflector; external callers must respect that scope.
- `DrumMechanics` combines drive interaction, circuit controls, and substantial explanatory markup. Its length alone does not justify component extraction. Future changes to those interactions should separate coherent responsibilities under the existing browser tests.
- The repository-wide formatter scans ignored `.impeccable/live` runtime metadata and reports formatting failures there. Tracked source formatting can pass while this local command fails; generated metadata should be excluded from a future tooling cleanup.

This review does not establish historical completeness or new performance guarantees. Historical teaching-model limits and search resource bounds remain as documented in the README.
