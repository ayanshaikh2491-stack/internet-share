---
version: alpha
name: Internet Share
description: Among Us inspired dark gaming design for a peer-to-peer internet sharing relay. Spaceship crew lobby aesthetic with neon purple/cyan accents on deep void canvas.
colors:
  primary: "#7c3aed"
  primary-hover: "#8b5cf6"
  secondary-pink: "#ec4899"
  secondary-pink-hover: "#f472b6"
  accent-cyan: "#06b6d4"
  accent-green: "#10b981"
  accent-red: "#ef4444"
  accent-amber: "#f59e0b"
  canvas: "#0f0f12"
  canvas-elevated: "#18181b"
  surface: "#1c1c1f"
  surface-hover: "#222225"
  hairline: "#27272a"
  ink: "#fafafa"
  body: "#a1a1aa"
  muted: "#71717a"
  muted-soft: "#52525b"
  primary-glow: "rgba(124,58,237,0.3)"
  primary-glow-soft: "rgba(124,58,237,0.15)"
  pink-glow: "rgba(236,72,153,0.3)"
  cyan-glow: "rgba(6,182,212,0.3)"
  green-glow: "rgba(16,185,129,0.25)"
  glass-bg: "rgba(24,24,27,0.85)"
typography:
  h1:
    fontFamily: Orbitron
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.04em"
  h2:
    fontFamily: Orbitron
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  h3:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
  body:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body-small:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
    textTransform: uppercase
  code:
    fontFamily: JetBrains Mono
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
  mono-small:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
components:
  status-badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    rounded: "{rounded.full}"
    padding: 8px 12px
    typography: "{typography.body-small}"
  status-badge-lobby:
    backgroundColor: "rgba(124,58,237,0.1)"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 8px 12px
    typography: "{typography.body-small}"
  status-badge-active:
    backgroundColor: "rgba(16,185,129,0.08)"
    textColor: "{colors.accent-green}"
    rounded: "{rounded.full}"
    padding: 8px 12px
    typography: "{typography.body-small}"
  room-code-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: 24px 32px
  room-code-char:
    textColor: "#c4b5fd"
    typography: "{typography.code}"
  qr-container:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
    padding: 12px
  card-home:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: 32px
  card-home-hover:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "rgba(124,58,237,0.3)"
    rounded: "{rounded.xl}"
    padding: 32px
  action-button:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 16px 48px
    typography: "{typography.body-small}"
  action-button-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 16px 48px
    typography: "{typography.body-small}"
  action-button-join:
    backgroundGradient: "linear-gradient(to right, #7c3aed, #ec4899)"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: 16px 32px
    typography: "{typography.body-small}"
  secondary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    typography: "{typography.body-small}"
  secondary-button-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    typography: "{typography.body-small}"
  icon-socket:
    backgroundColor: "rgba(124,58,237,0.08)"
    borderColor: "rgba(124,58,237,0.15)"
    rounded: "{rounded.md}"
    padding: 16px
  icon-socket-pink:
    backgroundColor: "rgba(236,72,153,0.08)"
    borderColor: "rgba(236,72,153,0.15)"
    rounded: "{rounded.md}"
    padding: 16px
  modal-overlay:
    backgroundColor: "rgba(0,0,0,0.6)"
    textColor: "{colors.ink}"
  modal-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: 24px 32px
  input-field:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.hairline}"
    textColor: "{colors.ink}"
    placeholderColor: "{colors.muted-soft}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  input-field-focus:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  cap-badge:
    backgroundColor: "rgba(124,58,237,0.08)"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
    typography: "{typography.body-small}"
  cap-badge-cyan:
    backgroundColor: "rgba(6,182,212,0.08)"
    textColor: "{colors.accent-cyan}"
    rounded: "{rounded.full}"
    padding: 4px 12px
    typography: "{typography.body-small}"
  cap-badge-amber:
    backgroundColor: "rgba(245,158,11,0.08)"
    textColor: "{colors.accent-amber}"
    rounded: "{rounded.full}"
    padding: 4px 12px
    typography: "{typography.body-small}"
  stats-card:
    backgroundColor: "{colors.canvas-elevated}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
    padding: 16px
  progress-bar:
    backgroundColor: "{colors.hairline}"
    fillColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: 6px
  progress-bar-warn:
    backgroundColor: "{colors.hairline}"
    fillColor: "{colors.accent-amber}"
    rounded: "{rounded.full}"
    height: 6px
---

## Overview

Internet Share is a peer-to-peer internet relay app with an Among Us inspired dark gaming aesthetic. The design evokes a spaceship crew lobby — players create rooms, share codes, and connect in a dark immersive environment with neon glowing controls. The UI feels like a holographic control panel aboard a cyberpunk vessel.

## Colors

- **Canvas (`#0f0f12`):** The void — deepest background with a slight warmth to avoid pure black crush.
- **Primary (`#7c3aed`):** Purple — main accent for actions, share mode, room codes. Glows on interactive elements.
- **Secondary Pink (`#ec4899`):** Used for join/receive mode. Creates visual distinction between share and join flows.
- **Accent Cyan (`#06b6d4`):** Informational — progress bars, time limits, status dots.
- **Accent Green (`#10b981`):** Connected/success states — active badges, success indicators.
- **Ink (`#fafafa`):** Primary text — near-white for maximum contrast on dark canvas.
- **Body (`#a1a1aa`):** Secondary text — warm gray that's readable but doesn't compete with ink.
- **Hairline (`#27272a`):** Borders and dividers — surfaces are separated by subtle lines rather than shadows.

