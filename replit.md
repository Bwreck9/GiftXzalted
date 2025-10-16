# Gift Spark - AI-Powered Gift Recommendation App

## Overview
Gift Spark helps users discover the perfect gift for anyone in their life. Users can create free gift lists, build detailed profiles, and optionally use AI-powered recommendations to get personalized gift suggestions based on personality, interests, and occasion.

## Current State (Phase 1 MVP Complete)

### ✅ Completed Features
- **Authentication**: Replit Auth with Google OAuth (session-based, cookie authentication)
- **Database**: PostgreSQL with token-based system (users, sessions, profiles, messages, tokens, transactions, gift_lists, gift_items)
- **FREE Gift Lists**: Notepad-style lists with create/edit/delete/reorder items (no cost)
- **Profile System**: Up to 5 free profiles, questionnaire-based with optional AI generation
- **Token System**: 
  - One-time purchase: $5 for 5,000 tokens (never expires)
  - Basic subscription: $5/month for 10,000 tokens
  - Premium subscription: $20/month for 50,000 tokens
  - Each AI generation costs 500 tokens
- **Stripe Payments**: Secure checkout with webhook signature verification
- **UI/UX**: Material Design 3 with gradient styling, responsive design, dark mode
- **Welcome Dialog**: Closeable splash explaining app features with X close button and reopenable "Splash" footer button
- **Legal Pages**: Privacy Policy and Terms & Conditions pages with app store compliance
  - Third-party services disclosure (Google, OpenAI, payment processors)
  - Data retention policies
  - Contact information (support@xzalted.com)
  - Accessible footer links on all pages
- **Navigation**: Consistent "Back to Home" buttons across pages

### 🎉 Major UX Simplification Complete (October 15, 2025)
**Focus: "Most simple execution ever for the customer"**

- **Landing Page** (`/`):
  - ✅ "Create New Gift List" button opens name-only dialog
  - ✅ Minimal profile creation with just a name
  - ✅ Auto-navigation to gift list detail after creation
  - ✅ Existing gift lists displayed as scrollable tiles
  
- **Gift List Detail Page** (`/profile/:id`):
  - ✅ **5+ Manual Text Boxes**: Editable gift idea inputs (expandable)
  - ✅ **GEAR Button**: Delete confirmation with "Please confirm that you want to delete your profile"
  - ✅ **GENERATE RESPONSES Button**: Triggers AI generation
  - ✅ **Questionnaire Check**: Shows dialog if questionnaire not filled
  - ✅ **AI Results**: Displayed as read-only text boxes with gift + reason format
  - ✅ Auto-save manual ideas with debounce
  
- **Questionnaire Dialog** (`QuestionnaireDialog.tsx`):
  - ✅ Appears when user clicks GENERATE RESPONSES without questionnaire data
  - ✅ Embedded form for filling profile details (age, gender, event, etc.)
  - ✅ Saves profile and immediately triggers AI generation
  - ✅ Closes automatically after successful submission
  
- **Schema Updates** (`shared/schema.ts`):
  - ✅ Made all profile fields optional except `name`
  - ✅ Supports minimal profile creation (name only)
  - ✅ Questionnaire required only for AI generation
  
- **Backend Validation** (`server/routes.ts`):
  - ✅ Validates questionnaire fields before AI generation
  - ✅ Returns proper error if questionnaire incomplete
  - ✅ Handles optional profile fields correctly

**User Flow:**
1. Landing → "Create New Gift List" → Enter name → Navigate to gift list
2. Gift list → Add manual ideas (5+ text boxes) → Auto-saved
3. Click "GENERATE RESPONSES" → If no questionnaire, show dialog → Fill → AI generates
4. AI recommendations displayed below manual ideas

### 📝 Phase 3 Features (Disabled/Commented Out)
- Amazon affiliate links (parseAmazonLinks, AmazonProductCard)
- Amazon Product Advertising API integration
- Link detection in AI responses

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: Replit Auth (Google OAuth, session-based)
- **AI**: OpenAI GPT-5
- **Payments**: Stripe
- **ORM**: Drizzle

