---
name: Enigma & Bombe
description: A browser workbench for inspecting historical cipher mechanisms.
colors:
  ink: '#2d2c25'
  muted: '#625e50'
  paper: '#eee7d5'
  line: '#b6ad96'
  green: '#484b35'
  amber: '#dfb664'
  field: '#f7f1e3'
  output: '#e7dfc9'
  instrument-text: '#efe8d6'
  machine: '#292b25'
  rotor-recess: '#191b17'
  action-text: '#f7f1e3'
  action-hover: '#2d2c25'
  error: '#9b352a'
  error-surface: '#fbeae2'
typography:
  display:
    fontFamily: 'Oswald, sans-serif'
    fontSize: 'clamp(40.8px, 4.2vw, 55.2px)'
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  intro-description:
    fontFamily: 'IBM Plex Sans, sans-serif'
    fontSize: '16.8px'
    fontWeight: 400
    lineHeight: 1.6
  title:
    fontFamily: 'Oswald, sans-serif'
    fontSize: '19px'
    fontWeight: 500
    letterSpacing: '0.01em'
  body:
    fontFamily: 'IBM Plex Sans, sans-serif'
    fontSize: '14px'
    lineHeight: 1.6
  label:
    fontFamily: 'IBM Plex Sans, sans-serif'
    fontSize: '12px'
    fontWeight: 500
  tooltip:
    fontFamily: 'IBM Plex Sans, sans-serif'
    fontSize: '13px'
    lineHeight: 1.7
  rotor:
    fontFamily: 'Special Elite, monospace'
    fontSize: '46px'
    fontWeight: 400
    lineHeight: 1
rounded:
  control: '2px'
  field: '1px'
  analysis-panel: '2px'
  instrument: '3px'
  circular: '50%'
components:
  button-primary:
    backgroundColor: '{colors.green}'
    textColor: '{colors.action-text}'
    rounded: '{rounded.control}'
    padding: '12px 18px'
  button-primary-hover:
    backgroundColor: '{colors.action-hover}'
  message-input:
    backgroundColor: '{colors.field}'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    padding: '13px 15px'
    height: '112px'
  message-output:
    backgroundColor: '{colors.output}'
  help-tooltip:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    typography: '{typography.tooltip}'
    rounded: '{rounded.control}'
    padding: '12px 14px'
    width: '320px'
  instrument:
    backgroundColor: '{colors.machine}'
    textColor: '{colors.instrument-text}'
    rounded: '{rounded.instrument}'
    padding: '23px 30px 15px'
---

# Design System: Enigma & Bombe

## Overview

The production workbench offers two user-approved document themes: **Service Manual** and **Intercept Form**. Both retain the original responsive layout, control placement, and simulation behavior. `PRODUCT.md` owns product scope; `src/themes.css` and `src/appearance.css` implement this visual system over the shared component styles.

Service Manual is the default: olive accents, aged paper, condensed headings, and a charcoal instrument. Intercept Form uses warmer paper, oxblood accents, and typewriter headings. Compact sans-serif explanations and amber output lamps keep the machine readable in either appearance.

## Colors

The frontmatter is normative for **Service Manual**. `green` is the existing CSS name for the theme accent: it colors primary actions, active navigation, and selected controls. `machine` is the independent dark instrument surface. `paper`, `field`, and `output` distinguish the page, editable message, and generated message. `ink`, `muted`, and `line` establish hierarchy. Errors pair color with written explanations.

Intercept Form overrides `paper` to `#f0e4c9`, `field` to `#faf2df`, `green` to `#7c352a`, and `line` to `#b4a084`. Other palette values inherit. Theme-dependent components consume CSS custom properties; retain the shared, labeled signal-stage colors and amber lamp state. Text selection uses the current accent with field-colored text. Local CSS colors are not a named global ramp.

## Typography

Oswald 500 provides the Service Manual brand, uppercase navigation, and headings. Intercept Form changes the brand, page heading, and h2 headings to Special Elite; its brand and page heading retain normal case. Both themes use a `clamp(40.8px, 4.2vw, 55.2px)` page title with 1.15 line height. Navigation and h3 headings retain Oswald.

