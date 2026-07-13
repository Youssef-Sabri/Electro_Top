# Electro Top

**A premium e-commerce platform for certified electrical supplies** — Arabic-first (RTL) guest-checkout storefront with a full admin dashboard.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and Supabase (PostgreSQL + Auth + Storage).

---

## Features

### Storefront
- **Guest Checkout** — No registration required. Customers place orders instantly.
- **Real-Time Catalog** — Live product updates via Supabase Realtime, with search, sort, and category filtering.
- **Order Tracking** — Look up orders by tracking ID with full status timeline.
- **Payment Options** — InstaPay (receipt upload) or Cash on Delivery.
- **RTL Arabic UI** — Complete right-to-left interface with optimized Arabic typography (Cairo + Tajawal fonts).

### Admin Dashboard
- **Analytics** — Revenue metrics, inventory health alerts, order status breakdown.
- **Order Management** — Searchable ledger, status updates, admin notes, printed invoices, CSV export.
- **Inventory CRUD** — Add/edit/delete products, upload compressed images, manage categories, CSV export.
- **Security** — Supabase Auth with role-based guards, 1-hour inactivity timeout, CSRF protection, CSP nonces, rate-limited login.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Database** | Supabase PostgreSQL (RLS, triggers, RPCs, realtime) |
| **Auth** | Supabase Auth (JWT with refresh token rotation) |
| **Styling** | Tailwind CSS v4 |
| **Language** | TypeScript (strict mode) |
| **Validation** | Zod |
| **Images** | Supabase Storage (client-side compression, magic-byte validation) |
| **Deployment** | Vercel-ready |

---

## Project Structure

```
app/
  (store)/          # Public pages (home, shop, cart, checkout, tracking, support)
  admin/            # Admin pages (dashboard, orders, inventory, categories)
  api/              # API routes (public: orders, tracking; admin: CRUD, auth, upload)
  sitemap.ts        # Dynamic sitemap generator for search engines
components/
  admin/            # Admin dashboard components
  cart/             # Cart page components
  catalog/          # Storefront catalog (landing, shop, product modal)
  checkout/         # Checkout form + confirmation
  layout/           # Navbar, Footer, CartReconciler
  tracking/         # Order tracking components
  ui/               # Reusable primitives (modals, badges, spinner, pagination, toast)
providers/          # React context providers (Cart, Products, Orders)
hooks/              # Custom hooks (useCart, useProducts, useOrders, useOrderTracking, usePagination)
lib/                # Utilities (Supabase clients, auth guards, validators, rate-limiter, image utils, CSV export, etc.)
types/              # Shared TypeScript interfaces (Product, Order, OrderItem, CartItem, etc.)
public/
  robots.txt        # Search engine crawler rules (blocks /admin/, /api/)
proxy.ts            # Next.js 16 proxy (CSP, admin auth, inactivity timeout, CSRF, rate-limit)
next.config.ts      # Next.js config (security headers, image remote patterns, dev origins)
```

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/electro-top.git
cd electro-top
npm install
```

### 2. Configure Environment
Copy the example and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_anon_key
SUPABASE_SECRET_KEY=sb_secret_your_service_role_key
ADMIN_SESSION_SECRET=any_random_string_at_least_32_chars
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CURRENCY_SYMBOL=EGP
NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME=Your Name
NEXT_PUBLIC_INSTAPAY_PHONE=01000000000
NEXT_PUBLIC_SUPPORT_WHATSAPP_1=201000000000
NEXT_PUBLIC_SUPPORT_WHATSAPP_2=201000000000
NEXT_PUBLIC_SUPPORT_PHONE_1=+201000000000
NEXT_PUBLIC_SUPPORT_PHONE_2=+201000000000
NEXT_PUBLIC_SUPPORT_FACEBOOK=https://www.facebook.com/yourpage
NEXT_PUBLIC_SUPPORT_EMAIL=info@yourdomain.com
```

### 3. Set Up Database
Open `supabase_setup.html` and run Steps 1–8 in your Supabase Dashboard SQL Editor to create all tables, RLS policies, triggers, and RPCs.

### 4. Run Development Server
```bash
npm run dev
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |

---

## Database

All database schema, migrations, RPCs, triggers, and RLS policies are documented in a single SQL workflow: `supabase_setup.html` (8 ordered steps). This includes:

- 10 tables (categories, products, orders, order_items, order_status_history, rate-limit tables)
- 5 RPC functions (order creation, tracking, rate-limiting, order counts)
- 5 triggers (price validation, stock management, order validation)
- Row-Level Security on all tables
- `pg_cron` cleanup for stale rate-limit records

---

## Security

- **Admin routes** protected by edge proxy: checks Supabase session + `role === 'admin'` on every request
- **HMAC-signed cookies** — admin session cookie is cryptographically signed to prevent tampering
- **1-hour inactivity timeout** — session auto-expires server-side after 60 minutes of no requests
- **CSRF protection** — Origin/Referer validation on all non-GET requests
- **CSP with nonces** — per-request Content-Security-Policy header
- **Rate limiting** — atomic per-IP limits on login, order creation, tracking lookups, receipt uploads, and CSP reports
- **Password re-verification** — required for destructive admin actions (clear all orders)
- **Image validation** — magic-byte MIME detection on uploaded images
- **Body size limit** — 10 MB max request body enforced in proxy
- **Host validation** — blocks spoofed Host headers in production
- **Server-side cart validation** — verifies product existence, active status, and stock before order creation
