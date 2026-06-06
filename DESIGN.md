# Design Brief — Royals Cricket Academy Registration

**Theme**: Light with maroon accents | **Primary Font**: General Sans | **Body Font**: DM Sans | **Mono**: Geist Mono

## Palette

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| primary | 0.40 0.18 22 | 0.45 0.20 22 | Academy maroon, buttons, active states |
| accent | 0.52 0.20 30 | 0.60 0.22 30 | Highlights, CTAs, secondary action |
| success | 0.65 0.18 142 | 0.70 0.20 142 | Attendance confirmation, approved |
| destructive | 0.55 0.22 25 | 0.65 0.19 22 | Errors, warnings, cancellation |
| neutral | 0.99 0 0 | 0.10 0 0 | Background, cards, text |

## Structural Zones

| Zone | Light | Dark | Treatment |
| --- | --- | --- | --- |
| Header | `bg-card` + `border-b border-border` | `bg-card` + `border-b border-border/50` | Academy logo, title, contact info |
| Card Surface | `bg-card` + `border border-border` + `shadow-md` | `bg-card` + `border border-border` + `shadow-lg` | Receipt sections, student details |
| Background | `bg-background` | `bg-background` | Page container, spacing |
| CTA Zone | `bg-primary text-primary-foreground` | `bg-primary text-primary-foreground` | Print, download, confirm buttons |
| Muted Section | `bg-muted text-muted-foreground` | `bg-muted text-muted-foreground` | Fees breakdown, attendance summary |

## Typography Scale

- **Display** (General Sans 700): 28–32px, academy name, section headers
- **Large** (General Sans 600): 18–20px, receipt titles, student name
- **Body** (DM Sans 400): 14–16px, details, attendance rows, fees items
- **Small** (DM Sans 400): 12–13px, labels, timestamps, helper text
- **Mono** (Geist Mono 400): 12–14px, receipt numbers, transaction IDs, amounts

## Components & Patterns

- **Card**: Maroon border-top accent strip + white surface + subtle shadow
- **Button**: Primary (maroon bg, white text, 6px radius), Secondary (border + text), Tertiary (ghost)
- **Form Input**: Light border, maroon focus ring, 4px radius
- **Attendance Badge**: Green success or grey muted, circular 24px
- **Fee Item**: Mono typeface, right-aligned amount, left border secondary accent
- **Mobile Layout**: Single-column stacked, 16px gutters, full-width cards on `sm:`

## Motion

- Smooth transitions: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- Button hover: +2px shadow, text stays solid
- Card open/detail reveal: fade-in 0.2s, no bounce
- Focus states: maroon ring 2px offset

## Accessibility

- WCAG AA+ contrast: Maroon on white (Δ ≥ 0.60 lightness), white on maroon (Δ ≥ 0.55)
- Touch targets: 44px minimum (buttons, receipt rows)
- Semantic HTML: Receipt structure uses `<section>`, labels with `<label>`, amounts in `<strong>`
- Focus visible: maroon ring on all interactive elements
- Print: Maroon preserved, shadows removed, borders thicker

## Asset Paths

- **Fonts**: `src/frontend/public/assets/fonts/` (GeneralSans, DMSans, GeistMono)
- **Icons** (if used): `src/frontend/public/assets/icons/`
- **Images**: `src/frontend/public/assets/images/`

## Key Differentiator

Institutional trust through consistent maroon branding + card-based receipt hierarchy. Every surface deliberately positioned—no ghost text on flat backgrounds. Mobile-first responsive ensures receipt legibility and printability on all devices.
