# AgriVerse Web Frontend (`agriverse-web`)

Production frontend for **AgriVerse**, built with **React 19**, **TypeScript (Strict)**, **Vite**, **Tailwind CSS v4**, **TanStack Query v5**, **Zustand**, and **Recharts**.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 19** + **Vite** | Blazing fast client runtime and Hot Module Replacement (HMR). |
| **Language** | **TypeScript (Strict)** | Strict end-to-end type safety matching Spring Boot backend DTOs. |
| **Styling** | **Tailwind CSS v4** | Token-based styling with design tokens defined in `@theme` (`index.css`). |
| **Server State** | **TanStack Query v5** | Query caching, automatic background invalidations, and optimistic mutations. |
| **Client State** | **Zustand** | Persistent client storage for authentication sessions and shopping cart. |
| **Routing** | **React Router DOM v7** | Nested layout trees, lazy boundaries, and strict role guards. |
| **Form Validation** | **React Hook Form + Zod** | Client-side validation mirroring backend Bean Validation rules. |
| **Data Viz** | **Recharts** | Responsive charts for financial, inventory, and analytics dashboards. |
| **Icons** | **Lucide React** | Consistent, tree-shakeable icon set. |
| **Dates** | **Day.js** | Formatting Java `LocalDateTime` ISO strings. |
| **Notifications** | **React Hot Toast** | Toast feedback for mutations and API errors. |

---

## 📁 Source Code Organization

```text
src/
├── api/
│   ├── client.ts              # Axios instance with auth header & silent token refresh interceptors
│   ├── queryKeys.ts           # Centralized TanStack Query key factory (qk.*)
│   ├── types.ts               # Strictly typed TypeScript interfaces matching backend DTOs & entities
│   └── endpoints/             # Modular API service definitions
│       ├── auth.ts            # Login, register, OTP, password reset, token refresh
│       ├── products.ts        # Marketplace catalog & seller product management
│       ├── orders.ts          # Order placement, seller fulfilment & customer history
│       ├── farm.ts            # Farm profile, crops, livestock herd & expense ledger
│       ├── livestock.ts       # Livestock marketplace & listings
│       ├── analytics.ts       # Farmer revenue/yield analytics
│       ├── weather.ts         # Weather forecasts & agricultural advisory
│       ├── market.ts          # APMC mandi commodity prices
│       ├── schemes.ts         # Government subsidy scheme discovery & applications
│       ├── vets.ts            # Veterinarian directory & consultation booking
│       ├── ai.ts              # Agronomist chat, plant disease scan, crop recommendations
│       ├── admin.ts           # Platform statistics, user directory & moderation
│       ├── adminSchemes.ts    # Admin scheme CRUD
│       ├── vetPortal.ts       # Vet visit schedule, status/prescriptions & practice earnings
│       └── deliveryPortal.ts  # Shipped orders queue, claim/deliver mutations & partner earnings
│
├── components/
│   ├── ui/                    # Design system primitives: Button, Input, Select, Badge, Card, Modal, Table, Skeleton...
│   ├── layout/                # AppLayout, PublicLayout, AuthLayout, Sidebar, Header, MobileNav, Footer
│   └── feedback/              # EmptyState, ErrorState, LoadingState
│
├── features/                  # Domain-driven feature modules
│   ├── auth/                  # Login, Register, ForgotPassword, VerifyOtp, ResetPassword
│   ├── farm/                  # FarmerDashboard, FarmProfile, CropManagement, Expenses, FarmerAnalytics
│   ├── marketplace/           # ProductCatalog, ProductDetail, ProductCard
│   ├── shopping/              # Cart, Checkout, OrderSuccess
│   ├── orders/                # OrderList, OrderDetail, StatusTimeline
│   ├── livestock/             # MyLivestock, LivestockMarketplace, LivestockDetail
│   ├── market/                # MarketPrices
│   ├── weather/               # WeatherPage
│   ├── schemes/               # Schemes
│   ├── vets/                  # BookVet
│   ├── ai/                    # AiHub
│   ├── seller/                # SellerDashboard, SellerProducts, ProductForm, SellerOrders, SellerInventory, SellerRevenue
│   ├── admin/                 # AdminDashboard, AdminUsers, AdminUserDetail, AdminSellers, AdminProducts, AdminOrders, AdminOrderDetail, AdminSchemes, AdminAnalytics
│   ├── vet/                   # VetDashboard, VetAppointments, VetPatients, VetEarnings, derivePatients
│   └── delivery/              # DeliveryDashboard, DeliveryAvailable, DeliveryActive, DeliveryHistory, DeliveryEarnings
│
├── hooks/                     # Custom hooks (useDebounce, useMediaQuery...)
├── lib/                       # Formatters, checkout math, order status transitions, role mappings
├── routes/                    # Router tree, AppRoutes, RequireAuth & RequireRole guards
├── stores/                    # Zustand stores: authStore, cartStore
└── styles/                    # index.css (Tailwind CSS v4 tokens and theme variables)
```

---

## ⚡ Development & Build Scripts

```bash
# Start local development server on http://localhost:5173
npm run dev

# Compile TypeScript and generate production bundle in /dist
npm run build

# Run unit tests via Vitest
npm test

# Run linter across all files
npx oxlint
```

---

## 🛡️ Robust UI Architecture

Every list and dashboard view implements the **4 Mandatory UI States**:
1. **Loading Skeleton State**: Semantic layouts using `<Skeleton>` components that match the destination UI shape.
2. **Error State**: Actionable `<ErrorState>` showing user-friendly error messages and a retry button.
3. **Empty State**: Custom `<EmptyState>` with descriptive text and a clear CTA when no records exist.
4. **Content State**: Interactive, responsive tables, cards, and charts.
