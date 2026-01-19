# Design Guidelines: Gift Recommendation App

## Design Approach

**System-Based Approach**: Material Design 3 (Material You)
- **Rationale**: Cross-platform mobile app requiring consistent, functional UI with established patterns
- **Focus**: Utility-first design emphasizing efficiency, clarity, and task completion
- **Principle**: "Simple and direct" - no decorative elements, straight to functionality

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 216 100% 50% (Blue - trust and reliability)
- Primary Container: 216 100% 95%
- Surface: 0 0% 100%
- Surface Variant: 220 14% 96%
- On Surface: 220 9% 20%
- Outline: 220 9% 70%

**Dark Mode:**
- Primary: 216 100% 70%
- Primary Container: 216 100% 20%
- Surface: 220 14% 10%
- Surface Variant: 220 14% 16%
- On Surface: 220 9% 95%
- Outline: 220 9% 40%

**Accent Colors:**
- Success: 142 76% 36% (profile actions)
- Warning: 38 92% 50% (credit warnings)
- Error: 0 72% 51% (delete actions)

### B. Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - clean, highly legible
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale:**
- Hero/Display: 2rem (32px), 700 weight
- Heading 1: 1.5rem (24px), 600 weight
- Heading 2: 1.25rem (20px), 600 weight
- Body: 1rem (16px), 400 weight
- Small/Caption: 0.875rem (14px), 400 weight
- Button Text: 0.9375rem (15px), 500 weight

### C. Layout System

**Spacing Units** (Tailwind):
- Micro: 1, 2 (4px, 8px) - internal component spacing
- Small: 3, 4 (12px, 16px) - element spacing
- Medium: 6, 8 (24px, 32px) - section spacing
- Large: 12, 16 (48px, 64px) - page margins

**Container Constraints:**
- Mobile viewport: 100vw (no horizontal scroll)
- Landing page: 100vh (single viewport, no vertical scroll)
- Max content width: 1200px (desktop)
- Card max-width: 400px

**Grid System:**
- Profile cards: 1 column mobile, 2 columns tablet, 3 columns desktop
- Forms: Single column, max-width 500px, centered

### D. Component Library

**Navigation:**
- Bottom tab bar (mobile): Home | Settings | About
- Fixed height: 64px with icon + label
- Active state: primary color with bold weight

**Profile Cards:**
- Elevated surface (shadow-md)
- Rounded corners: rounded-xl (12px)
- Padding: p-6
- Hover state: subtle scale (scale-105) and shadow increase
- Content: Avatar/initial circle, name (heading), quick stats (caption)

**Buttons:**
- Primary: Solid fill, primary color, rounded-lg
- Secondary: Outline variant with primary border
- Destructive: Error color, solid fill
- Height: h-11 (44px - touch-friendly)
- Padding: px-6

**Forms:**
- Input fields: Border outline, rounded-lg, h-12
- Labels: Above input, text-sm, font-medium, mb-2
- Focus state: Primary color ring (ring-2)
- Age slider: Custom thumb with primary color, track height h-2

**Chat Interface:**
- Message bubbles: rounded-2xl, max-width 80%
- User messages: Primary color, right-aligned
- AI messages: Surface variant, left-aligned
- Input: Fixed bottom bar, rounded-full input, h-12
- Send button: Icon only, primary color

**Modals/Dialogs:**
- Overlay: bg-black/50 backdrop-blur-sm
- Container: Surface color, rounded-2xl, max-width 400px
- Padding: p-6
- Actions: Right-aligned button group

**Profile Header (Chat View):**
- Sticky top bar: surface background, shadow-sm
- Back button + profile name + edit icon
- Height: 56px

### E. Interaction Patterns

**Micro-interactions:**
- Button press: scale-95 active state
- Card selection: border highlight with primary color
- Loading states: Skeleton loaders (pulse animation)
- Success feedback: Brief checkmark animation

**Animations:**
- Page transitions: Slide (100ms)
- Modal entry: Fade + scale from 95% (150ms)
- All timing: ease-in-out curve
- **Minimize decorative animations** - use only for feedback

## Page-Specific Guidelines

### Landing Page (No Scroll)
- **Header**: Logo + Sign in with Google (top-right), h-16
- **Main Area**: 
  - Tagline (h1): "Find the Perfect Gift"
  - Subtitle (body): One-line explanation
  - Profile cards grid: Auto-fit based on screen
  - "New Profile" card with plus icon (dashed border)
- **Footer**: Fixed bottom, 3 icon buttons (Settings | Pricing | About), h-16
- **Spacing**: Distribute vertically to fill 100vh exactly

### Questionnaire Form
- Single-column layout, centered
- Progress indicator: Stepped bar at top
- Radio/select groups: Cards with hover states
- Age slider: Full-width with value display
- Text areas: min-height 120px for personality/interests
- Submit button: Full-width, primary, sticky bottom on mobile

### Chat Interface
- Profile recap: Card at top of chat (first load only)
- Messages: Flex column with reverse order (newest bottom)
- Timestamp: Caption size, muted color, below each message
- Character counter: Fixed above input, updates in real-time
- Credit display: Top-right badge showing remaining queries

### Settings Page
- Tabs: Account | Subscription | Preferences
- Card-based layout for each setting group
- Toggle switches: Primary color when active
- Danger zone: Separate section with error color accents

## Accessibility & Technical

- Touch targets: Minimum 44x44px
- Contrast: WCAG AAA for body text, AA for UI elements
- Focus indicators: 2px primary color ring, visible on all interactive elements
- Dark mode: Full implementation, respects system preference
- Input sanitization: Visual feedback for character limits
- Error states: Clear messaging with error color, icons

## Images

**Profile Avatars:**
- Circular placeholders with initials when no photo
- Size: 80px (profile cards), 40px (chat header)
- Background: Primary color at 20% opacity
- Initials: Primary color, semibold

**No Hero Images Required** - This is a utility app focused on direct functionality