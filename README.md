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
| **Arabic RTL** | Full right-to-left layout with Arabic-optimized typography (Montserrat & Poppins fonts) |
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
| **Auth-Gated Access** | Supabase Auth (email/password) + server-side route protection via `middleware.ts` routing to `proxy.ts` |

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
| **Fonts** | Montserrat (headings) & Poppins (body) via `next/font` | — |
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
│  │ middleware.ts & proxy.ts ← Admin route protection  │  │
│  │            (redirects unauthenticated /admin/* reqs)│  │
│  │  API routes for checkout, products, categories    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
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
- **SECURITY DEFINER RPC** — Order tracking uses a PostgreSQL function (`get_order_details_for_tracking`) for targeted read access.
- **Database-level stock automation** — PostgreSQL triggers handle inventory deductions/restorations.
- **Optimistic UI** — UI updates before database confirmation for cart mutations and status changes.
- **Client-side image compression** — Receipts are compressed using the Canvas API before upload.

---

## 📁 Project Structure

```
electro-top/
├── middleware.ts                   # Next.js 16 middleware entrypoint
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
│   ├── audit-log.ts                # Admin action audit logger (Supabase-based)
│   ├── constants.ts                # Shared constants (removed - inlined to consumers)
│   ├── csv-export.ts               # Excel-safe CSV exporter (CSV injection mitigated)
│   ├── csrf.ts                     # Origin/referer CSRF validation
│   ├── fetch-catalog.ts            # Shared Supabase catalog fetch helper
│   ├── format-currency.ts          # EGP currency formatter
│   ├── get-order-detail.ts         # Order detail view fetch (RPC + fallback)
│   ├── id-generator.ts             # Modulo-bias-free 10-char alphanumeric ID generator
│   ├── image-utils.ts              # Canvas API image compression & Supabase storage helpers
│   ├── safe-url.ts                 # URL protocol safety validator
│   ├── string-utils.ts             # Status translation & initials extraction
│   ├── supabase-server-cookies.ts  # Shared cookie-based server Supabase client helper
│   ├── supabase-server.ts          # Supabase server client factory (`createServerClient`)
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

This project has security measures in place. Key security areas include:

| Category | Implementation |
|---|---|
| **Server-side route protection** | `middleware.ts` and `proxy.ts` provide basic admin route protection |
| **CSV injection** | CSV export has some protection against injection |
| **XSS prevention** | Basic XSS prevention measures |
| **Content Security Policy** | Basic CSP headers implemented |
| **Security headers** | Basic security headers configured |
| **Order rate limiting** | Database-level rate limiting for phone numbers |
| **Admin login rate limiting** | Basic rate limiting on admin login |
| **ID generation** | Alphanumeric ID generation for tracking |
| **Server-side order validation** | PostgreSQL triggers for order validation |
| **URL sanitization** | Basic URL validation |
| **Receipt filenames** | Random receipt filenames |
| **User-submitted links** | Basic link attributes |
| **Production logging** | Guarded console.error calls |
| **Storage pagination** | Pagination for storage operations |
| **DB constraints** | Database-level constraints for data integrity |

**Note:** This is a production e-commerce platform with security measures, but it has not undergone a comprehensive security audit. Additional security hardening may be required for production deployment.

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

# Admin Access Configuration (server-only — NOT prefixed with NEXT_PUBLIC_)
ADMIN_EMAIL=admin@example.com

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
| **Heading Font** | Montserrat (700/800) | Bold Arabic/Latin headings |
| **Body Font** | Poppins (400/500/600) | Readable Arabic body text |

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

2. **Database owns the truth** — Stock levels, order validation, and rate limiting are enforced at the PostgreSQL layer via triggers and CHECK constraints.

3. **SECURITY DEFINER RPC for tracking** — Public order tracking uses a Postgres function for targeted read access.

4. **Hybrid SSR + CSR** — The product catalog is server-rendered for SEO and fast LCP. Admin pages are client-side loaded after auth validation.

5. **Canvas API image compression** — InstaPay receipt images are compressed client-side before upload.

6. **Print-safe invoice** — The printable invoice uses React inline style objects for reliable cross-browser print rendering.

7. **Atomic order creation** — Order creation ensures data integrity with proper error handling.

---

<div align="center">

**Built with ❤️ for Electro Top**  
*Powered by Next.js · Supabase · TypeScript*

</div>
