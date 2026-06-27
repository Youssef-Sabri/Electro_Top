<div align="center">

# Electro Top

**A production-grade e-commerce platform for electrical supplies**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)

</div>

---

## Overview

A full-featured e-commerce platform purpose-built for the electrical supplies market. It enables zero-friction guest shopping — customers browse a catalog, add items to cart, pay via InstaPay, and track orders with a unique ID — all without creating an account. The platform includes a comprehensive admin dashboard for inventory management, order fulfillment, sales analytics, and CSV reporting.

---

## Features

### Storefront
- **Guest checkout** — No registration. Orders tracked via unique alphanumeric tracking ID
- **Shopping cart** — localStorage-persisted with real-time stock-aware quantity limits and price reconciliation
- **InstaPay payments** — Upload receipt screenshot with client-side image compression
- **Order tracking** — Real-time status timeline with itemized invoice
- **Product catalog** — Server-rendered, filterable by category, with search/sort, and real-time stock updates via Supabase Realtime subscriptions
- **Arabic RTL** — Full right-to-left layout with Cairo & Tajawal typography

### Admin Dashboard
- **Sales insights** — Revenue metrics, order status breakdown, inventory health, category sales
- **Order management** — Searchable ledger, status updates, admin notes, status history, invoice printing
- **Inventory CRUD** — Full product management with image upload, category management, CSV export
- **Security** — Supabase Auth gate, inactivity timeout, rate-limited login

### Security
- **CSP with nonces** — Per-request content security policy via middleware
- **CSRF protection** — Origin/referrer validation on all mutating requests
- **Host validation** — DNS rebinding prevention in production
- **Rate limiting** — IP-based limits on login, checkout, and tracking lookups
- **File validation** — Magic-byte detection for uploaded images
- **Server-side price verification** — Database prices always override client-submitted values

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript ^5.8 (strict mode) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL with RLS) |
| Auth | Supabase Auth (email/password, admin only) |
| Validation | Zod ^3.23.8 |
| State Management | React Context (Products, Orders, Cart) |
| Storage | Supabase Storage (private + public buckets) |
| Middleware | Custom middleware for CSP, CSRF, admin route guard |
| Deployment | Vercel |

---

## Project Structure

```
proxy.ts                     # Next.js middleware (CSP, CSRF, admin route guard)
app/                         # App Router pages, layouts, API routes
├── (store)/                 # Public: home, shop, cart, checkout, track, support
├── admin/                   # Admin: dashboard, orders, inventory
└── api/                     # API routes (orders, products, upload, admin)
components/                  # React components organized by domain
├── ui/                      # Reusable: ConfirmationModal, Spinner, Toast, etc.
├── admin/                   # DashboardClient, InventoryClient, OrdersLedger
├── cart/                    # CartClient, CartItem
├── catalog/                 # LandingPage, ProductCard, ShopPageContent
├── checkout/                # CheckoutForm, ConfirmationClient
├── layout/                  # Navbar, Footer, CartReconciler
└── tracking/                # TrackingSearch, TrackingDetailClient, StatusTimeline
context/                     # CartContext, OrdersContext, ProductsContext
hooks/                       # useCart, useOrders, useProducts, usePagination
lib/                         # Supabase clients, Zod validators, utility functions
types/                       # Shared TypeScript interfaces (Product, Order, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with configured database, storage, and auth
- InstaPay merchant account (for payment processing)

### Database Setup

The database schema contains all required tables, triggers, RPCs, storage buckets, and RLS policies. Apply it once via Supabase SQL Editor.

**Migration workflow (for schema changes):**

1. Install Supabase CLI: `npm install -g supabase`
2. Initialize: `supabase init`
3. Pull current schema: `supabase db pull`
4. Copy the setup script to `supabase/migrations/` as a baseline
5. For future changes: edit the DB, run `supabase db diff --linked` to generate a new migration
6. Commit all migration files to git

### Installation

```bash
git clone https://github.com/your-username/electro-top.git
cd electro-top
npm install
```

Edit `.env.local` with your Supabase credentials and store configuration, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Configuration

All configuration is managed through environment variables:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key (server-only, bypasses RLS) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Site URL used for CSP and CSRF origin validation |
| `NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME` | Yes | Merchant name displayed during checkout |
| `NEXT_PUBLIC_INSTAPAY_PHONE` | Yes | InstaPay phone number |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP_1` | No | Primary WhatsApp number for customer support |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP_2` | No | Secondary WhatsApp number |
| `NEXT_PUBLIC_SUPPORT_PHONE_1` | No | Primary support hotline |
| `NEXT_PUBLIC_SUPPORT_PHONE_2` | No | Secondary support hotline |
| `NEXT_PUBLIC_SUPPORT_FACEBOOK` | No | Facebook page URL |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | No | Currency symbol (defaults to EGP) |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint across the codebase |

---

## Admin Panel

Accessible at `/admin`. Authentication is handled by Supabase Auth (email/password). Only users with `app_metadata.role === "admin"` are granted access. The session is verified on every request via admin route guards. Inactivity beyond 55 minutes triggers automatic logout.

---

## Deployment

Designed for deployment on **Vercel**. Add all environment variables from the [Configuration](#configuration) section to your Vercel project settings and deploy.

---

## License

All rights reserved.
