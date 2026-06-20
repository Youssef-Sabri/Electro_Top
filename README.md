<div align="center">

# ⚡ Electro Top — إلكترو توب

**A premium Arabic-first electrical supplies e-commerce platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.7-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-Private-red)](/)

> الموزع المعتمد لمنتجات السويدي، شنايدر، سيمنز، هيميل، جيويس، وشينت.  
> *Authorized distributor for El-Sewedy, Schneider, Siemens, Hager, Gewiss & Chint.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Order Lifecycle](#-order-lifecycle)
- [Security](#-security)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Design System](#-design-system)
- [Routes Reference](#-routes-reference)
- [Key Design Decisions](#-key-design-decisions)

---

## 🌟 Overview

**Electro Top** is a production-ready, Arabic RTL e-commerce platform built for electrical supplies retail. It enables **zero-friction guest shopping** — customers browse, add to cart, checkout via InstaPay, and track their orders using a unique alphanumeric tracking ID — all without ever creating an account.

The platform is backed by a fully featured **Admin Dashboard** where store administrators can manage inventory, fulfill orders, update statuses, add notes, and print invoices — all behind a Supabase-authenticated gate.

The project went through **7 development phases** from initial mock infrastructure to a fully security-hardened production deployment on Supabase.

---

## ✨ Features

### 🛍️ Customer-Facing

| Feature | Description |
|---|---|
| **Product Catalog** | Browse, search, filter by category, and sort electrical supplies with pagination |
| **Shopping Cart** | Persistent cart via `localStorage` with stock-aware quantity limits |
| **Guest Checkout** | No account required — checkout with name, phone, address, and Google Maps link |
| **InstaPay Payment** | Upload receipt screenshot (auto-compressed to ~1 MB via Canvas API, 5 MB raw limit) |
| **Order Confirmation** | Prominent 10-character tracking ID (e.g. `ET-X8F9K4P2W3`) with clipboard copy |
| **Order Tracking** | Real-time order status with an interactive vertical timeline and itemized invoice |
| **Customer Support** | Dedicated support page with direct WhatsApp contact link |
| **Arabic RTL** | Full right-to-left layout with Arabic-optimized typography (Cairo & Tajawal fonts) |
| **Responsive Design** | Mobile-first; fully functional from 375px and above |

### 🔐 Admin Dashboard

| Feature | Description |
|---|---|
| **Insights Dashboard** | Sales analytics, revenue metrics, top products, and recent orders overview |
| **Orders Ledger** | Searchable/filterable order table with status badges |
| **Order Detail** | Split-pane view with line items, customer info, InstaPay receipt viewer (signed URL), and status control |
| **Admin Notes** | Private internal notes per order (max 2000 chars) |
| **Status Management** | Dropdown status updates with full history log |
| **Printable Invoice** | Monochrome boxed invoice (210mm wide, reliable cross-browser print) |
| **Inventory CRUD** | Full Create / Read / Update / Delete for products |
| **Category Management** | Dynamic category add/delete with automatic product reassignment |
| **CSV Export** | Export product catalog as Excel-safe CSV |
| **Auth-Gated Access** | Supabase Auth (email/password) + server-side route protection via `proxy.ts` |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | `16.2.7` |
| **Language** | TypeScript (strict mode, zero `any`) | `^5` |
| **Styling** | Tailwind CSS v4 | `^4` |
| **Database** | Supabase — PostgreSQL with RLS | `^2.108.1` |
| **Auth** | Supabase Auth (email/password, admin only) | `@supabase/ssr ^0.12.0` |
| **Validation** | Zod | `^4.4.3` |
| **State Management** | React Context (Products, Orders, Cart) | — |
| **Icons** | Google Material Symbols Outlined | CDN |
| **Fonts** | Cairo (headings) & Tajawal (body) via `next/font` | — |
| **Runtime** | Node.js | `18+` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ ProductsCtx  │  │  CartCtx   │  │   OrdersCtx     │  │
│  │  (Supabase)  │  │(localStorage│  │  (Supabase)     │  │
│  └──────────────┘  └────────────┘  └─────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│               Next.js Server (App Router)                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  proxy.ts  ←  Server-side admin route protection   │  │
│  │            (redirects unauthenticated /admin/* reqs)│  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Supabase Client
┌────────────────────────▼────────────────────────────────┐
│                    Supabase (BaaS)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PostgreSQL  │  │     Auth     │  │    Storage    │  │
│  │  + RLS + RPC │  │ (Admin Only) │  │(InstaPay Imgs)│  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Guest-first model** — No user registration. Orders tracked via a unique, high-entropy 10-char alphanumeric ID.
- **Hybrid data loading** — Public pages are SSR (catalog fetched server-side); admin pages load client-side after auth validation.
- **SECURITY DEFINER RPC** — Order tracking uses a PostgreSQL function (`get_order_details_for_tracking`) that bypasses table-level RLS, granting only targeted read access to the public.
- **Database-level stock automation** — PostgreSQL triggers handle all inventory deductions/restorations on order events. The frontend performs no stock mutations.
- **Optimistic UI** — Cart mutations and status changes update the UI before the database confirms.
- **Client-side image compression** — Receipts are compressed using the Canvas API before upload, ensuring consistent cross-browser behavior (including HEIC/HEIF from iPhones).

---

## 📁 Project Structure

```
electro-top/
├── proxy.ts                        # Next.js 16 server-side proxy (admin route guard)
├── app/
│   ├── layout.tsx                  # Root layout (RTL, fonts, context providers)
│   ├── page.tsx                    # Homepage landing
│   ├── globals.css                 # Global styles & design tokens
│   ├── shop/page.tsx               # Product catalog
│   ├── cart/page.tsx               # Cart review
│   ├── checkout/
│   │   ├── page.tsx                # Checkout form (Zod-validated)
│   │   └── confirmation/page.tsx   # Order confirmation + tracking ID
│   ├── track/
│   │   ├── page.tsx                # Tracking ID search
│   │   └── [id]/page.tsx           # Order status dashboard
│   ├── support/page.tsx            # Customer support page
│   └── admin/
│       ├── layout.tsx              # Admin auth gate layout
│       ├── page.tsx                # Admin insights dashboard
│       ├── inventory/page.tsx      # Product inventory CRUD
│       └── orders/
│           ├── page.tsx            # Orders ledger
│           └── [id]/page.tsx       # Order detail & management
├── components/
│   ├── ui/                         # ConfirmationModal, CustomDropdown, Spinner, Toast
│   ├── layout/                     # Navbar, Footer, NavbarAndFooterWrapper
│   ├── catalog/                    # LandingPage, ProductCard, ProductDetailsModal
│   ├── cart/                       # CartClient, CartItem
│   ├── checkout/                   # CheckoutForm, ConfirmationClient
│   ├── tracking/                   # StatusTimeline, TrackingSearch, TrackingDetailClient
│   └── admin/                      # DashboardClient, OrdersLedger, OrderDetailClient, InventoryClient
├── context/
│   ├── CartContext.tsx             # Cart state + localStorage persistence
│   ├── OrdersContext.tsx           # Orders state + Supabase integration
│   └── ProductsContext.tsx         # Products state + Supabase integration
├── hooks/
│   ├── useCart.ts                  # Cart context consumer hook
│   ├── useOrders.ts                # Orders context consumer hook
│   ├── usePagination.ts            # Shared pagination logic
│   └── useProducts.ts              # Products context consumer hook
├── lib/
│   ├── csv-export.ts               # Excel-safe CSV exporter (CSV injection mitigated)
│   ├── fetch-catalog.ts            # Shared Supabase catalog fetch helper
│   ├── format-currency.ts          # EGP currency formatter
│   ├── id-generator.ts             # Modulo-bias-free 10-char alphanumeric ID generator
│   ├── image-utils.ts              # Canvas API image compression & Supabase storage helpers
│   ├── string-utils.ts             # Initials extraction utility
│   ├── supabase.ts                 # Supabase browser client (`createBrowserClient`)
│   └── validators.ts               # Zod validation schemas (checkout, products)
├── types/
│   └── index.ts                    # All TypeScript interfaces (Product, Order, CartItem, etc.)
├── public/                         # Static assets
├── next.config.ts                  # Next.js configuration (CSP, security headers, image CDN)
├── tsconfig.json                   # TypeScript configuration
└── package.json
```

---

## 🗄️ Database Schema

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Product display name |
| `description` | `text` | Max 2000 chars (DB CHECK constraint) |
| `price` | `numeric` | Price in EGP |
| `image_url` | `text` | Supabase Storage CDN URL |
| `stock` | `integer` | Managed by DB triggers |
| `is_active` | `boolean` | Visibility toggle |
| `category` | `text` | Dynamic category label |
| `created_at` | `timestamptz` | Auto-generated |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id_unique_tracking` | `text` | PK — e.g. `ET-X8F9K4P2W3` |
| `status` | `text` | See [Order Lifecycle](#-order-lifecycle) |
| `customer_name` | `text` | — |
| `phone_number` | `text` | Rate-limited: max 3 orders / 15 min |
| `shipping_address` | `text` | — |
| `total_amount` | `numeric` | — |
| `admin_notes` | `text` | Max 2000 chars (DB CHECK constraint) |
| `location_link` | `text` | Optional — Google Maps URL |
| `instapay_screenshot` | `text` | Optional — private bucket URL |
| `instapay_phone_number` | `text` | Optional — customer InstaPay number |
| `created_at` | `timestamptz` | Auto-generated |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `order_id` | `text` | FK → `orders.id_unique_tracking` |
| `product_id` | `uuid` | FK → `products.id` |
| `quantity` | `integer` | — |
| `unit_price` | `numeric` | Price at time of purchase |

### `order_status_history`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `order_id` | `text` | FK → `orders.id_unique_tracking` |
| `status` | `text` | — |
| `timestamp` | `timestamptz` | When the status change occurred |

---

## 🔄 Order Lifecycle

```
                    ┌─────────────────┐
                    │  Pending Review  │  ← Initial state on order creation
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────────┐
              ▼              ▼                   ▼
         ┌─────────┐  ┌──────────────────┐  ┌─────────┐
         │Accepted │  │Check Internal Note│  │Declined │ (terminal)
         └────┬────┘  └──────────────────┘  └─────────┘
              │
              ▼
        ┌────────────┐
        │ Processing │
        └─────┬──────┘
              │
              ▼
        ┌───────────┐
        │ Delivered │  (terminal)
        └───────────┘
```

**Valid Status Values:** `Pending Review` · `Accepted` · `Processing` · `Delivered` · `Declined` · `Check Internal Note`

> Stock is automatically **deducted** when an order is placed and **restored** when an order is `Declined` — all via PostgreSQL triggers. No frontend stock mutations occur.

---

## 🔒 Security

This project underwent a dedicated **Phase 7 — Security Hardening** audit. Mitigations applied:

| Category | Implementation |
|---|---|
| **Server-side route protection** | `proxy.ts` uses `@supabase/ssr` `createServerClient` to redirect unauthenticated `/admin/*` requests and enforce admin email restriction (configured via environment variables) |
| **CSV injection** | Cells starting with `=`, `+`, `-`, `@` are force-quoted in CSV exports |
| **XSS prevention** | Replaced `document.write` with safe DOM API; `dangerouslySetInnerHTML` removed |
| **Content Security Policy** | Hardened CSP: `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` |
| **Security headers** | HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy |
| **Order rate limiting** | DB trigger: max 3 orders per phone number per 15 minutes |
| **Admin login rate limiting** | Server-side enforced: max 5 failed attempts per minute per IP, then 60-second cooldown with visible countdown |
| **ID generation bias** | Modulo-bias-free rejection sampling for tracking IDs |
| **Server-side order validation** | PostgreSQL trigger validates required fields and minimum lengths |
| **URL sanitization** | Zod `.refine()` protocol allowlist — rejects non-`http(s)` URLs |
| **Receipt filenames** | 6-char `crypto.getRandomValues` suffix prevents predictable collisions |
| **User-submitted links** | All `location_link` anchors carry `rel="noopener noreferrer nofollow"` |
| **Production logging** | All `console.error` calls guarded with `NODE_ENV !== 'production'` |
| **Storage pagination** | `clearBucket` loops with `limit: 100` offset to handle >100 files |
| **DB constraints** | `admin_notes` and `description` max 2000 chars enforced at DB level |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `18+`
- **npm** `9+`
- A **[Supabase](https://supabase.com/)** project with the following tables created:
  - `products`, `categories`, `orders`, `order_items`, `order_status_history`
  - SECURITY DEFINER RPC: `get_order_details_for_tracking`
  - PostgreSQL triggers for stock management and rate limiting
  - Supabase Auth enabled (email/password)
  - Storage bucket: `instapay-receipts` (private), `product-images` (public)

> See `ProjectMD-files/supabase-setup-prd.md` for the full SQL migration and setup instructions.

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/electro-top.git
cd electro-top

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Project URL & Anon Key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Admin Access Configuration
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com

# InstaPay Payment Configuration
NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME=Your Store Name
NEXT_PUBLIC_INSTAPAY_PHONE=01000000000

# Support Contact Details
NEXT_PUBLIC_SUPPORT_WHATSAPP=201000000000
NEXT_PUBLIC_SUPPORT_PHONE=+201000000000
NEXT_PUBLIC_SUPPORT_FACEBOOK=https://www.facebook.com/yourpage
```

> **Note:** The anon key and public configuration variables are safe to expose publicly — Supabase Row Level Security (RLS) policies and SECURITY DEFINER functions control all data access. No private keys or personal identifiers should be committed to source code.

---

## 📜 Available Scripts

```bash
# Start development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

---

## 🎨 Design System

The UI is anchored to **Electro Top's** brand identity — red, gold, and charcoal.

| Token | Value | Usage |
|---|---|---|
| `brand-red` | `#CA202B` | Primary CTAs, highlights, geometric accents |
| `brand-red-dark` | `#A01820` | Hover states for primary actions |
| `brand-gold` | `#C6B254` | Prices (EGP), tracking IDs, premium elements |
| `background` | `#fff8f7` | Main canvas (warm soft tint) |
| `surface` | `#ffffff` | Cards, modals, dropdowns |
| `on-surface` | `#271716` | Body text, descriptions, labels |
| **Heading Font** | Cairo (700/800/900) | Bold Arabic/Latin headings |
| **Body Font** | Tajawal (400/500/700) | Readable Arabic body text |

---

## 🗺️ Routes Reference

### Public Routes

| Route | Description |
|---|---|
| `/` | Homepage landing with hero section |
| `/shop` | Product catalog with search, filter & pagination |
| `/cart` | Cart review with quantity adjusters |
| `/checkout` | Guest checkout form (Zod-validated) |
| `/checkout/confirmation` | Order confirmation with tracking ID |
| `/track` | Tracking ID search portal |
| `/track/[id]` | Order status timeline & itemized invoice |
| `/support` | Customer support & WhatsApp contact |

### Admin Routes (Auth-Gated)

| Route | Description |
|---|---|
| `/admin` | Sales insights & analytics dashboard |
| `/admin/orders` | Orders ledger with search & status filters |
| `/admin/orders/[id]` | Order detail, status management & invoice print |
| `/admin/inventory` | Full product CRUD & category management |

---

## 💡 Key Design Decisions

1. **Guest-first checkout** — No registration friction. Any customer can order and track via their unique `ET-XXXXXXXXXX` ID.

2. **Database owns the truth** — Stock levels, order validation, and rate limiting are all enforced at the PostgreSQL layer via triggers and CHECK constraints. The frontend cannot manipulate these.

3. **SECURITY DEFINER RPC for tracking** — Public order tracking uses a Postgres function that bypasses RLS, granting exactly the data needed for the tracking page — nothing more.

4. **Hybrid SSR + CSR** — The product catalog is server-rendered for SEO and fast LCP. Admin pages are client-side loaded only after Supabase session validation.

5. **Canvas API image compression** — InstaPay receipt images are compressed client-side before upload using `createImageBitmap` + canvas resize, with explicit HEIC/HEIF support for iPhone users, avoiding heavy third-party libraries.

6. **Print-safe invoice** — The printable invoice uses React inline style objects (not Tailwind) for reliable cross-browser print rendering, with `@page { margin: 0 }` suppressing browser headers/footers.

7. **Atomic order creation** — `createOrder` is async and throws on item/history insert failures, preventing orphaned orders with no line items in the database.

---

<div align="center">

**Built with ❤️ for Electro Top**  
*Powered by Next.js · Supabase · TypeScript*

</div>
