# Web Frontend Visual Refresh (Design)

## Goal
Upgrade the Symphony Kanban web frontend into a more modern, smoother, and more cohesive product experience.

The target aesthetic is a daytime-first interface built on a professional layered SaaS structure, with selective light glass accents for polish. The result should feel higher-end on first impression while remaining comfortable for long-term daily use.

## Context
The current web app already has light and dark theme support, but the frontend still reads as visually inconsistent and comparatively plain. The existing theme logic defaults to dark mode, and the current styling foundation does not yet establish a strong shared visual system across layout shells, page containers, and high-frequency UI components.

The user wants:
- a full frontend-wide visual upgrade rather than a single-page redesign
- daytime mode to become the default theme
- dark mode to remain available
- a more modern and smoother look-and-feel
- improved long-term usability, not just a superficial reskin

## Design Direction
The visual direction is:
- **Primary structure:** Layered Pro
- **Accent language:** Airy Glass

This means the product should primarily feel like a professional productivity tool with clear structure, stable hierarchy, and strong readability. Glass-like treatment is used selectively as a highlight language rather than a global visual effect.

### Intended perception
- brighter and more modern than the current UI
- clearly structured, not overly minimal
- visually premium without becoming decorative
- smooth in interaction feedback and transitions
- suitable for repeated daily usage

## Scope
### In scope
- redefine the light theme as the default entry theme
- preserve dark theme support and existing local preference restoration behavior
- refresh global theme tokens and shared visual variables
- update global base and layout styling
- upgrade shared layout shells, page containers, and high-frequency visual patterns
- unify high-frequency components including buttons, inputs, filters, cards, tables, dialogs, drawers, empty states, and feedback surfaces
- improve hover, focus, open/close, and transition behavior where it contributes to perceived smoothness

### Out of scope
- business logic rewrites
- API contract changes
- unrelated refactors
- one-pass redesign of every low-frequency screen
- animation-heavy or decorative motion that harms clarity

## Visual System
### Theme posture
The frontend becomes daytime-first:
- first visit with no saved preference uses `light`
- returning users with a stored preference continue to get their saved theme
- dark mode remains a supported alternate theme, not removed or deprecated

### Color system
The light theme should not rely on flat pure white planes everywhere. Instead:
- page background uses a very light cool gray / blue-gray base
- content surfaces remain clean and bright, with restrained tonal separation
- primary blue stays professional and controlled rather than highly saturated
- semantic states (success, warning, error) are normalized into cleaner and more consistent scales

### Surface hierarchy
The system should define distinct surface levels rather than treating every panel the same:
- page background layer
- standard content card layer
- elevated action / summary / overlay layer
- selective airy-glass accent layer for specific interactive zones

Each layer should communicate its role through a combination of fill, border, shadow, radius, and optional translucency.

### Shape, spacing, and density
- card and control radii should feel softer and more premium than the current baseline
- spacing should become more systematic across pages, headers, cards, and forms
- density should remain productive, not sparse for its own sake
- typography and block rhythm should improve scanability across list, detail, and board views

### Motion language
Motion should remain restrained and functional:
- hover and focus transitions should feel smoother and more deliberate
- dialogs, drawers, and overlays should open and close with less abruptness
- no decorative motion system beyond what improves clarity and quality perception

## Layout Shell Strategy
A large portion of the redesign should come from shell consistency rather than isolated component styling.

### Page foundation
- use a subtle cool-toned page backdrop instead of plain white emptiness
- allow occasional soft gradient or highlight treatment on major surfaces where appropriate
- keep readability and content contrast as the primary concern

### Shared page containers
- standardize page width, horizontal gutters, and vertical rhythm
- align list, detail, and board pages around a more consistent page-header and content-section structure
- reduce cases where pages feel edge-aligned, cramped, or rhythmically inconsistent