## Key Features
1. **Google Authentication** - Secure sign-in with Replit Auth (session-based cookies)
2. **Free Gift Lists** - Manual tracking with drag-and-drop reordering
3. **Profile Management** - Create detailed recipient profiles (up to 5 free)
4. **Optional AI Recommendations** - Premium feature using OpenAI (500 tokens per generation)
5. **Token-Based Pricing** - Pay-as-you-go or subscription model
6. **Beautiful UI** - Gradient design system with primary → purple → pink colors

## Pricing Model
- **Free Tier**: 5 profiles, unlimited gift lists
- **One-Time**: $5 for 5,000 tokens (never expires)
- **Basic Subscription**: $5/month for 10,000 tokens (~20 AI generations)
- **Premium Subscription**: $20/month for 50,000 tokens (~100 AI generations)

## Project Structure
```
client/
  src/
    components/     # Reusable UI components (WelcomeDialog, ThemeToggle, etc.)
    contexts/       # React contexts (Theme)
    hooks/          # Custom hooks (useAuth)
    lib/            # Utilities (authUtils, API client)
    pages/          # Route components (Landing, About, Pricing, ProfileForm, etc.)
server/
  routes.ts         # API endpoints
  storage.ts        # Database interface
  db.ts             # Database connection
  replitAuth.ts     # Replit Auth integration
  openai.ts         # OpenAI integration
shared/
  schema.ts         # Drizzle schema & types
```

## Environment Variables
- `OPENAI_API_KEY` - OpenAI API key for GPT-5
- `STRIPE_SECRET_KEY` - Stripe secret key ⚠️ **CURRENTLY TEST KEY**
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key ⚠️ **CURRENTLY TEST KEY**
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret ⚠️ **CURRENTLY TEST KEY**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret (auto-generated)

## ⚠️ IMPORTANT: Production Deployment Checklist
Before going live:
1. **Replace ALL Stripe test keys with production keys**
2. **Create Stripe products** for token packages and subscriptions
3. **Test payment flow end-to-end** in test mode first
4. **Enable Stripe webhook monitoring**

## Design System
- **Colors**: Primary blue → Purple → Pink gradient theme
- **Font**: Inter for clean, modern typography
- **Touch targets**: 44px minimum for mobile
- **Spacing**: Consistent scale (4px, 8px, 12px, 16px, 24px, 32px)
- **Elevation**: hover-elevate/active-elevate-2 utilities
- **Dark mode**: Full support across all pages

## Recent Changes (October 16, 2025)

### 🎨 UI/UX Polish & Navigation Updates ✅
**Focus: Improved navigation, token visibility, and welcome experience**

- **Welcome Dialog Updates** (`WelcomeDialog.tsx`):
  - ✅ Updated "Train AI Agent" subcaption to "Submit a questionnaire to customize the recipient profile"
  - ✅ Grayed out "Web Search Agent" tile with opacity-50 and cursor-not-allowed (in development)
  - ✅ Added "(In Development)" text to Web Search Agent description

- **Landing Page Improvements** (`Landing.tsx`):
  - ✅ Fixed duplicate "Create New Gift List" buttons (removed duplicate in empty state)
  - ✅ Made Gift Spark logo clickable to navigate back to landing page
  - ✅ Added token counter button in header (clickable, navigates to pricing page)
  - ✅ Token counter displays: "X tokens" with Coins icon

- **My Gift Lists Page** (`GiftLists.tsx`):
  - ✅ Added back navigation button (ArrowLeft icon) to return to landing page
  - ✅ Improved header layout with back button on left

### 🎉 Onboarding Flow Complete ✅
**Focus: Simplified user journey from welcome to first profile**

