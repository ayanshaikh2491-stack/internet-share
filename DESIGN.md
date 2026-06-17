# Internet Share — Design System

> **Version:** `1.0.0` | **Name:** `internet-share-design`
> **Style:** Dark gaming / Among Us inspired — neon accents on void canvas

## Brand Overview & Philosophy

A real-time internet sharing app that feels like an Among Us lobby — dark, atmospheric, playful, with glowing accents and a subtle space-station UI vibe. The brand is about connecting people through shared resources, with a low-poly sci-fi aesthetic.

**Core Trinity:** Void (#0f0f12) · Cyber Purple (#7c3aed) · Signal Cyan (#06b6d4)

**Key visual anchors:**
- Dark canvas with radial depth (never flat black)
- Dual neon accent system: Purple (host/admin) / Cyan (connection/activity)
- Glowing card edges via `box-shadow` instead of full borders
- Room codes as oversized display elements with per-character glow
- Low UI density = lobby atmosphere
- Status dots pulse like Among Us heartbeat indicators

---

## Color System

### Brand & Accent

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#7c3aed` | CTAs, host badge, room creation, active states |
| `primary-hover` | `#8b5cf6` | Button hover, link hover |
| `primary-glow` | `rgba(124,58,237,0.3)` | Box-shadow glow on primary elements |
| `accent-cyan` | `#06b6d4` | Connection status, data activity, success |
| `accent-cyan-glow` | `rgba(6,182,212,0.3)` | Cyan glow for active rooms |
| `accent-green` | `#10b981` | Paired/active, success states, health |
| `accent-pink` | `#ec4899` | Receiver/join flow, secondary accent |
| `accent-amber` | `#f59e0b` | Warnings, limits near capacity |
| `accent-red` | `#ef4444` | Errors, disconnection, data cap reached |

### Surface

| Token | Hex | Usage |
|---|---|---|
| `canvas` | `#0f0f12` | Default page floor (void black) |
| `canvas-soft` | `#131316` | Card backgrounds, panels |
| `canvas-elevated` | `#18181b` | Elevated cards, modals |
| `surface-dark` | `#1c1c1f` | Inputs, interactive surfaces |
| `surface-hover` | `#222225` | Hover state for items |
| `hairline` | `#27272a` | 1px subtle borders |
| `hairline-strong` | `#3f3f46` | Active/focus borders |

### Text

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#fafafa` | Headlines, primary text |
| `body-strong` | `#e4e4e7` | Emphasized body |
| `body` | `#a1a1aa` | Default text |
| `muted` | `#71717a` | Secondary text, labels |
| `muted-soft` | `#52525b` | Placeholders, disabled |
| `on-primary` | `#ffffff` | Text on primary purple |
| `on-cyan` | `#000000` | Text on cyan badges |
| `badge-text` | `#a78bfa` | Room code characters glow |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `success` | `#10b981` | Connected, active |
| `warning` | `#f59e0b` | Near limit |
| `error` | `#ef4444` | Error, disconnected |
| `info` | `#06b6d4` | Info badges |

---

## Typography

### Font Stack

- **Display:** `Orbitron` / `Rajdhani` → Futuristic geometric, uppercase for headings
- **Body/UI:** `Inter` / `Segoe UI` → Clean sans for readability
- **Code/Mono:** `JetBrains Mono` / `Fira Code` → Room codes, data stats
- **Fallback:** `system-ui, -apple-system, sans-serif`

### Hierarchy Table

| Token | Size | Weight | Line Ht | Letter Spacing | Case | Use |
|---|---|---|---|---|---|---|
| `display-xl` | 56px | 700 | 1.0 | 2px | Uppercase | Hero headline |
| `display-lg` | 40px | 700 | 1.1 | 1.5px | Uppercase | Section heads |
| `display-md` | 32px | 600 | 1.15 | 1px | Uppercase | Room title |
| `display-sm` | 24px | 600 | 1.2 | 0.5px | Uppercase | Card headings |
| `room-code` | 56px | 700 | 1.0 | 8px | Uppercase | Room code char |
| `room-code-sm` | 40px | 700 | 1.0 | 6px | Uppercase | Small room code |
| `title-lg` | 20px | 600 | 1.3 | 0.25px | Normal | Feature card titles |
| `title-md` | 18px | 600 | 1.4 | 0 | Normal | Section titles |
| `title-sm` | 14px | 500 | 1.4 | 1px | Uppercase | Badge labels |
| `body-lg` | 18px | 400 | 1.55 | 0 | Normal | Lead paragraphs |
| `body-md` | 15px | 400 | 1.5 | 0 | Normal | Default body |
| `body-sm` | 13px | 400 | 1.4 | 0 | Normal | Secondary text |
| `caption` | 12px | 500 | 1.3 | 0.5px | Uppercase | Mini badges |
| `label` | 11px | 600 | 1.2 | 1px | Uppercase | Input labels |
| `code` | 14px | 400 | 1.4 | 0 | Normal | Stats numbers |
| `button-lg` | 16px | 600 | 1.0 | 1px | Uppercase | Primary CTAs |
| `button-md` | 14px | 600 | 1.0 | 0.5px | Uppercase | Secondary CTAs |
| `nav-link` | 13px | 500 | 1.4 | 0.5px | Normal | Nav items |

### Principles

- **Display weights:** Use 700 for maximum impact on headings. Never go below 600.
- **Body weights:** 400 for paragraphs, 500/600 for emphasis only.
- **Uppercase + letter-spacing** is the signature rhythm — use on all display, button, and label text.
- **Do not** uppercase body text — only displays, buttons, labels, badges.
- **Room codes** get maximum weight (700), monospace font, and per-character letter-spacing.
- **Substitutes:** Orbitron → Rajdhani → Jura → Inter (with letter-spacing). Inter → system-ui.

---

## Spacing System

**Base Unit:** 4px

| Token | Pixels | Use |
|---|---|---|
| `spacing.xxs` | 4 | Icon gaps |
| `spacing.xs` | 8 | Tight inner padding |
| `spacing.sm` | 12 | Small card padding |
| `spacing.md` | 16 | Default padding |
| `spacing.lg` | 24 | Card inner padding |
| `spacing.xl` | 32 | Section padding |
| `spacing.xxl` | 48 | Between components |
| `spacing.3xl` | 64 | Between major sections |
| `spacing.4xl` | 80 | Hero section padding |
| `spacing.section` | 96 | Between full-page sections |

**Max content width:** 480px (mobile-first, lobby-style) / 720px (desktop card)

---

## Elevation & Shadow

### Box Shadows

| Token | Value | Use |
|---|---|---|
| `glow-primary` | `0 0 20px rgba(124,58,237,0.25), 0 0 40px rgba(124,58,237,0.1)` | Primary CTA, active room |
| `glow-cyan` | `0 0 20px rgba(6,182,212,0.25), 0 0 40px rgba(6,182,212,0.1)` | Connection active |
| `glow-green` | `0 0 20px rgba(16,185,129,0.25)` | Paired/active |
| `glow-red` | `0 0 15px rgba(239,68,68,0.2)` | Error states |
| `card` | `0 0 0 1px rgba(255,255,255,0.05)` | Default card edge |
| `card-hover` | `0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4)` | Card hover |
| `elevated` | `0 4px 24px rgba(0,0,0,0.5)` | Modals, overlays |

### Philosophy

> "Depth through glow, not drop-shadow."

Cards sit on the void canvas with a hairline glow edge. Hover reveals brighter edge + cloud shadow underneath. The `glow-*` tokens are used sparingly — only for active/pairing states (like Among Us task completion flash).

---

## Border Radius

| Token | Value | Applied To |
|---|---|---|
| `rounded.none` | 0 | No rounded corners |
| `rounded.sm` | 6px | Small badges, inline elements |
| `rounded.md` | 10px | Inputs, buttons, cards |
| `rounded.lg` | 16px | Feature cards, large buttons |
| `rounded.xl` | 24px | Hero cards, modals |
| `rounded.pill` | 9999px | Status badges, connection dots |

---

## Animation & Motion

### Duration Tokens

| Token | Value | Use |
|---|---|---|
| `duration.fast` | 150ms | Hover states, color transitions |
| `duration.normal` | 250ms | UI transitions, panel reveals |
| `duration.slow` | 500ms | Page transitions, status changes |
| `duration.pulse` | 2s | Pulsing glows, connection indicators |

### Easing

| Token | Value | Use |
|---|---|---|
| `ease.default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard UI |
| `ease.emerge` | `cubic-bezier(0, 0.55, 0.45, 1)` | Cards entering, modals |
| `ease.pulse` | `ease-in-out` | Status dots |

### Key Animations

- **Status dot pulsing:** The `bg` color pulses from full to 30% opacity, like a lobby heartbeat
- **Glow reveal:** On paired state, the background glow fades in from 0 → full over 500ms
- **Room code entrance:** Each character slides up with 80ms stagger delay
- **Card hover:** Edge brightness increases + subtle lift over 150ms

---

## Component Patterns

### Buttons

| Variant | BG | Text | Border | Glow | Hover |
|---|---|---|---|---|---|
| Primary | `#7c3aed` | `#ffffff` | None | `glow-primary` | Brighten 10% |
| Secondary | Transparent | `#a1a1aa` | `hairline` | None | `#27272a` bg |
| Ghost | Transparent | `#71717a` | None | None | `#fafafa` text |
| Danger | `#ef4444` | `#ffffff` | None | `glow-red` | Brighten 10% |
| Icon | Transparent | `#71717a` | None | None | `#222225` bg |

All buttons: `button-lg` (16px) or `button-md` (14px), uppercase, `rounded.md` (10px), padding 14px 28px (lg) or 10px 20px (md), transition 150ms.

### Cards

- **Surface:** `canvas-elevated` (#18181b)
- **Border:** 1px `hairline` (#27272a)
- **Radius:** `rounded.lg` (16px)
- **Padding:** `spacing.xl` (32px)
- **Shadow:** `card` by default, `card-hover` on interaction
- **Inner spacing:** `spacing.md` (16px) between elements

### Inputs

- **Surface:** `surface-dark` (#1c1c1f)
- **Border:** 1px `hairline` (#27272a)
- **Focus border:** `primary` (#7c3aed) + `glow-primary`
- **Radius:** `rounded.md` (10px)
- **Padding:** 14px 16px
- **Text:** `body` (#a1a1aa) default, `ink` (#fafafa) filled
- **Placeholder:** `muted-soft` (#52525b)
- **Label:** `label` (11px uppercase, #71717a), 8px gap above input

### Status Badge

- **Radius:** `rounded.pill`
- **Padding:** 6px 14px
- **Text:** `title-sm` (14px, 500, uppercase, 1px spacing)
- **Dot:** 6px circle, left of text, with pulsing animation when active
- **Colors:** Follow semantic palette (success=green, error=red, info=cyan)

### Room Code Display

- **Individual chars:** `room-code` (56px, 700, monospace, 8px letter-spacing)
- **Char background:** `surface-dark` with 12px padding
- **Per-char glow:** `badge-text` color with subtle `glow-primary`
- **Container:** `canvas-elevated` card, centered
- **Entrance animation:** Staggered slide-up, 80ms per char

---

## Layout Structure (Mobile-First)

```
┌─────────────────────────┐
│      [Status Bar]       │   Fixed top/right: connection status + timer
│                         │
│     ┌───────────┐       │
│     │   LOGO     │       │   App icon/brand mark (or "INTERNET SHARE" h1)
│     └───────────┘       │
│                         │
│   ┌─────────────────┐   │   Feature cards in centered column
│   │  SHARE INTERNET  │   │   max-width: 720px, centered
│   │  Create a room   │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │  JOIN A ROOM    │   │
│   │  Enter code     │   │
│   └─────────────────┘   │
│                         │
│      [Footer/Info]      │
└─────────────────────────┘
```

- **Single column**, centered layout
- **Void background** with subtle radial gradient behind hero
- **Responsive:** 100% width on mobile (padding: 16px), centered column max 480px on tablets, 720px on desktop
- **No sidebar**, no header bar — full-screen lobby experience

---

## Dark Mode

This design system IS dark mode. There is no light mode. The canvas `#0f0f12` is the only canvas.

---

## Accessibility

- **Contrast ratio:** All text/color combinations meet WCAG AA (4.5:1) minimum
- **Focus states:** `glow-primary` ring on focusable elements
- **Font sizes:** Minimum 14px for UI elements (except labels at 11px, rare)
- **Animation:** Can be reduced via `prefers-reduced-motion` — remove glow pulses and staggered entrances
