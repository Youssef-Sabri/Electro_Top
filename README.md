# Electro Top

**A premium e-commerce platform for certified electrical supplies.**

Built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase.

---

## Features

### Storefront
- **Zero-Friction Checkout**: Customers can check out as guests (no registration required).
- **Real-Time Catalog**: Search, sort, and filter products by category with real-time stock updates.
- **Easy Payment & Tracking**: Direct payment via InstaPay with receipt verification and real-time order tracking using a unique ID.
- **RTL Arabic Support**: Complete Right-to-Left (RTL) interface with optimized Arabic typography.

### Admin Dashboard
- **Sales Insights & Analytics**: Real-time revenue metrics, inventory health logs, and status breakdown.
- **Order Management**: Searchable ledger, status history timelines, and print-ready invoices.
- **Inventory CRUD**: Manage products, upload multiple compressed images, edit categories, and export data as CSV.
- **Role-Based Security**: Gated admin pages with Supabase Auth, activity timeouts, and route guards.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL with RLS policies)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (Strict mode)

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/electro-top.git
cd electro-top
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_INSTAPAY_ACCOUNT_NAME=your_merchant_name
NEXT_PUBLIC_INSTAPAY_PHONE=your_instapay_phone
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the website.