IBM Plex Sans 400/500/600 supports controls and prose in both themes. Special Elite 400 supplies rotor letters, message text, and the large trace summary; other machine settings and candidates use the system monospace stack. Fonts are self-hosted through Fontsource imports.

The frontmatter records role-specific sizes, not a uniform type scale. Page-intro prose is 16.8px and guide prose is 14px, both with 1.6 line height; dense controls and supporting descriptions range from 10–13px. Guide headings are 29px and follow the theme heading family. Rotor letters are 46px; the trace summary is 59px. Message text is 16px. Changing progress and machine values retain tabular numerals.

## Layout

The page intro uses exactly two typographic roles: Enigma I, Bombe, or Field guide as the h1, followed by one useful sentence in 16.8px IBM Plex Sans at 1.6 line height. It has 28px vertical padding, 12px between title and description, and a 72ch description measure. Former slogans and purpose labels are removed. The footer retains the brand and About action without a slogan.

The main container and footer have a 1440px maximum width and 48px horizontal padding. The header has a 1600px maximum width. Desktop Enigma uses a flexible machine column plus a 306px trace column with a 30px gap. The trace has a left divider. Message fields remain two equal columns, including mobile. Bombe uses a 355px input column and flexible analysis column, separated by 36px. Configuration keeps three equal rotor columns.

Spacing is component-specific: common panel padding is 23–30px, message-column spacing is 18px, and major sections use divider rules with roughly 22–28px vertical padding. The implementation has no named spacing scale.

| Breakpoint | Implemented changes                                                                                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥1450px    | Trace column 320px, workbench gap 42px; instrument horizontal padding 40px.                                                                                                                                                                                                                              |
| ≤1100px    | Page/header horizontal padding 28px; trace 255px with 22px gap; auxiliary header note, intro tag, and Appearance trigger text hidden; narrower controls. Bombe input column 310px.                                                                                                                                                 |
| ≤850px     | Enigma and Bombe workbench columns stack. Trace moves below a top divider and uses a five-column stage grid. Bombe input sections sit side by side.                                                                                                                                                      |
| ≤600px     | Page padding 18px; Page titles use the 40.8px minimum in both themes; Appearance stays beside the brand. Instrument padding 18px 16px 14px. Rotor settings stack within each rotor. Keyboard retains its rows with proportional circular keys. Plugboard sockets use 13 columns, and its form stacks. Bombe inputs and guide columns stack. |

At ≤700px the header uses two rows, with navigation below the brand and Appearance trigger. At ≤360px the brand reduces to 22px.

On mobile, rotor selectors fill the width below their labels. Historical diagrams retain a 540px minimum width inside a named, keyboard-focusable horizontal overflow region. The drum bank also scrolls horizontally on narrow screens. Learning-panel introductory prose is limited to 72ch.

Alignment strips and candidate tabs scroll horizontally when needed. Long ciphertext wraps inside fields; textareas resize vertically.

At narrow tablet widths, keyboard gaps shrink to keep all nine keys in the longest row inside the instrument.

## Elevation & Depth

Most sections are flat, separated by borders and changes in surface color. The machine uses `0 8px 20px #292b251c`; keys use `0 3px 5px #0005`. Rotor windows are recessed. Help popups retain `0 4px 20px #112c2533`, while the Appearance popup uses `0 6px 24px #292b2533`. Full shadow and motion details live in `.impeccable/design.json`.

## Shapes

Document surfaces are nearly square: fields and selects use 1px corners, primary actions and analysis panels 2px, and the instrument and Appearance popup 3px. Page titles have a plain-language supporting description; validation badges use 2px. Circular keys, trace letters, and the rotor emblem retain the instrument's mechanical geometry. Most dividers are 1px; the header rule is 2px.

## Components