### Glass & Glow Effects

Surfaces use `border: 1px solid {hairline}` instead of box-shadows. Interactive elements (buttons, room codes, focused inputs) get colored glow effects via `box-shadow` for a neon holographic feel.

## Typography

Three fonts serve distinct roles:
- **Orbitron** — Headings only. Uppercase, wide tracking, sci-fi authority. Used for "ShareNet" logo and section titles.
- **Inter** — Everything else. Primary body text, labels, buttons, stats. Tight `-0.01em` letter-spacing for density.
- **JetBrains Mono** — Room codes, timers, data numbers. Any "data/code" adjacent text uses this monospace.

### Hierarchy

| Level | Font | Size | Weight | Tracking | Usage |
|-------|------|------|--------|----------|-------|
| Hero/Logo | Orbitron | 48px | 700 | `0.04em` | "ShareNet" title |
| Section H2 | Orbitron | 24px | 600 | `0.02em` | "Share", "Join" headings |
| Card H3 | Inter | 18px | 600 | 0 | Card titles |
| Body | Inter | 14px | 400 | `-0.01em` | Descriptions, instructions |
| Small/Label | Inter | 12px | 500 uppercase | `0.02em` | Badges, labels, button text |
| Code | JetBrains Mono | 36px | 700 | `0.08em` | Room code characters |
| Mono Small | JetBrains Mono | 12px | 500 | 0 | Data values, timers |

## Layout & Spacing

- **Base unit:** 4px
- **Column grid:** Single column on mobile (<640px), two columns on sm+ (640px+) for the home screen cards.
- **Max content width:** `max-w-lg` (512px) for forms, `max-w-sm` (384px) for modals
- **Center alignment:** Everything is center-aligned (text and layout). Full height `min-h-screen` with flex centering.
- **Fixed header:** Status badge positioned `top-4 right-4` fixed
- **Back button:** Positioned `top-6 left-6` absolute within each screen

### Gap usage
- `gap-3` (12px) — between related elements (icon + label, buttons in a row)
- `gap-4` (16px) — between cards, sections
- `gap-5` (20px) — between major blocks
- `space-y-4/5` — vertical stacking within cards

## Elevation & Depth

All surfaces use the `1px` hairline border to create separation. No shadows on non-interactive elements. Interactive elements get colored box-shadows:

- **Purple glow:** `0 0 25px rgba(124,58,237,0.25)` — buttons
- **Purple soft glow:** `0 0 20px rgba(124,58,237,0.15)` — input focus
- **Purple subtle:** `0 0 30px rgba(124,58,237,0.1)` — card hover

Background depth comes from two large blurred circles (`blur(120px)`) positioned off-screen: purple to the top-right, cyan to the bottom-left. This creates an ambient cockpit glow without distracting from content.

## Shapes

- **Rounded `24px` (xl):** Room code cards, modals, home screen cards
- **Rounded `12px` (md):** Action buttons, secondary buttons, stats cards
- **Rounded `8px` (sm):** Input fields, icon containers
- **Rounded `9999px` (full):** Status badges, pill tags, progress bars

## Components

### Status Badge
Fixed position `top-4 right-4`. Four states:
1. **OF** **FLINE** — gray bg, muted text, gray dot
2. **CONNECTING** — gray bg, body text, cyan animated pulse dot
3. **LOBBY** — purple translucent bg, purple text, static purple dot
4. **ACTIVE** — green translucent bg, green text, animated green pulse dot

### Room Code Card
Large centered container showing 4-character code. Each character independently rendered in JetBrains Mono 36px bold with purple glow text-shadow. Characters animate in with staggered `slideUp` effect (80ms delay per char). Container has glassmorphism look with border and subtle glow.

### Home Screen Cards
Two large clickable cards. Share card gets purple icon container, Join card gets pink icon container. On hover, a gradient overlay fades in from the left with the respective accent color at 5% opacity. Cards get elevated border color on hover (purple for share, pink for join).

### Room Settings Modal
Overlay with blur backdrop. Expandable sections each controlled by a checkbox:
- **Password protect:** Checkbox + conditional text input
- **Data limit:** Checkbox + conditional number input with "MB" suffix
- **Time limit:** Checkbox + conditional number input with "minutes" suffix
Bottom row: Cancel (secondary) + Create Room (primary) buttons.

### Stats Panel
During active connection, shows:
- **Data transferred:** MB value with optional max. Progress bar (purple, 6px height)
- **Session duration:** MM:SS format with optional max. Progress bar (cyan, 6px height)
When either approaches 80%+, color shifts to amber with warning indicator.

## Do's and Don'ts

**Do:**
- Keep the deep void background (`#0f0f12`) — it's the brand's most defining visual element
- Use Orbitron for ALL headings, never Inter — it maintains the gaming identity
- Separate modes visually: purple = share/host, pink = join/receive
- Use the hairline border system for surface separation — no box-shadows on static elements
- Animate room code characters on appearance — it signals "ready" to the user
- Keep all text center-aligned — asymmetrical layouts break the cockpit panel illusion

**Don't:**
- Don't mix purple and pink on the same element — each mode has its own accent
- Never use borders thicker than 1px — the thin hairline is intentional
- Don't add shadow to non-interactive elements — use borders to create hierarchy
- Don't overuse glow — only on: buttons (hover), room codes, input focus, and the two ambient background blobs
- Avoid light mode — the entire brand is built on the dark canvas
