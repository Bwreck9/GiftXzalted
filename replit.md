# Gift Xzalted - AI-Powered Gift Recommendation App

### Overview
Gift Xzalted is an AI-powered application designed to help users find the perfect gift for anyone. It features a hierarchical structure of Profiles (recipients) → Gift Lists (occasions) → Gift Ideas (manual entries and AI recommendations). Users can create unlimited profiles and gift lists for free, with optional token-based AI recommendations. The project aims to provide a streamlined, user-friendly experience for gift discovery, leveraging AI for personalized suggestions and offering flexible pricing models. The business vision is to become a leading platform for personalized gift recommendations, tapping into the vast gift-giving market with a unique AI-driven approach.

### User Preferences
- Material Design 3 aesthetic
- Gradient color scheme (blue → purple → pink)
- Clean, minimal interface
- Fast and simple user experience

### System Architecture
**UI/UX Decisions:**
- **Design System:** Material Design 3 with a consistent gradient styling (primary blue → purple → pink), Inter font, 44px minimum touch targets, consistent spacing, and dark mode support.
- **Navigation:** Hierarchical navigation, clickable logo for homepage, and accessible footer with legal links.
- **Mobile-First UX:** Condensed layouts for profile cards and gift ideas on mobile, restructured headers, and quick-select occasion buttons in gift list creation.
- **Profile System:** Questionnaire-based profiles for AI training with comprehensive checkbox/dropdown interface covering age, gender, personality, interests, relationship, closeness, budget, gift preferences, dislikes, gift style, location, and additional notes. Includes a "Clear All" button and a preview modal.
- **Gift List Management:** Separated "Gift Ideas" (manual with auto-save after 1.5 seconds) and "Generated Ideas" (AI). Settings dropdown for list operations. "Add to list" functionality for AI suggestions. "Generate ideas" button triggers AI recommendations (200 tokens per generation, 10 ideas). AI-generated ideas auto-clear before each new generation. "Clear all" button with confirmation dialog for removing generated ideas. Session-based duplicate prevention for AI suggestions.
- **Landing Page (Non-Authenticated):** Prioritizes sign-in, features compact utility buttons (Install App + Theme Toggle), and four gradient-styled feature cards highlighting app benefits.
- **Pricing Page:** Displays profile plans (Free, Basic, Premium, Enterprise) and one-time token purchases.
- **Checkout Page:** Mini-checkout UX with a centered card, gradient quantity display, and prominent total price.
- **Welcome Experience:** Splash screen on every app open explaining features.

**Technical Implementations & Feature Specifications:**
- **Authentication:** Replit Auth with Google OAuth (session-based, cookie authentication).
- **Database:** PostgreSQL with Drizzle ORM for users, sessions, profiles, gift_lists, messages, tokens, and transactions.
- **Core Hierarchy:** Profiles (`profiles` table) represent individuals, Gift Lists (`gift_lists` table) represent occasions and contain both manual and AI-generated gift ideas.
- **Demo Profiles:** Four pre-populated demo profiles for new users.
- **Token System:** Dual-column accounting for subscription (`tokens`) and purchased (`purchasedTokens`) tokens, deducted purchased first, then subscription. Subscription tokens reset monthly. Cost: 200 tokens per AI generation.
- **Payment Processing:** Secure Stripe integration with webhook signature verification for token and subscription purchases, using environment-specific keys.
- **AI Integration:** OpenAI gpt-4o-mini for personalized gift recommendations based on profile data, returning structured JSON.
- **API Endpoints:** Standard RESTful endpoints for profiles and gift lists (create, read, update, delete) with ownership validation.
- **Pricing Model:** Free tier (5 profiles), one-time token purchases, and tiered subscriptions (Basic, Premium, Enterprise) offering increasing profiles and tokens.
- **Legal Pages:** Dedicated Privacy Policy and Terms & Conditions pages.
- **Support Page:** Authenticated user support page with email contact form.
- **Settings Page:** Displays account info, token balance, PWA installation card, and sign-out.
- **Progressive Web App (PWA):** Full PWA support with web app manifest, service worker (v2) for intelligent caching (network-first for HTML, cache-first for assets), offline functionality, and custom installation UI. Auto-install prompts for Android/Desktop (Chrome/Edge), manual install instructions for iOS (Safari share menu).

**Deployment & Custom Domain:**
- **Target Subdomain:** `gift.xzalted.com`
- **Deployment Process:** Publish on Replit (Autoscale recommended), configure custom domain (`gift.xzalted.com`), update DNS records (A and TXT) at registrar, verification by Replit, automatic SSL.
- **PWA Installation:** Users can install the PWA from the custom domain on desktop (Chrome/Edge) and mobile (Android Chrome, iOS Safari).

### External Dependencies
- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon)
- **Authentication:** Replit Auth (Google OAuth)
- **AI:** OpenAI gpt-4o-mini
- **Payments:** Stripe
- **ORM:** Drizzle