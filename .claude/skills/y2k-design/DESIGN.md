# Retro Y2K Design Guidelines

## Visual Style

- **Aesthetic**: Early-internet OS desktop — overlapping windows, pixel chrome, dense pastel UI
- **Mood**: Playful, nostalgic, maximalist, loud — controlled chaos with clear hierarchy
- **Inspiration**: Windows 98/XP, early web portals (Yahoo, GeoCities), Tamagotchi, Y2K kawaii
- **Key principle**: Every element should feel like it belongs on a 2001 monitor. No modern SaaS softness.

---

## Color Palettes

Four canonical palettes — pick one and stick to it. Do not mix across palettes.

### 1. Bubblegum *(default)*
| Token | Hex | Usage |
|---|---|---|
| Background | `#FF85C2` | Page background |
| BG Grid Line | `#FF6FAF` | Graph paper grid overlay |
| Window Body | `#FFF5DC` | Window interior, cards |
| Title Bar | `#FFD84D` | Window chrome, section headers |
| Border | `#1A0A2E` | All borders, shadows |
| Text Primary | `#1A0A2E` | Headings, labels |
| Text Muted | `#6B4C6B` | Secondary text |
| Button Primary | `#FFD84D` | CTA buttons |
| Button Danger | `#FF3D6B` | Delete, close, error actions |
| Accent | `#C8A0FF` | Highlights, focus states |
| Sparkle | `#FF3D9A` | Decorative stars, glows |

### 2. Vaporwave
| Token | Hex | Usage |
|---|---|---|
| Background | `linear-gradient(135deg, #FF6EB4 0%, #8050D0 100%)` | Page background |
| Window Body | `#C8A8FF` | Window interior |
| Title Bar | `#9060E0` | Window chrome |
| Border | `#1A0028` | All borders |
| Button Primary | `#4898FF` | CTA buttons |
| Accent | `#FF3D9A` | Highlights |

### 3. Y2K Blue
| Token | Hex | Usage |
|---|---|---|
| Background | `#7DD3F7` | Page background |
| BG Grid Line | `#6BC5EF` | Grid overlay |
| Window Body | `#FFFFFF` | Window interior |
| Title Bar | `#FFB8D4` | Window chrome |
| Border | `#1A2A4A` | All borders |
| Button Primary | `#FFE040` | CTA buttons |
| Accent | `#B8F5D8` | Highlights |

### 4. Pastel Pixel
| Token | Hex | Usage |
|---|---|---|
| Background | `linear-gradient(135deg, #C0EAC0 0%, #FFD0E8 100%)` | Page background |
| Window Body | `#FFFFFF` | Window interior |
| Title Bar | `#B8E840` | Window chrome |
| Border | `#4080C0` | All borders |
| Button Primary | `#FFE040` | CTA buttons |
| Accent | `#FFB8D4` | Highlights |

---

## Typography

**Google Fonts import:**
```
Press Start 2P — pixel bitmap display font
VT323 — larger, looser pixel font for body-scale pixel text
Nunito (700, 800) — rounded sans for readable body copy
```

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Page heading (H1) | Press Start 2P | 18–24px | 400 | line-height 1.6 |
| Section heading (H2–H3) | Press Start 2P | 12–16px | 400 | line-height 1.8 |
| Window title bar | Press Start 2P | 9–10px | 400 | — |
| Dialog / alert body | VT323 | 18–22px | 400 | Readable at large sizes |
| Body copy | Nunito | 14–16px | 700 | Bold for legibility on colorful bg |
| Labels / captions | Nunito | 11–12px | 600 | Uppercase |
| Button labels | Press Start 2P | 8–9px | 400 | All caps naturally |

**Rules:**
- Never use Inter, Roboto, Poppins, DM Sans, or any neutral geometric sans as a primary font
- Press Start 2P has a very large line-height requirement — always set `line-height: 1.6` minimum
- VT323 is best at 18px and above; below that use Press Start 2P

---

## Spacing & Layout

