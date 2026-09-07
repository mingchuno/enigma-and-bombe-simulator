# CSS Modules migration prototype

Branch: `codex/css-modules-prototype`.

The migration preserves the Service Manual and Intercept Form workbenches while
moving component selectors out of global CSS. Vite's existing CSS Modules support
handles the imports; no dependency or runtime styling library was added.

## Ownership

- `src/styles.css` contains base elements, typography, focus, selection,
  scrollbars, and reduced-motion rules. Import it before the app so the cascade
  layer order is established before any component styles load.
- `src/themes.css` contains semantic tokens and the `data-theme="intercept"`
  overrides. `theme.ts` still applies the saved preference before React mounts.
- `src/App.module.css` owns the header, navigation, page intro, main, and footer.
- Each styled component owns its colocated module. `Icon` and `ScrollRegion`
  require no stylesheet of their own; the latter accepts the caller's scoped class.
- `src/components/Workbench.module.css` owns shared actions, section headings,
  help rows, learning panels, and supporting text. Modules use CSS Modules
  `@value` imports to share those class exports without making selectors global.

The cascade order is `tokens`, `base`, `shared`, `components`, `theme`. The final
layer retains the existing document appearance overrides, scoped to their owning
modules. This preserves the old cascade while making component imports independent
of each other's load order. `:global()` is limited to the document root and semantic
ancestor attributes; component class names remain local.

## Presentation and state

React imports `styles` and refers to camelCase exports. Signal stages, drum rotor
types, drive phases, contact direction, and energized terminals expose semantic
`data-*` attributes. CSS controls their visual differences. The paper diagram
passes its geometry through `--sheet-width`; its module sets the rendered minimum
size. Static SVG geometry remains in React.

Viewport queries retain the existing page breakpoints. Configuration help uses a
named inline-size container query, so its columns follow available component
space. Native nesting groups control and instrument states; logical spacing
properties and the existing `clamp()` sizing remain in CSS. No JavaScript viewport
checks were introduced. `:has()` was not needed for the existing layouts or states.

Tokens name text, paper, field, accent, borders, errors, instrument surfaces,
spacing, radii, and font roles. Component-local signal and instrument colors retain
their existing meanings rather than changing with the document accent.

## Validation

The migration was compared with screenshots captured before editing: both themes,
six workspaces, and widths of 1440, 850, 601, and 393 pixels. All 48 comparisons
were pixel-identical. The engine/session suite passed 40 tests; the full browser
suite passed 47 tests with 3 platform-specific skips. Build, typecheck, lint, and
changed-code formatting passed. Browser tests use stable
UI hooks or accessible roles instead of global CSS class names. An added regression
checks mobile brand typography, search action size, and heading fonts in both themes.

Run `pnpm dev` to review, `pnpm build` for the production bundle, `pnpm test` for
engine/session tests, and `pnpm test:browser` for desktop/mobile interactions and
PWA behavior. `pnpm typecheck` and `pnpm lint` check the implementation.

The build currently emits a Vite/PostCSS source-metadata warning when processing
CSS Module imports. It completes successfully; the modules contain no asset URLs.
Repository-wide `pnpm format:check` also includes ignored Impeccable live-session
JSON files with pre-existing formatting issues. Formatting checks for `src` and
`tests/browser` pass; those unrelated session files were left untouched.
