# Gift Spark - AI-Powered Gift Recommendation App

## Overview
Gift Spark helps users discover the perfect gift for anyone in their life. Users can create free gift lists, build detailed profiles, and optionally use AI-powered recommendations to get personalized gift suggestions based on personality, interests, and occasion.

## Current State (Phase 1 MVP in Progress)

### ✅ Completed Features
- **Authentication**: Firebase Google OAuth with secure token verification
- **Database**: PostgreSQL with token-based system (users, profiles, messages, tokens, transactions, gift_lists, gift_items)
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

### 🚧 In Progress
- **Profile Page Redesign**: Converting from chat interface to notepad-style with:
  - Manual notes section (top, collapsible)
  - AI response section (bottom, collapsible)
  - "Generate Response" button (costs 500 tokens)
- **Stripe Product Setup**: Creating products for token packages and subscriptions
- **Route Updates**: Changing /chat/:id to /profile/:id

### 📝 Phase 3 Features (Disabled/Commented Out)
- Amazon affiliate links (parseAmazonLinks, AmazonProductCard)
- Amazon Product Advertising API integration
- Link detection in AI responses

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: Firebase (Google OAuth)
- **AI**: OpenAI GPT-5
- **Payments**: Stripe
- **ORM**: Drizzle

## Key Features
1. **Google Authentication** - Secure sign-in with Firebase
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
    contexts/       # React contexts (Auth, Theme)
    lib/            # Utilities (Firebase, API client)
    pages/          # Route components (Landing, About, Pricing, ProfileForm, etc.)
server/
  routes.ts         # API endpoints
  storage.ts        # Database interface
  db.ts             # Database connection
  openai.ts         # OpenAI integration
shared/
  schema.ts         # Drizzle schema & types
```

## Environment Variables
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `OPENAI_API_KEY` - OpenAI API key for GPT-5
- `STRIPE_SECRET_KEY` - Stripe secret key ⚠️ **CURRENTLY TEST KEY**
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key ⚠️ **CURRENTLY TEST KEY**
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret ⚠️ **CURRENTLY TEST KEY**
- `DATABASE_URL` - PostgreSQL connection string

## ⚠️ IMPORTANT: Production Deployment Checklist
Before going live:
1. **Replace ALL Stripe test keys with production keys**
2. **Update Firebase authorized domains** to production domain
3. **Create Stripe products** for token packages and subscriptions
4. **Test payment flow end-to-end** in test mode first
5. **Enable Stripe webhook monitoring**

## Design System
- **Colors**: Primary blue → Purple → Pink gradient theme
- **Font**: Inter for clean, modern typography
- **Touch targets**: 44px minimum for mobile
- **Spacing**: Consistent scale (4px, 8px, 12px, 16px, 24px, 32px)
- **Elevation**: hover-elevate/active-elevate-2 utilities
- **Dark mode**: Full support across all pages

## Recent Changes (October 15, 2025)
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