- **Density**: Tight and packed — this is not a minimal SaaS layout. Windows can overlap.
- **Base unit**: 8px
- **Window padding**: 16px interior
- **Title bar height**: 28–32px
- **Window gap (floating layout)**: 16–24px
- **Button padding**: 8px 16px
- **Grid**: No strict 12-column — windows float freely on the desktop canvas
- **Max content width**: 1200px centered on large screens
- **Background canvas**: Full viewport, grid paper pattern, windows positioned absolutely or in a flex wrap

### Layout archetypes

**OS Desktop:** Windows float over grid background. Optional taskbar pinned to bottom (height 36px, dark border-top, flex row of open windows).

**Web Layout with Y2K skin:** Standard top-to-bottom scroll. Section headers styled as title bars. Content sections wrapped in window chrome. Hero has grid background.

---

## Borders & Shadows

- **Border style**: `2px solid [border color]` — on everything. No exceptions.
- **Border radius**: `0` — sharp corners everywhere. Max `2px` if absolutely required.
- **Box shadow rule**: Hard offset, zero blur. Never use `blur` in a box-shadow.
  - Windows: `4px 4px 0 [border]`
  - Buttons: `3px 3px 0 [border]`
  - Dialogs: `6px 6px 0 [border]`
  - Inputs: `2px 2px 0 [border]`
- **No** `backdrop-filter`, **no** drop shadows with blur, **no** soft elevation

---

## Buttons

**Primary button:**
- Background: `var(--btn-primary)` (yellow in most palettes)
- Border: `2px solid var(--border)`
- Shadow: `3px 3px 0 var(--border)`
- Font: Press Start 2P, 8–9px
- Padding: `8px 16px`
- Radius: `0`

**Danger button:**
- Same structure, background `#FF3D6B`

**Secondary / ghost button:**
- Background: `var(--window-body)` (cream/white)
- Same border + shadow

**Hover:** `filter: brightness(1.08)` — subtle, no color shift

**Active/pressed:** `transform: translate(3px, 3px)` + `box-shadow: none` — simulates physical press

**Never:** gradient fills, pill shapes, blur on hover, border-radius

---

## Icons

- **Functional icons**: Lucide icons only — 16–20px, stroke 1.5–2, color `var(--border)` or `var(--text-primary)`
- **No emoji** — ever. Not as icons, not as decoration.
- **No Font Awesome** — too modern, wrong aesthetic

**Decorative pixel art** (hand-coded SVG only, not image embeds):
- **4-pointed sparkle star**: two thin rectangles crossing at center, rotated 45°
- **Pixel cloud**: overlapping rounded squares (or pixel-grid of filled squares)
- **Pixel heart**: classic 5×4 grid heart
- **Checkerboard**: for image placeholder areas (alternating `#ccc` / `#fff` squares)
- **Cursor arrow**: white with black outline — the classic Windows pointer

---

## Components

### Window
```
┌─ [title] ·················· [_][□][X] ─┐
│ content area                            │
│ 16px padding, cream/white background    │
└─────────────────────────────────────────┘
```
- Title bar: colored, `Press Start 2P` at 9px, `2px solid` border-bottom
- Controls: 3 colored squares (red close `#FF5B5B`, yellow min `#FFD84D`, green max `#59D98F`), each `12×12px`, `1px solid border`
- Body: `var(--window-body)`, `16px padding`
- Outer: `2px solid border`, `4px 4px 0 border` shadow

### Dialog / Alert
- Smaller window, max-width 280px
- Body in VT323 18px with an icon (Lucide `AlertTriangle`, `Info`, etc.)
- Action row: `border-top: 2px solid border`, buttons right-aligned
- Larger shadow: `6px 6px 0 border`

### Input
- `2px solid border`, `2px 2px 0 border` shadow
- Radius `0`, white background
- Focus: shadow color switches to `var(--accent)` or `var(--sparkle)`
- Font: Nunito 700, 13px

### Progress Bar
- Track: `2px solid border`, `2px 2px 0 border` shadow, white bg, height 18px
- Fill: `repeating-linear-gradient(45deg, ...)` — diagonal stripe pattern (marching animated)
- Animation: `background-position` shift to create marching ants effect

