# Gift Xzalted - AI-Powered Gift Recommendation App

### Overview
Gift Xzalted is an AI-powered application designed to help users find the perfect gift for anyone. It features a hierarchical structure of Profiles (recipients) → Gift Lists (occasions) → Gift Ideas (manual entries and AI recommendations). Users can create unlimited profiles and gift lists for free, with optional token-based AI recommendations. The project aims to provide a streamlined, user-friendly experience for gift discovery, leveraging AI for personalized suggestions and offering flexible pricing models.

### User Preferences
- Material Design 3 aesthetic
- Gradient color scheme (blue → purple → pink)
- Clean, minimal interface
- Fast and simple user experience

### System Architecture
**UI/UX Decisions:**
- **Design System:** Material Design 3 with a consistent gradient styling (primary blue → purple → pink), Inter font, 44px minimum touch targets, consistent spacing, and dark mode support.
- **Navigation:** Hierarchical navigation with "Back to profiles" button in ProfileDetail and "Back" button in GiftListDetail. Clickable logo for homepage navigation and accessible footer with legal links. Landing page includes "Need more profiles? Check out the profile plans" link to pricing.
- **Character Limits:** Profile names and list names limited to 20 characters (enforced in frontend maxLength and backend schema validation).
- **Components:** Reusable UI components for consistent design, Settings gear icons positioned inside list tiles (right side) for list options.
- **Welcome Experience:** Splash screen shows on every app open (not just first time) explaining app features. Feature buttons and close button navigate to landing page. "Web Search Agent (In development)" displayed. Footer button to reopen splash.
- **Mobile-First UX Optimizations (Oct 2025):**
  - Profile cards display clean, condensed layout with only profile name and color badge (no relationship/event subcaptions)
  - Gift idea reasons moved from visible subcaptions to info button popovers for more compact mobile display
  - Gift Lists page header restructured with title on separate row to prevent squishing on narrow screens
  - Profile info bar in Gift Lists page shows only profile name (no relationship subcaption)
  - Create Gift List dialog includes 12 quick-select occasion buttons (Birthday, Christmas, Anniversary, Mother's Day, Father's Day, Valentine's Day, Graduation, Wedding, Baby Shower, Housewarming, Thank You, Just Because) that populate textbox without auto-creating
- **Profile System:** Questionnaire-based profiles for AI training with comprehensive checkbox/dropdown interface to minimize user typing:
  - Age Range: 5 radio options (Child 0-12, Teen 13-19, Young Adult 20-30, Adult 31-50, Senior 50+)
  - Gender: Radio options (Male, Female, Non-binary, Other with custom text input)
  - Personality Traits: 8 multi-select checkboxes (Adventurous, Thoughtful, Funny/Lighthearted, Introverted, Outgoing, Artistic, Tech-savvy, Sentimental) - **Required for AI generation** (at least 1 must be selected)
  - Interests: Text input (500 char limit) - **Optional for AI generation**
  - Relationship: 5 radio options labeled "What's your relationship type?" (Partner, Family, Friend, Coworker, Acquaintance)
  - Closeness: 3 radio options (Very close, Somewhat close, Casual)
  - Budget: 4 radio options (Under $25, $25-$50, $50-$100, $100+)
  - Gift Preferences: 4 multi-select checkboxes (Practical gifts, Sentimental/personalized gifts, Experiences, Funny/novelty items)
  - Dislikes: Text input (500 char limit)
  - Gift Style: 2 radio options (Unique & Thoughtful, Safe & Popular)
  - Location: Text input (100 char limit)
  - Additional Notes: Textarea (2000 char limit with live character counter)
  - **Clear All Button:** Header includes "Clear All Selections" button with confirmation dialog to reset all form fields
  - **Preview Modal:** Landing page shows questionnaire preview modal with support email link (support@xzalted.com) for bug reports and enhancement requests
  - **Context-aware buttons:** Shows "Create Profile" / "Create + Generate Response" in normal flow; shows "Save" / "Save & Generate Ideas" when editing from gift list context (URL params: `from=giftlist&listId=xyz`)
  - **AI Generation Flow:** Questionnaire saves profile data and redirects to gift list with `?trigger=generate` parameter. Gift list auto-triggers generation once using state flag guard to prevent infinite loops. Generation validates questionnaire completion and token balance before proceeding. Backend saves AI recommendations to both `messages` table (for history) and `gift_lists.premiumResults` (for display).
- **Gift List Management:** 
  - Separated "Gift Ideas" (manual entries) and "Generated Ideas" (AI recommendations) sections
  - Settings dropdown menu for list operations (rename, delete)
  - "Add to list" functionality to promote AI suggestions to manual gift list
  - "Generate ideas" button for AI recommendations (500 tokens per generation, generates 10 ideas) - always clickable, shows helpful dialog with pricing link when tokens insufficient
  - Empty state messaging ("No generations yet") when AI recommendations haven't been created
  - **Session-based Duplicate Prevention:** AI tracks previously generated ideas during current page session to avoid suggesting duplicates across multiple generations. Session state resets on navigation, making generated ideas ephemeral unless manually added to persistent list. Backend passes `alreadyGeneratedIdeas` to OpenAI with avoidance instruction. Frontend normalizes titles (trim, lowercase) and uses Set-based deduplication. Disclaimer below generated ideas: "These AI suggestions are temporary. Add your favorites to the manual list above to save them permanently."
- **Landing Page (Non-Authenticated):** Features four gradient-styled cards highlighting app benefits: free unlimited gift tracker, memory/organization features, AI-powered recommendations, and multi-list organization capabilities. Includes "See Full Questionnaire" button to preview modal.
- **Pricing Page:** Profile plans (Free, Basic, Premium, Enterprise) grouped in a gradient-styled container. One-time token purchase displayed below subscription plans.
- **Checkout Page:** Mini-checkout UX with centered max-w-sm card, gradient quantity display (X × $5), prominent total price below slider with gradient text, compact layout showing total tokens and price. No scroll blink when quantity changes (1-20 batches).

**Technical Implementations & Feature Specifications:**
- **Authentication:** Replit Auth with Google OAuth (session-based, cookie authentication).
- **Database:** PostgreSQL with Drizzle ORM, storing users, sessions, profiles, gift_lists, messages, tokens, and transactions.
- **Core Hierarchy:** Profiles (`profiles` table) represent individuals (e.g., "Mom"), Gift Lists (`gift_lists` table) represent occasions (e.g., "Birthday") and contain both manual and AI-generated gift ideas.
- **Demo Profiles:** New users receive two pre-populated demo profiles ("Demo: Girlfriend" and "Demo: Wife") on first login to showcase app functionality.
- **Token System:** Dual-column token accounting with separate tracking for subscription and purchased tokens:
  - `tokens` column: Subscription tokens (reset monthly to tier amount, don't stack)
  - `purchasedTokens` column: One-time purchased tokens (never expire)
  - Deduction order: Purchased tokens used first, then subscription tokens
  - Monthly reset: Only subscription tokens reset on 1st of each month
  - Cost: 500 tokens per AI generation
  - Refund protection: Tokens refunded if AI generation, message storage, or profile creation fails
  - **Known Limitation:** Current implementation lacks database transaction-level concurrency control. For production use, `deductTokens` should use row-level locking (SELECT FOR UPDATE) or optimistic concurrency control to prevent race conditions during concurrent requests.
- **Payment Processing:** Secure Stripe integration with webhook signature verification for token and subscription purchases.
- **AI Integration:** Utilizes OpenAI gpt-4o-mini for generating personalized gift recommendations based on user-provided profile data. Returns structured JSON array with gift recommendations (id, title, reason format).
- **API Endpoints:**
    - `GET/POST /api/profiles`: List/create profiles with optional AI generation.
    - `PATCH /api/profiles/:id`: Update profile with optional AI generation (supports `generateResponse` parameter).
    - `POST /api/profiles/:profileId/gift-lists`: Create gift list for a profile.
    - `GET /api/profiles/:profileId/gift-lists`: List gift lists for a profile.
    - `PATCH /api/gift-lists/:id`: Update manual ideas or premium results for a gift list.
    - `POST /api/profiles/:id/clear`: Clears profile data.
    - Ownership validation is enforced for all profile and gift list operations.
- **Pricing Model:**
    - **Free Tier:** 5 profiles, unlimited gift lists.
    - **One-Time:** $5 for 5,000 tokens.
    - **Basic Subscription:** $5/month for 10,000 tokens + up to 10 profiles.
    - **Premium Subscription:** $20/month for 50,000 tokens + up to 20 profiles.
    - **Enterprise Subscription:** $100/month for 200,000 tokens + 100 profiles.
- **Legal Pages:** Dedicated Privacy Policy and Terms & Conditions pages, accessible via footer links, compliant with app store requirements including third-party service disclosures and data retention policies.

### External Dependencies
- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon)
- **Authentication:** Replit Auth (Google OAuth)
- **AI:** OpenAI gpt-4o-mini
- **Payments:** Stripe
- **ORM:** Drizzle