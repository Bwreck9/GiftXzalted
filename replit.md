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
- **Navigation:** Hierarchical navigation with "Back to profiles" button in ProfileDetail and "Back" button in GiftListDetail. Clickable logo for homepage navigation and accessible footer with legal links.
- **Character Limits:** Profile names and list names limited to 20 characters (enforced in frontend maxLength and backend schema validation).
- **Components:** Reusable UI components for consistent design, Settings gear icons for list options.
- **Welcome Experience:** A closeable splash screen explains app features, with a footer button to reopen.
- **Profile System:** Questionnaire-based profiles for AI training.
- **Gift List Management:** 
  - Separated "Gift Ideas" (manual entries) and "Generated Ideas" (AI recommendations) sections
  - Settings dropdown menu for list operations (rename, delete)
  - "Add to list" functionality to promote AI suggestions to manual gift list
  - "Generate ideas" button for AI recommendations (500 tokens per generation)
  - Empty state messaging ("No generations yet") when AI recommendations haven't been created

**Technical Implementations & Feature Specifications:**
- **Authentication:** Replit Auth with Google OAuth (session-based, cookie authentication).
- **Database:** PostgreSQL with Drizzle ORM, storing users, sessions, profiles, gift_lists, messages, tokens, and transactions.
- **Core Hierarchy:** Profiles (`profiles` table) represent individuals (e.g., "Mom"), Gift Lists (`gift_lists` table) represent occasions (e.g., "Birthday") and contain both manual and AI-generated gift ideas.
- **Token System:** Implemented for AI recommendations (500 tokens per generation), with various purchase and subscription models.
- **Payment Processing:** Secure Stripe integration with webhook signature verification for token and subscription purchases.
- **AI Integration:** Utilizes OpenAI GPT-5 for generating personalized gift recommendations based on user-provided profile data.
- **API Endpoints:**
    - `GET/POST /api/profiles`: List/create profiles.
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
    - **Enterprise Subscription:** $100/month for 200,000 tokens + unlimited profiles.
- **Legal Pages:** Dedicated Privacy Policy and Terms & Conditions pages, accessible via footer links, compliant with app store requirements including third-party service disclosures and data retention policies.

### External Dependencies
- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon)
- **Authentication:** Replit Auth (Google OAuth)
- **AI:** OpenAI GPT-5
- **Payments:** Stripe
- **ORM:** Drizzle