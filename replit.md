# Gift Xzalted - AI-Powered Gift Recommendation App

### Overview
Gift Xzalted is an AI-powered application designed to help users find the perfect gift for anyone. It features a **unified profile view** where users create Profiles (recipients) and see all Gift Ideas directly with occasion tags. Users can create unlimited profiles for free, with optional token-based AI recommendations. The project aims to provide a streamlined, user-friendly experience for gift discovery, leveraging AI for personalized suggestions and offering flexible pricing models.

### User Preferences
- Material Design 3 aesthetic
- Gradient color scheme (blue → purple → pink)
- Clean, minimal interface
- Fast and simple user experience

### System Architecture

**UI/UX Decisions:**
- **Design System:** Material Design 3 with a consistent gradient styling (primary blue → purple → pink), Inter font, 44px minimum touch targets, consistent spacing, and dark mode support.
- **Navigation:** Hierarchical navigation with About/Pricing/Theme toggle in top nav bar. Clickable logo for homepage. Privacy/Terms in authenticated user dropdown menu. Train Profile accessible from home page profile card gear menu.
- **Mobile-First UX:** Condensed layouts for profile cards and gift ideas on mobile, restructured headers.
- **Unified Profile View:** Profile page displays all gift ideas directly without navigating to separate gift lists. Ideas are tagged with occasions (Birthday, Anniversary, Christmas, etc.) and can be filtered.
- **Profile System:** Questionnaire-based profiles for AI training with comprehensive checkbox/dropdown interface covering age, gender, personality traits (~35 options organized into 6 categories: Social/Lifestyle, Energy/Temperament, Mind/Work Style, Values/Identity, Interests-based, Other), interests, relationship, closeness, dislikes, location, and additional notes. Includes a "Clear All" button and a preview modal.
- **Important Dates:** Profiles store a unified `importantDates` array with flexible date entries (name, date in MM-DD format, optional year, showOnCard flag). Users can add custom dates beyond Birthday/Anniversary. Up to 3 dates can be marked to display on profile cards.
- **Gift Ideas Management:**
  - **Saved Ideas:** Manual entries with occasion tags, auto-saved
  - **Generated Ideas:** AI-powered suggestions (200 tokens per 10 ideas, scalable 10-50)
  - Add Idea dialog with occasion dropdown (Birthday, Christmas, Anniversary, etc.) + custom option
  - Filter by occasion dropdown
  - "Add to list" functionality to save AI suggestions
  - **Refine Panel:** Collapsible panel next to Generate button with session-specific filters:
    - Price range chips (Under $25, $25-50, $50-100, $100+)
    - Gift type chips (Physical, Experience, Subscription, Handmade, Digital)
    - Gift preference chips (Practical, Sentimental, Experiences, Funny/Novelty)
    - Gift style chips (Unique & Thoughtful, Safe & Popular)
    - Custom context textarea for session-specific instructions
  - **Deduplication System:** Server-side filtering to prevent duplicate ideas:
    - Title normalization (lowercase, punctuation removal)
    - Similarity detection (80% word overlap threshold)
    - Over-generation (50% extra requested from AI)
    - Post-processing filter against all existing ideas (manual + AI)
- **Landing Page (Non-Authenticated):** Prioritizes sign-in, features compact utility buttons (Install App + Theme Toggle), and four gradient-styled feature cards highlighting app benefits.
- **Pricing Page:** Displays profile plans (Free, Basic, Premium, Enterprise) and one-time token purchases.
- **Checkout Page:** Mini-checkout UX with a centered card, gradient quantity display, and prominent total price.
- **Welcome Experience:** Splash screen on every app open explaining features.

**Technical Implementations & Feature Specifications:**
- **Authentication:** Firebase Authentication with Google OAuth.
- **Database:** PostgreSQL with Drizzle ORM for users, sessions, profiles, gift_lists, messages, tokens, and transactions.
- **Core Data Model:** 
  - Profiles (`profiles` table) represent gift recipients with questionnaire data and optional important dates
  - Gift Lists (`gift_lists` table) represent occasions and contain both manual and AI-generated gift ideas (used internally, hidden from user)
  - Occasion tags derived from gift list titles for unified view
- **Demo Profiles:** Four pre-populated demo profiles for new users.
- **Token System:** Dual-column accounting for subscription (`tokens`) and purchased (`purchasedTokens`) tokens, deducted purchased first, then subscription. Subscription tokens reset monthly. Cost: 200 tokens per 10 AI ideas.
- **Payment Processing:** Stripe Checkout (redirect-based) for secure payments. Webhook signature verification for payment confirmation.
- **AI Integration:** OpenAI gpt-4o-mini for personalized gift recommendations based on profile data, returning structured JSON.
- **API Endpoints:** Standard RESTful endpoints for profiles and gift lists (create, read, update, delete) with ownership validation.
- **Pricing Model:** Free tier (5 profiles), one-time token purchases, and tiered subscriptions (Basic, Premium, Enterprise) offering increasing profiles and tokens.
- **Legal Pages:** Dedicated Privacy Policy and Terms & Conditions pages.
- **Support Page:** Authenticated user support page with email contact form.
- **Settings Page:** Displays account info, token balance, PWA installation card, and sign-out.
- **Progressive Web App (PWA):** Full PWA support with web app manifest, service worker for intelligent caching, offline functionality, and custom installation UI.

**Deployment & Custom Domain:**
- **Target Subdomain:** `gift.xzalted.com`
- **Deployment Process:** Publish on Replit (Autoscale recommended), configure custom domain, update DNS records at registrar.
- **PWA Installation:** Users can install the PWA from the custom domain on desktop and mobile.

### Key Files
- `client/src/pages/ProfileDetail.tsx` - Unified profile view with all ideas
- `client/src/components/ImportantDatesModal.tsx` - Unified important dates editor with add/remove/show-on-card
- `client/src/components/SettingsModal.tsx` - Profile settings (rename/recolor)
- `shared/schema.ts` - Database schema including profiles with importantDates array
- `server/routes.ts` - API endpoints
- `server/openai.ts` - AI generation logic

### External Dependencies
- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon)
- **Authentication:** Firebase (Google OAuth)
- **AI:** OpenAI gpt-4o-mini
- **Payments:** Stripe
- **ORM:** Drizzle