- **Welcome Dialog** (`WelcomeDialog.tsx`):
  - ✅ Single "Get Started" button navigates to `/onboarding`
  - ✅ Agentic messaging: "The Agentic Gift Experience"
  - ✅ Interactive feature tiles (non-functional in dialog, preserved for visual interest)
  
- **Onboarding Page** (`/onboarding`):
  - ✅ **3-Step Visual Guide**: Shows app workflow
    1. Create Profile → Manual gift tracking
    2. Train Agent → Fill questionnaire for AI recommendations
    3. Web Search → Coming soon feature
  - ✅ **Interactive Buttons**: Each step has action button
  - ✅ Gift Tracker → Auto-creates profile with unique name, navigates to detail page
  - ✅ Train Agent → Token check, creates profile + opens questionnaire
  - ✅ Web Search → Coming soon state
  
- **Simplified Flow**:
  - ✅ Welcome → Get Started → Onboarding → Choose action
  - ✅ Non-authenticated users → Redirected to sign-in
  - ✅ Token-gated AI: Redirects to pricing if user has 0 tokens
  - ✅ Profile creation uses auto-generated names (Profile 1, Profile 2, etc.)

### 🔐 Firebase to Replit Auth Migration ✅
**Reason**: Firebase auth was failing on mobile browsers (Safari/Chrome iOS) and incurring unnecessary costs

- **Backend Migration**:
  - Created `server/replitAuth.ts` with OIDC integration
  - Updated database schema: users table fields renamed (displayName→firstName, photoURL→profileImageUrl, credits→tokens)
  - Added sessions table for cookie-based authentication
  - Updated all routes with `isAuthenticated` middleware
  - Created `upsertUser` in storage.ts for user management
  
- **Frontend Migration**:
  - Removed Firebase completely (AuthContext, firebase.ts, firebase-admin.ts deleted)
  - Created new `useAuth` hook with Replit Auth integration
  - Created `authUtils.ts` for authentication utilities
  - Updated all pages (Landing, Questionnaire, Pricing, Chat, Settings, GiftLists, GiftListDetail)
  - Switched to cookie-based session authentication (no Authorization headers)
  
- **Auth Flow**:
  - Login: POST `/api/login` (redirects to Replit OAuth)
  - Logout: POST `/api/logout`
  - Current user: GET `/api/auth/user`
  - Session cookies handle authentication automatically
  - Mobile OAuth fix: Added `sameSite: 'lax'` to session cookies for mobile compatibility

## Recent Changes (October 15, 2025)

### Major Redesign Complete ✅
- **Questionnaire Page**: Transformed to support unauthenticated access with localStorage draft persistence, auth modal on submit, and token gate modal for AI generation
- **Profile Detail Page**: Complete redesign with colored gradient header, collapsible manual ideas section (add/remove), collapsible AI recommendations section (copy to clipboard), and clear data functionality
- **Profiles List Page**: Built comprehensive list view with profile cards, manual ideas count badge, AI indicator, and click-to-view navigation
- **Backend API**: Added POST `/api/profiles/:id/clear` endpoint for clearing profile data
- **Copy to Clipboard**: Created reusable hook with toast notifications
- **Bug Fix**: Landing page delete action now properly calls mutation (was previously TODO)

### Earlier Updates
- Created Privacy Policy (/privacy) and Terms & Conditions (/terms) pages for app store compliance
- Added third-party services disclosure and data retention policies
- Integrated legal page links in footer across all screens
- Enhanced welcome splash with X close button and "Splash" footer button for reopening
- Rebranded from "Xzalted" to "Gift Spark"
- Updated welcome splash with gradient design and simplified messaging
- Redesigned Pricing and About pages with consistent navigation
- Migrated from credits to tokens system
- Added subscription support in database schema
- Commented out Amazon features for Phase 3
- Updated questionnaire form with dual submission buttons

## User Preferences
- Material Design 3 aesthetic
- Gradient color scheme (blue → purple → pink)
- Clean, minimal interface
- Fast and simple user experience