### Navigation and top-level chrome
- navigation should feel lighter, clearer, and more intentional
- page headers should consistently frame title, description, and primary actions
- search, filters, and actions should use repeatable placement logic across screens

### Content zoning
Pages should more clearly separate:
- page-level heading area
- filter / action toolbar area
- main content card area
- secondary supporting information area

This supports faster scanning and improves long-session usability.

### Where to use the airy-glass accent
The accent language should be limited to places that benefit from extra lift:
- page action bars
- filter / toolbar containers
- dialogs, drawers, and overlays
- selected summary or highlight cards

The overall product should still read as stable and professional, not as a full glassmorphism interface.

## Component Unification Strategy
The redesign should prioritize high-frequency components and shared behaviors.

### Buttons
- establish clearer hierarchy between primary, secondary, and text/ghost actions
- primary buttons should feel more substantial and intentional
- hover, active, and disabled states should feel unified and less raw

### Forms
- normalize control heights, radii, borders, and focus states across input-like controls
- focus styling should be visible but soft, likely through refined border and glow treatment
- labels, help text, and validation messaging should follow one spacing and typography rhythm

### Tables and lists
- unify header, row, hover, selected, and action-area treatment
- reduce visual harshness while preserving information density
- improve readability for long scanning sessions

### Cards and panels
- define two to three intentional card levels with distinct visual roles
- avoid every card reading as visually identical
- align card title, description, and action treatment across screen types

### Dialogs, drawers, and overlays
- give overlays stronger lift and clearer structure
- use the airy-glass accent most confidently here
- smooth open/close transitions so interactions feel less abrupt

### Empty, error, and success states
- empty states should be more guided and intentional, not just sparse placeholders
- error states should be clearer without feeling alarmist
- success messaging should be restrained and not overly disruptive

### Dark theme mapping
The component system should be updated in a way that preserves parity for dark mode. Light mode is the primary design target, but dark mode should still reflect the same hierarchy model rather than being left visually behind.

## Implementation Boundary
The work should stay focused on frontend experience layers:
- theme tokens and theme switching defaults
- global base styles and layout styles
- shared shells and reusable UI surfaces
- high-frequency page containers and interaction zones

The first pass should not expand into business-rule changes or broad architectural rewrites.

## Coverage Priorities
The redesign should first guarantee consistency across:
- global entry surfaces and main navigation
- board, list, and detail pages that represent the core workflow
- form dialogs, confirmation dialogs, drawers, and message feedback
- high-frequency filter, search, and status-display zones

Lower-frequency screens may still inherit old details at first, but shared token and shell changes should minimize the gap.

## Risks and Trade-offs
- touching shared theme and shell layers can affect many pages at once, so regression checking must be deliberate
- prioritizing light mode may reveal dark mode inconsistencies that need token remapping rather than page-by-page fixes
- overusing glass effects would reduce clarity; therefore the accent treatment must remain selective
- trying to fully restyle every edge screen in one pass would slow delivery and reduce coherence, so priority-based coverage is intentional

## Testing and Verification
### Theme behavior
- verify default theme becomes `light` when no stored preference exists
- verify a stored `dark` or `light` preference still wins on subsequent visits

### Visual consistency
- verify shared tokens are applied across key shells and page types
- verify both light and dark themes remain usable and internally consistent

### Interaction quality
- verify hover, focus, overlay, and transition behavior feels smoother without introducing lag or distraction

### Regression coverage
- run existing frontend tests
- update or add focused tests where theme-default behavior or other stable UI logic is covered by tests
- manually inspect representative high-frequency screens for layout and component regressions

## Completion Criteria
This design is complete when:
- the web frontend reads as a cohesive modern product rather than a collection of individually styled pages
- light mode is the default first-run theme
- dark mode remains available and behaves correctly
- core pages and high-frequency components share a clear hierarchy, spacing system, and interaction language
- the experience feels more premium and smoother without requiring unrelated product or business-logic changes
