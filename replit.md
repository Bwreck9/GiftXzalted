# Gift Finder - AI-Powered Gift Recommendation App

## Overview
Gift Finder helps users discover the perfect gift for anyone in their life using AI-powered recommendations. Users create detailed profiles for gift recipients, and an AI chatbot provides personalized gift suggestions based on personality, interests, and occasion.

## Current State (MVP)
The application is being built in phases:

### Phase 1: Frontend & Schema (Completed)
- Complete data models for users, profiles, messages, credits, and transactions
- Firebase authentication with Google OAuth
- Beautiful, responsive UI following Material Design 3 principles
- Landing page with profile cards (no-scroll design)
- Profile creation/edit questionnaire form
- AI chat interface with Amazon product link support
- Settings, About, and Pricing pages
- Stripe checkout integration for credits
- Dark mode support

### Phase 2: Backend Implementation (In Progress)
- PostgreSQL database with Drizzle ORM
- RESTful API endpoints for profiles, messages, credits
- OpenAI GPT-5 integration for gift recommendations
- Stripe payment processing
- Input sanitization and character limits

### Phase 3: Integration & Testing (Pending)
- Connect frontend to backend APIs
- End-to-end testing
- Loading states and error handling

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
2. **Profile Management** - Create detailed recipient profiles (age, event, personality, interests)
3. **AI Chat** - Get personalized gift recommendations using OpenAI
4. **Amazon Affiliate Links** - Manual link support (will integrate API later)
5. **Pay-as-you-go Credits** - $5 for query credits via Stripe
6. **Character Limits** - 5,000 character max per message with counter
7. **Chat History** - Persistent conversation storage per profile

## Amazon Integration Notes
- Currently supports manual Amazon affiliate links (short and long format)
- User needs 3 qualifying sales before Amazon Product Advertising API access
- Future: Will integrate Amazon PA API once user qualifies
- Links display as beautiful product cards in chat

## Project Structure
```
client/
  src/
    components/     # Reusable UI components
    contexts/       # React contexts (Auth, Theme)
    lib/            # Utilities (Firebase, API client)
    pages/          # Route components
server/
  routes.ts         # API endpoints
  storage.ts        # Database interface
  db.ts             # Database connection
shared/
  schema.ts         # Drizzle schema & types
```

## Environment Variables
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `OPENAI_API_KEY` - OpenAI API key for GPT-5
- `STRIPE_SECRET_KEY` - Stripe secret key ⚠️ **CURRENTLY TEST KEY - UPDATE TO PRODUCTION BEFORE LAUNCH**
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key ⚠️ **CURRENTLY TEST KEY - UPDATE TO PRODUCTION BEFORE LAUNCH**
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret ⚠️ **CURRENTLY TEST KEY - UPDATE TO PRODUCTION BEFORE LAUNCH**
- `DATABASE_URL` - PostgreSQL connection string

## ⚠️ IMPORTANT: Production Deployment Checklist
Before going live with real customers:
1. **Replace ALL Stripe test keys with production keys:**
   - Update `STRIPE_SECRET_KEY` (remove `sk_test_` → use `sk_live_`)
   - Update `VITE_STRIPE_PUBLIC_KEY` (remove `pk_test_` → use `pk_live_`)
   - Create NEW webhook endpoint in Stripe for production URL
   - Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
2. **Update Firebase authorized domains** to include your production domain
3. **Test payment flow end-to-end** in Stripe test mode first
4. **Enable Stripe webhook monitoring** in production dashboard

## Design System
Following Material Design 3 principles:
- Primary color: Blue (#0080FF) for trust and reliability
- Inter font family for clean, modern typography
- 44px minimum touch targets for mobile
- Consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
- Elevation system using hover-elevate/active-elevate-2 utilities
- Full dark mode support

## Monetization
Pay-as-you-go model:
- $5 for query credits (one-time purchase)
- 1 credit per AI query
- Credits never expire
- Future: Subscription tier for unlimited queries

## Recent Changes
- Initial project setup with complete frontend
- Firebase Google OAuth integration
- Stripe payment checkout flow
- All page components built with accessibility in mind
