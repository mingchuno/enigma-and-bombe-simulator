---
name: Enigma & Bombe
description: A browser workbench for inspecting historical cipher mechanisms.
colors:
  ink: '#24382f'
  muted: '#647168'
  paper: '#f5f3ed'
  line: '#d9dcd2'
  green: '#183b32'
  amber: '#e9bc6b'
  field: '#fcfbf7'
  output: '#eaf0e3'
  instrument-text: '#e5eada'
  rotor-recess: '#112c25'
  action-text: '#f3f2e7'
  action-hover: '#2b5342'
  error: '#9b352a'
  error-surface: '#fbeae2'
typography:
  display:
    fontFamily: 'Newsreader, Georgia, serif'
    fontSize: 'clamp(32px, 3.4vw, 48px)'
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: '-0.035em'
  title:
    fontFamily: 'IBM Plex Sans, sans-serif'
    fontSize: '19px'
    fontWeight: 500
    letterSpacing: '-0.025em'
  body:
    fontFamily: 'IBM Plex Sans, sans-serif'
    fontSize: '14px'
    lineHeight: 1.6
  label:
    fontFamily: 'IBM Plex Sans, sans-serif'
    fontSize: '12px'
    fontWeight: 500
  rotor:
    fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, monospace'
    fontSize: '46px'
    fontWeight: 400
    lineHeight: 1
rounded:
  control: '6px'
  field: '8px'
  analysis-panel: '12px'
  instrument: '16px'
  pill: '30px'
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
  instrument:
    backgroundColor: '{colors.green}'
    textColor: '{colors.instrument-text}'
    rounded: '{rounded.instrument}'
    padding: '23px 30px 15px'
---

# Design System: Enigma & Bombe

## Overview

This records the implemented interface, extracted from `src/styles.css`, `src/main.tsx`, and `src/components/`. It is a description of the current system, not a claim of user-approved branding. `PRODUCT.md` owns product scope and principles.

A cream editorial shell surrounds a pine green Enigma instrument. Newsreader introduces the workbench; compact sans-serif controls and monospaced machine values support inspection. Amber identifies the illuminated output and the returning signal. Bombe analysis uses lighter bordered surfaces within the same shell.

## Colors

The frontmatter preserves the implemented color values. `green` anchors the instrument, primary actions, and active navigation. `amber` marks a lit key; related warm tones distinguish reflection and return stages. `paper`, `field`, and `output` distinguish the page, editable message, and generated message. `ink` and `muted` establish text hierarchy; `line` divides sections. Errors use `error` on `error-surface`, with a written explanation.

Additional local colors remain in the stylesheet rather than forming an invented tonal scale. Signal stages use both labels and color. Selection uses amber with green text.

## Typography

Newsreader regular and italic 400 and IBM Plex Sans 400/500/600 are self-hosted through Fontsource imports. The system monospace stack is used for letters, rotor settings, ciphertext, and search candidates.

The page heading uses the display token; section headings use the title token. Introductory and guide prose is 14px with 1.6 line height. Dense controls and supporting descriptions range from 10–13px. Guide headings use Newsreader 29px/400. Rotor letters are 46px; neighboring letters are smaller and muted. The trace summary uses Newsreader at 59px. These are role-specific values, not a uniform type scale.

## Layout

The main container and footer have a 1440px maximum width and 48px horizontal padding. The header has a 1600px maximum width. Desktop Enigma uses a flexible machine column plus a 306px trace column with a 30px gap. The trace has a left divider. Message fields remain two equal columns, including mobile. Bombe uses a 355px input column and flexible analysis column, separated by 36px. Configuration keeps three equal rotor columns.

Spacing is component-specific: common panel padding is 23–30px, message-column spacing is 18px, and major sections use divider rules with roughly 22–28px vertical padding. The implementation has no named spacing scale.

| Breakpoint | Implemented changes                                                                                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥1450px    | Trace column 320px, workbench gap 42px; instrument horizontal padding 40px.                                                                                                                                                                                                                              |
| ≤1100px    | Page/header horizontal padding 28px; trace 255px with 22px gap; auxiliary header note and intro tag hidden; narrower controls. Bombe input column 310px.                                                                                                                                                 |
| ≤850px     | Enigma and Bombe workbench columns stack. Trace moves below a top divider and uses a five-column stage grid. Bombe input sections sit side by side.                                                                                                                                                      |
| ≤600px     | Page padding 18px; navigation wraps below the brand. Heading is 36px. Instrument padding 18px 16px 14px. Rotor settings stack within each rotor. Keyboard retains its rows with proportional circular keys. Plugboard sockets use 13 columns, and its form stacks. Bombe inputs and guide columns stack. |

Alignment strips and candidate tabs scroll horizontally when needed. Long ciphertext wraps inside fields; textareas resize vertically.

## Elevation & Depth

Most sections are flat, separated by fine borders and changes in surface color. The machine has a restrained `0 12px 30px #24382f12` shadow. Keys have `0 3px 5px #091d2540`; the pressed key uses an inset shadow. Dark rotor windows form recessed compartments. Shadow and motion details live in `.impeccable/design.json`.

## Shapes

The instrument uses 16px corners, reduced to 12px on mobile. Analysis panels use 12px, reduced to 10px on mobile. Fields use 6–8px corners; primary actions use 6px. Circular keys, trace letters, and the rotor emblem connect the machine controls visually. Pills identify context and validation. Dividers are generally 1px.

## Components

- **Primary actions:** green fill, pale text, 12px type, 12px 18px padding, and a darker/lighter green hover treatment defined by `action-hover`. Search uses a full-width action with 14px padding. Cancel uses a brown fill.
- **Text actions:** transparent, compact, with optional inline icons; hover changes text to warm brown. Disabled buttons use opacity 0.45 and a not-allowed cursor.
- **Navigation:** text buttons with a 3px green underline and heavier text for the current page. Hover adds a pale surface. Mobile retains all three destinations on a second header row.
- **Message fields:** monospaced text, subtle borders, 8px corners; input is near-white and output pale green. Plugboard and intercept fields use the same restrained form language. Validation appears beside the relevant work area.
- **Instrument:** three recessed rotor windows above circular keyboard rows. The pressed input has an inset treatment; the output key lights amber. Settings use native selects with visible labels.
- **Trace:** a large input/output pair, letter scrubber, labeled stages, and stepping explanation. Forward stages are green, reflection amber, and return stages warm neutral. The empty state explains how to start.
- **Bombe analysis:** bordered menu and result panels, labeled validation state, selectable alignment cells, progress, and candidate tabs. Selected graph nodes are dark green; selected edges are warm ochre. Candidates remain described as possible settings.

All buttons, links, fields, selects, and disclosure summaries share a 3px `#b9802c` focus outline with 4px offset. Button color transitions last 0.16s. The lit-key glow lasts 0.32s. The reduced-motion media query removes CSS animation and transitions; explicit JavaScript scroll behavior is separate from this CSS rule.

## Do's and Don'ts

- **Do** retain the paper shell, dark instrument, and distinct signal-state colors when extending these screens.
- **Do** use monospaced type for machine values and readable prose for explanations.
- **Do** preserve visible labels, focus outlines, validation text, and candidate uncertainty.
- **Do** check the dense keyboard and configuration at mobile widths.
- **Don't** imply that a matching candidate is a uniquely recovered key or that this is a physically faithful British Bombe.
- **Don't** treat local CSS values as an established global scale or add a claimed user-approved aesthetic to this extracted record.