### Desktop Icon
- Icon (Lucide or pixel SVG), 32×32px
- Label below: Nunito 600, 11px, centered, max-width 64px, word-wrap

### Taskbar *(optional)*
- Full width, height 36px
- `border-top: 2px solid border`
- Background: `var(--title-bar)`
- Start button left, open windows center, clock right

### Scrollbar *(custom, webkit)*
- Width: 12px
- Track: `var(--window-body)`, `border-left: 2px solid border`
- Thumb: `var(--title-bar)`, `border: 2px solid border`, radius `0`
- Thumb hover: `var(--accent)`

---

## Backgrounds

**Grid paper (default):**
```css
background-color: [palette bg];
background-image:
  linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px);
background-size: 32px 32px;
```

**Gradient palettes (Vaporwave, Pastel Pixel):** Use CSS `linear-gradient` on the background — no image files. Layer the grid on top.

**Checkerboard (image placeholder areas):**
```css
background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
  linear-gradient(-45deg, #ccc 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #ccc 75%),
  linear-gradient(-45deg, transparent 75%, #ccc 75%);
background-size: 16px 16px;
background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
```

---

## Micro-Animations

All of these are required — skip none.

| Animation | Trigger | Effect |
|---|---|---|
| **Screen flicker** | Page load (body) | `opacity: 0 → 1 → 0 → 1` in 400ms |
| **Window spawn** | Window mount | `scale(0.92) + opacity:0 → scale(1) + opacity:1`, spring easing, 200ms |
| **Window stagger** | Multiple windows | 80ms delay per window (nth-child) |
| **Button press** | `:active` | `translate(3px, 3px)` + remove shadow offset |
| **Icon pixel-jump** | Icon `:hover` | `translateY(-3px)`, `steps(1)` easing (instant, no smooth) |
| **Sparkle pulse** | Continuous | `scale + rotate` loop, 3s infinite |
| **Progress march** | Progress bar fill | `background-position` shift, 0.6s linear infinite |
| **Scanline shimmer** | Title bar `::after` | Static repeating-linear-gradient overlay, 6% white opacity |
| **Custom scrollbar** | Always | Square thumb, colored, 0 border-radius |

**Easing rules:**
- Window spawn: `cubic-bezier(0.34, 1.56, 0.64, 1)` — spring overshoot
- Button transitions: `80ms linear` — fast and snappy
- Icon jump: `steps(1)` — instant, pixel-jump feel, never smooth
- Never use `ease-in-out` for interactive elements — too smooth, kills the retro feel

---

## Decorative Elements

Scatter these across the layout. They are as important as the content.

- **4-pointed sparkle stars**: at least 2–4 visible at any time, various sizes (12px–28px), animating
- **Pixel clouds**: in backgrounds, floating UI corners
- **Pixel hearts**: near interactive or social elements
- **Dotted / dashed borders**: `border: 2px dashed [border]` for secondary containers
- **"×××" or "···" text patterns**: in title bars and between sections (CSS `content`, Nunito or monospace)
- **Cursor crosshair**: pixel-style arrow cursor SVG as custom CSS cursor

---

## What Not to Do

| Pattern | Why it kills the vibe |
|---|---|
| `border-radius > 4px` on windows/buttons | Too modern, breaks OS window feel |
| `backdrop-filter: blur()` | Glassmorphism — wrong decade |
| `box-shadow` with blur > 0 | Soft shadows are modern; Y2K uses hard offsets |
| Gradient fills on buttons | Buttons are flat, one color |
| Inter / Roboto / Poppins as body font | Generic, zero personality |
| Emoji as icons or decoration | Use Lucide + hand-coded pixel SVGs |
| Lots of white space / airy layout | Y2K is dense, layered, overlapping |
| Pill-shaped buttons | Circular ends are wrong; sharp corners only |
| Dark mode | Y2K is loud and light |
| `transition: all` | Kills performance, use specific properties |
| Smooth hover color shifts | Use `filter: brightness()` instead |
| CSS shadows with `blur` | Hard offset only, `0` blur always |