- **Primary actions:** theme-accent fill, field-colored text, 12px type, 12px 18px padding, and ink-colored hover. Search uses a full-width action with 14px padding. Cancel uses a brown fill.
- **Text actions:** transparent, compact, with optional inline icons; hover changes text to warm brown. Disabled buttons use opacity 0.45 and a not-allowed cursor.
- **Navigation:** uppercase Oswald buttons with an accent-filled active state and field-colored active text. Hover adds a pale paper surface. Mobile retains all three destinations on a second header row.
- **Message fields:** Special Elite text, theme borders, 1px corners; input uses the theme field surface and output a darker paper tone. Plugboard and intercept fields use the same restrained form language. Validation appears beside the relevant work area.
- **Instrument:** three recessed rotor windows above circular keyboard rows. The pressed input has an inset treatment; the output key lights amber. Settings use native selects with visible labels.
- **Trace:** a large input/output pair, letter scrubber, labeled stages, and stepping explanation. Forward stages are green, reflection amber, and return stages warm neutral. The empty state explains how to start.
- **Bombe analysis:** the constraint equation uses a vertical stack with 20px padding, an 18px equation, a 12px position label 4px below, and a 13px explanation 12px below at 1.6 line height. This spacing stays readable on mobile. The analysis includes bordered menu and result panels, labeled validation state, selectable alignment cells, progress, and candidate tabs. Selected graph nodes use the theme accent; selected edges are warm ochre. Candidates remain described as possible settings.

- **Appearance:** a header button opens a Base UI Popover with exactly two labeled native radio choices, Service Manual and Intercept Form. Selection updates the whole workbench immediately and saves to `localStorage` under `enigma-bombe-theme`; missing, invalid, or inaccessible storage falls back to Service Manual. The trigger has a 44px minimum target; below 1100px its icon retains the accessible name. The popup aligns to the trigger end with an 8px gap and 12px collision padding, a 310px width capped by the viewport, a title, and a short description. Base UI manages dismissal and focus.
- **Contextual help:** Configuration help uses a compact left-aligned row when its panel is at least 600px wide, and a two-by-two grid otherwise. It has 4px row gaps, 24px column gaps, and 12px top spacing. Its 12px buttons have no outer margins and keep 44px minimum height at every width. The shared Base UI tooltip uses a labeled question-mark SVG button. Hover opens it after 350ms; keyboard focus and click/tap also open it. Adjacent tooltips share the provider timing, with a 100ms closing delay. The explanation remains open while hovered and dismisses with Escape, focus departure, or outside press. A visible popup has `role="tooltip"` and is linked to its trigger with `aria-describedby`. The portaled popup floats above the workbench without changing layout, prefers top/start placement with an 8px gap, and adjusts around viewport edges with 12px collision padding. Its width is capped by the tooltip token and available viewport width; constrained height scrolls. Triggers are at least 36px high, increasing to 44px at the mobile breakpoint. The trigger uses the theme accent on paper and pale text on the instrument. Persistent field hints remain beside fields.
- **Learning activities:** Bombe activity controls switch between Crib & search, Drums & wiring, and Paper methods. Historical menu notation links to the drum view. The drum cabinet uses a dark instrument surface, rotor-type colors, and normalized core letters. The paper activity uses ochre sheet stock, two outline colors for covered holes, and white for open intersections. Selection controls retain generous hit areas. Original drum calibration and full Banburismus inference are not implied by the visuals.

All buttons, links, fields, selects, and disclosure summaries share a 3px `#b9802c` focus outline with 4px offset. Button color transitions last 0.16s. The lit-key glow lasts 0.32s. The reduced-motion media query removes CSS animation and transitions; explicit JavaScript scroll behavior is separate from this CSS rule.

## Do's and Don'ts

- **Do** extend both document themes through their shared tokens and preserve the original workbench layout and distinct signal states.
- **Do** use monospaced type for machine values and readable prose for explanations.
- **Do** preserve visible labels, focus outlines, validation text, and candidate uncertainty.
- **Do** check the dense keyboard and configuration at mobile widths.
- **Don't** imply that a matching candidate is a uniquely recovered key or that this is a physically faithful British Bombe.
- **Don't** reintroduce discarded prototype themes or prototype controls into the production Appearance menu.
