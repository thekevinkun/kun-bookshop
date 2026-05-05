# Kun Bookshop

A full-stack digital bookstore built with the MERN stack and TypeScript. Users can browse, preview, purchase, and read digital books (PDF/EPUB) directly in the browser — and get help from **KUN**, an AI-powered virtual assistant that can search books, manage your cart, and answer questions in real time. Admins get a full dashboard for managing the entire store.

> **Portfolio project** — built phase by phase from scratch to production-ready.

<img width="1920" height="1115" alt="kun-bookshop-hero" src="https://github.com/user-attachments/assets/c7fff236-5dfb-418c-bd96-705d33741dd2" />
<br />
<img width="1920" height="2810" alt="kun-bookshop-book-detail-page_1984" src="https://github.com/user-attachments/assets/38de4a0a-85d9-481c-8c93-c68b744a9b9f" />



---

## 🚀 Live Demo

> **Frontend:** [https://kunbookshop.up.railway.app](https://kunbookshop.up.railway.app/)

> **API:** [https://api-kunbookshop.up.railway.app](https://api-kunbookshop.up.railway.app/)

---

## ✨ Features

### For Users

- 🔐 **Authentication** — Register, login, logout with JWT stored in httpOnly cookies. Rotating refresh tokens with a shared `performRefresh()` lock that prevents double-rotation race conditions across concurrent requests.
- 📖 **Book Catalog** — Browse, search, filter by category bucket, file type, and price range. Autocomplete search suggestions. Debounced input.
- 🎠 **Hero Carousel** — Auto-cycling featured books with direction-aware crossfade animation and fixed autoplay bug (stable interval via refs).
- 🔥 **Deals Section** — Discount-filtered catalog powered by server-side `$expr` MongoDB query. "Shop Now" links navigate directly to filtered results.
- 🆕 **New Arrivals** — 4 newest books on the homepage in a 2×2 compact grid.
- 👁️ **Recently Viewed** — Server-synced history for logged-in users (MongoDB), localStorage for guests. Shown on the browse page, hidden when filters are active. Atomic dedup pipeline prevents duplicates even under concurrent requests.
- 📄 **Book Preview** — In-browser PDF/EPUB reader for non-owners. Page-capped at a configurable preview limit. Signed Cloudinary URLs with 15-minute expiry.
- 📘 **Full Book Reader** — Owners read PDF books in-browser with no page cap. EPUB owners download to their native app (browser sandbox constraint — `epubjs` scripts are blocked inside `about:srcdoc` iframes).
- 📌 **Reading Progress** — Auto-saves PDF reading position to MongoDB 2 seconds after navigation. Restores position on next open. Debounce implemented via `setTimeout` refs (not a state hook) to prevent false saves on restore.
- 🛒 **Shopping Cart** — Server-side cart persisted to MongoDB per user, mirrored in Zustand. Syncs across all browsers and devices on login. Stale coupon cleared automatically when cart items change.
- 💳 **Stripe Checkout** — Full Stripe payment flow with webhook fulfillment. Idempotency-guarded — duplicate checkout sessions for the same books are prevented.
- 🎟️ **Coupon System** — Apply discount codes at checkout. Backend validates and calculates discount server-side. Per-user usage check prevents abuse. `usedCount` incremented via webhook after payment.
- 📣 **Coupon Announcement Banner** — Homepage-only animated banner cycling through active coupons every 6 seconds. Auto-disappears when no valid coupons exist. Shimmer animation via CSS `@keyframes`.
- 📦 **Order History** — Full order list with status badges, item snapshots, and coupon row.
- 📚 **Personal Library** — Purchased books with Read (PDF) and Download (EPUB/PDF) buttons. Illustrated empty state.
- 💾 **Secure Downloads** — Signed Cloudinary URLs with 1-hour expiry. BOLA-protected ownership check before every download.
- ❤️ **Wishlist** — Add/remove books from a personal wishlist on the book detail page.
- ⭐ **Reviews & Ratings** — Leave, edit, delete reviews. Mark reviews as helpful. `isPurchaseVerified` set server-side. Batch reviewer name population to prevent N+1.
- 👤 **Author Pages** — Public author profiles with bio, book grid, and social links.
- 🔍 **GraphQL Demo** — Showcase page at `/graphql-demo` querying book reviews via GraphQL.
- 🌟 **Recommendations** — Personalised book recommendations based on library and wishlist category overlap, with fallback to top-rated.
- 🤖 **KUN AI Assistant** — An AI-powered chatbot built with OpenAI `gpt-4o-mini` and tool calling. KUN can search the catalog, add books to your cart, check your library and orders, validate coupons, and answer questions about the store — all in a streaming chat UI. Available as a floating widget on every page and as a full dedicated Contact & Help page. Supports both a mock mode (zero API cost) and a live OpenAI mode.

### For Admins

- 📊 **Dashboard** — Stats cards + Recharts revenue line chart + recent orders table.
- 📚 **Book Management** — Full CRUD with Cloudinary file/cover upload, category and tag management, soft delete.
- ✍️ **Author Management** — Full CRUD with Cloudinary avatar upload.
- 👥 **User Management** — Role toggle (user ↔ admin), delete, search, pagination.
- 🛍️ **Order Tracking** — Status filter + pagination across all orders.
- ⭐ **Review Moderation** — Rating filter, search, delete any review.
- 🎟️ **Coupon Management** — Create, toggle active/inactive, delete, and **email blast** a coupon to all verified users.

---

## 🛠️ Tech Stack

### Backend

|Technology|Version|Purpose|
|---|---|---|
|Node.js + Express|v5|HTTP server and API routing|
|TypeScript|5.7|Type safety|
|MongoDB + Mongoose|8|Database and ODM|
|Zod|v4|Request validation|
|JSON Web Token|—|Access + refresh token auth|
|bcryptjs|—|Password hashing (10 rounds)|
|Stripe|—|Payment processing + webhooks|
|Cloudinary|—|File storage (books, covers, avatars) — signed URLs|
|Resend|—|Transactional emails (HTTPS-based — Railway blocks SMTP ports)|
|Handlebars|—|Email templates (table-based layout for Gmail compatibility)|
|OpenAI|—|KUN AI assistant — `gpt-4o-mini` with tool calling + SSE streaming|
|GraphQL (Apollo Server)|—|Showcase query layer|
|Winston|—|Structured logging with sensitive field redaction|
|Helmet|—|Security headers|
|express-rate-limit|—|Rate limiting (100 req/15min global, stricter on auth and chat)|
|express-mongo-sanitize|—|NoSQL injection prevention|
|Multer|—|Multipart file uploads|

### Frontend

|Technology|Version|Purpose|
|---|---|---|
|React|19|UI library|
|TypeScript|—|Type safety|
|Vite|6|Build tool|
|Tailwind CSS|v4|Styling (config-free, `@theme` in CSS)|
|React Router|—|Client-side routing|
|TanStack Query|v5|Server state, caching, background refetch|
|Zustand|v5|Client state (auth, cart)|
|Radix UI|—|Accessible primitives (dialog, dropdown)|
|Mantine|v7|Component library|
|Framer Motion|—|Animations and micro-interactions|
|Recharts|—|Admin revenue charts|
|react-pdf (pdfjs)|—|In-browser PDF rendering|
|epubjs|—|EPUB preview rendering|
|react-markdown|—|Markdown rendering in KUN AI chat messages|
|react-helmet-async|—|Dynamic `<head>` meta tags per page|
|axios|1.14.0|HTTP client (pinned — supply chain safety)|

### Infrastructure

|Service|Purpose|
|---|---|
|MongoDB Atlas|Production database (M0 free tier)|
|Cloudinary|File storage and image optimization|
|Stripe|Payments (test + live keys)|
|Railway|Hosting (backend + frontend Docker containers)|
|Docker + nginx|Containerization and SPA serving|
|prerender.io|Social crawler prerendering — bots get fully-rendered OG HTML|
|Resend|Transactional email delivery (bypasses Railway SMTP block)|

---

## 🏗️ Project Structure

```
kun-bookshop/
├── client/                     # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── features/       # BookCard, BookPreview, CartDrawer, CouponBanner...
│   │   │   │   └── chat/       # ChatPanel, ChatMessage, ChatWidget, QuickReplies
│   │   │   ├── layout/         # Navbar, Hero, Footer, BottomNav, DealsSection...
│   │   │   └── ui/             # Shared primitives
│   │   ├── hooks/              # All TanStack Query hooks + useRecentlyViewed + useChat
│   │   ├── lib/                # axios instance, react-query client, cloudinary helper
│   │   ├── routes/             # File-based page components
│   │   │   ├── admin/          # Admin dashboard pages (lazy-loaded)
│   │   │   ├── books/          # Catalog + detail pages
│   │   │   ├── contact/        # Contact & Help page (KUN full-page surface)
│   │   │   ├── library/        # User library
│   │   │   ├── profile/        # Profile, orders, edit, password
│   │   │   └── graphql-demo/   # GraphQL showcase
│   │   ├── store/              # Zustand stores (auth, cart)
│   │   ├── styles/             # globals.css (Tailwind v4 @theme config)
│   │   ├── types/              # Shared TypeScript interfaces
│   │   └── validators/         # Zod schemas (duplicated from server — never imported cross-boundary)
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                     # Express v5 + TypeScript backend
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── graphql/            # Schema, resolvers, context
│   │   ├── middleware/         # auth, admin, upload, ownership, rateLimiter, chatLimiter
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # Express routers
│   │   ├── services/           # email.service, download.service, chat.service, chatTools.service
│   │   ├── templates/          # Handlebars email templates (table-based, Gmail-compatible)
│   │   ├── utils/              # jwt, logger, sanitize
│   │   ├── validators/         # Zod schemas (server-side)
│   │   └── server.ts           # Entry point
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Overview

### Auth — `/api/auth`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|POST|`/register`|—|Register new user|
|POST|`/login`|—|Login, sets httpOnly cookie|
|POST|`/logout`|—|Clears cookie|
|POST|`/refresh`|—|Refresh access token|
|GET|`/me`|✅|Get current user|
|POST|`/upload-avatar`|✅|Upload and crop avatar to Cloudinary|
|DELETE|`/avatar`|✅|Remove avatar|

### Books — `/api/books`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/`|—|Paginated catalog with filters|
|GET|`/featured`|—|Hero carousel books (score-based)|
|GET|`/categories`|—|Distinct category list|
|GET|`/recommendations`|✅|Personalised recommendations|
|GET|`/:id`|—|Single book detail|
|GET|`/:id/preview`|—|Signed preview URL (15min expiry)|
|GET|`/:id/read`|✅|Signed full-read URL, owners only|
|POST|`/`|🔒 Admin|Create book|
|PUT|`/:id`|🔒 Admin|Update book|
|DELETE|`/:id`|🔒 Admin|Soft delete|

### Cart — `/api/cart`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/`|✅|Fetch cart (creates empty cart if none)|
|POST|`/items`|✅|Add book to cart|
|DELETE|`/items/:bookId`|✅|Remove book from cart|
|DELETE|`/`|✅|Clear entire cart (called post-checkout)|
|POST|`/coupon`|✅|Save applied coupon to cart|
|DELETE|`/coupon`|✅|Remove coupon from cart|

### Recently Viewed — `/api/recently-viewed`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/`|✅|Fetch recently viewed books (populated, newest first)|
|POST|`/:bookId`|✅|Add book — atomic dedup + cap at 10|

### Checkout & Webhooks

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|POST|`/api/checkout/create-session`|✅|Create Stripe checkout session|
|GET|`/api/checkout/success`|—|Handle redirect after payment|
|POST|`/api/webhooks/stripe`|—|Stripe webhook (raw body)|

### Library, Wishlist & Downloads — `/api/users`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/library`|✅|User's purchased books|
|GET|`/wishlist`|✅|User's wishlist|
|POST|`/wishlist/:bookId`|✅|Add to wishlist|
|DELETE|`/wishlist/:bookId`|✅|Remove from wishlist|
|POST|`/api/downloads/book/:bookId`|✅|Generate signed download URL|
|GET|`/api/downloads/history`|✅|Download history|

### Reading Progress — `/api/reading-progress`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/:bookId`|✅|Get saved reading position|
|PUT|`/:bookId`|✅|Upsert reading position|

### Reviews — `/api/reviews`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/book/:bookId`|—|Book reviews (paginated)|
|POST|`/`|✅|Create review|
|PUT|`/:id`|✅|Update own review|
|DELETE|`/:id`|✅|Delete review|
|POST|`/:id/helpful`|✅|Mark review helpful|

### Coupons — `/api/coupons`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/active`|—|Active coupons for banner|
|POST|`/validate`|✅|Validate + calculate discount|

### KUN AI Chat — `/api/chat`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|POST|`/`|—|Send message — streams response via SSE. Rate-limited to 20 req/min per IP.|

KUN supports **13 tools** executed server-side via OpenAI function calling:

|Tool|Auth Required|What It Does|
|---|---|---|
|`searchBooks`|No|Full-text + regex search across title, author, category, tags|
|`getBookDetails`|No|Full details for a single book by ID|
|`getFeaturedBooks`|No|Top books by store-wide score (popularity, rating, recency)|
|`getRecommendedBooks`|No|Personalised picks based on user's library + wishlist categories|
|`getCategories`|No|All distinct categories across active books|
|`validateCoupon`|No|Check coupon validity and calculate discount — does not apply it|
|`applyCoupon`|Yes|Validate + save coupon to the user's Cart document|
|`addToCart`|Yes|Add a book — checks ownership and duplicates|
|`removeFromCart`|Yes|Remove a book and clear stale coupon|
|`getMyCart`|Yes|Current cart items and applied coupon|
|`getMyLibrary`|Yes|User's purchased books (title, format — no file URLs)|
|`getMyOrders`|Yes|Last 10 completed orders|
|`addToWishlist`|Yes|Add book using `$addToSet` — no duplicates|

### Admin — `/api/admin`

|Method|Endpoint|Auth|Description|
|---|---|---|---|
|GET|`/stats`|🔒 Admin|Dashboard stats|
|GET|`/users`|🔒 Admin|All users|
|PUT|`/users/:id/role`|🔒 Admin|Toggle user role|
|DELETE|`/users/:id`|🔒 Admin|Delete user|
|GET|`/orders`|🔒 Admin|All orders|
|GET|`/revenue`|🔒 Admin|Revenue chart data|
|GET|`/reviews`|🔒 Admin|All reviews|
|GET/POST/PUT/DELETE|`/coupons`|🔒 Admin|Coupon CRUD|
|POST|`/coupons/:id/email-blast`|🔒 Admin|Email coupon to all verified users|

### GraphQL — `/graphql`

Showcase layer for books and reviews. Supports `books`, `book`, `bookReviews`, `topReviews` queries and `createReview` mutation.

---

## 🤖 KUN AI Assistant

KUN is an AI-powered virtual assistant built into Kun Bookshop. It uses **OpenAI `gpt-4o-mini`** with tool calling and **Server-Sent Events (SSE)** streaming for a real-time chat experience.

### Two Surfaces, One Brain

|Surface|Description|
|---|---|
|**Floating Widget**|Bottom-right chat bubble, visible on every page. Click to open a compact streaming chat panel. Hidden on the Contact page to avoid duplication.|
|**Contact & Help Page** (`/contact`)|Full dedicated page with KUN open by default, surrounded by an FAQ accordion, topic categories, and contact info.|

Both surfaces use the same `ChatPanel` component and the same `useChat` hook. The backend endpoint is identical.

### How It Works

- The frontend sends a message via `fetch` (not axios — needs `ReadableStream`) with the full conversation history and user context
- The backend builds a system prompt with the user's name, login state, and time of day, then runs an **OpenAI tool-calling loop** (max 5 iterations)
- Each tool call is executed server-side against real MongoDB data — the client never touches the tools directly
- Tokens are streamed back token-by-token via SSE and appended to the chat in real time
- After streaming completes, the frontend calls `loadCart()` if authenticated — keeping Zustand in sync if KUN modified the cart

### Security

- Rate-limited to **20 requests/minute per IP** — separate from the main API limiter
- Input sanitized server-side (HTML stripped, max 500 characters) before reaching OpenAI
- OpenAI API key lives in `server/.env` only — never sent to the frontend
- Action tools (`addToCart`, `getMyLibrary`, etc.) check `userId` before executing — guests receive `{ requiresAuth: true }` and KUN asks them to log in
- Tool results never expose `fileUrl`, `filePublicId`, or raw Cloudinary URLs
- Cost protected by a **$5/month hard cap** in the OpenAI dashboard

### Mock Mode

Set `CHAT_MODE=mock` in `server/.env` for zero-cost development and testing. The mock controller pattern-matches keywords and streams scripted responses — the full UI and SSE pipeline are exercised without any OpenAI calls. Flip to `CHAT_MODE=openai` when ready.

<br />
<img width="1920" height="1080" alt="5  KUN AI Preview" src="https://github.com/user-attachments/assets/453941fa-78ac-4898-90da-9bb136dca32f" />


---

## 🔐 Security

- **JWT** in httpOnly, Secure, SameSite cookies — not accessible to JavaScript. Production uses `SameSite=None` (required for cross-origin Railway subdomains) with `Secure: true`. Development uses `SameSite=Lax`.
- **Refresh token rotation** — tokens hard-invalidated on use. A shared `performRefresh()` lock prevents double-rotation race conditions when multiple requests fire simultaneously.
- **Helmet** — Content Security Policy and other security headers
- **CORS** — Whitelist-only, production domain only
- **Rate limiting** — 100 requests per 15 minutes per IP globally; stricter limits on auth, download, and chat routes
- **Zod validation** — All request bodies validated server-side before touching the DB
- **express-mongo-sanitize** — NoSQL injection prevention
- **BOLA protection** — Ownership verified server-side before downloads, reads, and reading progress saves
- **Stripe signature verification** — Webhook payload verified with raw body before `express.json()`
- **Cloudinary signed URLs** — Time-limited (15min preview, 1hr download/read) — no public file access
- **File upload validation** — Magic byte verification (not just MIME type) on upload middleware
- **HTML sanitization** — DOMPurify on both server (via JSDOM) and client before rendering rich text descriptions
- **`isPurchaseVerified`** on reviews — set server-side by checking `user.library`, never trusted from client
- **Winston log redaction** — Sensitive fields (`password`, `token`, `authorization`, etc.) automatically replaced with `[REDACTED]` before writing to log files
- **No stack traces in production** — Error handler strips internal details

---

## ⚡ Performance

### Lighthouse Scores (Production Build)

|Metric|Score|
|---|---|
|Performance|**87**|
|Accessibility|**100**|
|Best Practices|**100**|
|SEO|**100**|

### Optimizations Applied

- **Route lazy-loading** — Every page is its own chunk (4–12kb each)
- **BookPreview isolated** — 426kb pdfjs chunk only downloads when preview button is clicked
- **Admin chunk** — 384kb, only loads for admin users
- **Cloudinary image optimization** — `getCoverUrl()` helper injects `f_auto,q_auto` transforms at render time. Serves WebP/AVIF automatically. Never stores transforms in the DB.
- **Google Fonts preload** — `<link rel="preload">` + non-blocking `media="print"` pattern eliminates render-blocking
- **`fetchPriority="high"`** on Hero LCP image — largest contentful paint improvement
- **White flash prevention** — `#0F172A` background on `<html>` before React hydrates
- **TanStack Query caching** — Configurable `staleTime` per hook. Preview URLs cached for 45min (under 1hr Cloudinary expiry). TanStack cache explicitly cleared on both login and logout to prevent stale data bleeding between accounts.
- **Debounced search** — `useDebouncedValue` from `@mantine/hooks` prevents rapid API calls
- **gzip compression** — Enabled on both Express and nginx

---

## 🎨 Design System

Dark glass aesthetic built with Tailwind v4 (zero config file — all in `globals.css` via `@theme`).

- **Background:** `#0F172A` (dark slate)
- **Surfaces:** `bg-white/5` with `border border-white/10` — glass effect
- **Accents:** Teal (`#0ea5e9` family) for primary actions
- **Cards:** `rounded-2xl` surfaces
- **Buttons:** `btn-primary` and `btn-ghost` global component classes
- **Animations:** Framer Motion throughout — hero crossfade, cart item slide, wishlist bounce, autocomplete stagger, filter panel fade
- **Mobile Navigation:** Native-app-style bottom tab bar (Home · Browse · Library · KUN · Profile) replaces the hamburger menu below 768px. The KUN tab opens a full-screen spring-animated chat panel.

---

## 🗄️ Database Models

|Model|Purpose|
|---|---|
|`User`|Auth, roles, library array (owned book IDs), wishlist|
|`RefreshToken`|Rotating refresh tokens with TTL index (auto-deletes after 30 days)|
|`Book`|Full book document with `authorName` denormalized|
|`Author`|Author profiles with Cloudinary avatar|
|`Review`|User reviews — `isPurchaseVerified` server-set|
|`Order`|Order snapshot — items, pricing, coupon, status|
|`Cart`|Server-side cart per user — items array + coupon sub-document|
|`RecentlyViewed`|Per-user recently viewed book IDs (max 10, atomic dedup)|
|`ProcessedEvent`|Idempotency keys for Stripe webhook events|
|`AuditLog`|Admin action audit trail|
|`Download`|Download analytics per user per book|
|`Coupon`|Discount codes with usage tracking|
|`ReadingProgress`|PDF reading position per user per book (compound unique index on `userId + bookId`)|

---

## 🧑‍💻 Local Development

### Prerequisites

- Node.js 22+
- MongoDB running locally (or Atlas connection string)
- Stripe CLI (for webhook testing)
- Cloudinary account
- Resend account (for email delivery)
- OpenAI account (for KUN AI — or use `CHAT_MODE=mock` to skip)

### 1. Clone & install

```bash
git clone https://github.com/thekevinkun/kun-bookshop.git
cd kun-bookshop

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Environment variables

**`server/.env`**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your_64_char_random_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

RESEND_API_KEY=re_...
RESEND_TEST_EMAIL=your@email.com

# KUN AI — set to "mock" for zero-cost local dev
CHAT_MODE=mock
OPENAI_API_KEY=sk-...

CLIENT_URL=http://localhost:5173
API_URL=http://localhost:5000
SITE_URL=http://localhost:5173
LOGO_URL=https://res.cloudinary.com/***
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_SITE_URL=http://localhost:5173
```

### 3. Run development servers

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev

# Terminal 3 — Stripe webhook forwarding (required for payments)
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### 4. Seed an admin user

After registering via the app, open MongoDB and set `role: "admin"` on your user document, or use the admin role toggle in the admin dashboard.

---

## 🐳 Docker

```bash
# Build and run everything locally
docker compose up --build

# Frontend: http://localhost:80
# Backend:  http://localhost:5000
```

The compose file runs MongoDB + Express backend + nginx-served React frontend with healthchecks and a shared internal network.

> **Note (WSL users):** Docker daemon must be started manually with `sudo dockerd` in a dedicated terminal. All `docker` commands require `sudo` until the session is restarted after `usermod -aG docker $USER`.

---

## 🚢 Deployment (Railway)

1. Push to GitHub
2. Create a new Railway project → "Deploy from GitHub repo"
3. Add backend service → select `server/` → Railway auto-detects Dockerfile
4. Add frontend service → select `client/` → Railway auto-detects Dockerfile
5. Set all environment variables in the Railway dashboard (same as `.env` above, but with production values)
6. Swap Stripe test keys for live keys
7. Set `CLIENT_URL`, `API_URL`, `SITE_URL` to your Railway-assigned URLs
8. Add `PORT=80` to the **frontend** service variables — Railway injects its own `PORT` and nginx must match
9. MongoDB → use **MongoDB Atlas M0 free cluster** (not a Railway addon)
10. Update the Stripe webhook endpoint in the Stripe dashboard to `https://your-api-url/api/webhooks/stripe`
11. After deploy → submit `https://yourdomain.up.railway.app/sitemap.xml` to [Google Search Console](https://search.google.com/search-console)

> **Email:** Railway blocks outbound SMTP (ports 587/465). This project uses **Resend** for email delivery over HTTPS — no SMTP configuration needed. Without a verified custom domain on Resend, emails are delivered only to the address used during Resend signup.

---

## 🔍 SEO

- `react-helmet-async` — dynamic `<title>`, `<meta>`, `canonical` per page
- **JSON-LD structured data** — `Book` schema on book pages (name, price, rating, availability) and `WebSite` schema with `SearchAction` on the homepage
- **Sitemap** — Express endpoint at `GET /sitemap.xml`, includes all active book pages from MongoDB, cached 1 hour
- **`robots.txt`** — Served statically, blocks `/admin`, `/api`, `/library`, `/profile`, `/checkout`
- **Sitelinks SearchBox** — `WebSite` JSON-LD schema with `potentialAction`
- **Open Graph + Twitter Card** — Book cover, title, description on all book pages
- Lighthouse SEO score: **100**
- **OG image prerendering** — nginx bot detection via `map $http_user_agent` routes social crawlers (WhatsApp, Twitter, Slack, Telegram, etc.) to prerender.io, which runs React in a headless browser and returns fully-rendered HTML with all OG meta tags intact

---

## 🐛 Key Bugs Fixed (across all phases)

|Bug|Fix|
|---|---|
|Password eye toggle breaking React Hook Form sync|Destructure RHF `onChange`, call it first, then custom handler|
|Previous user's data bleeding into next login|`queryClient.clear()` on both logout and login|
|DealsSection "Shop Now" not filtering catalog|Backend `$expr` discount filter + lazy URL param initializer in `BooksPage`|
|401 errors on library/profile during hydration|Added `isHydrated &&` guard to all protected query hooks|
|Hero autoplay timer resetting mid-cycle|`books.length` stored in ref — stable `next/prev` callbacks|
|Similar books `authorScore` always 0|`.toString()` on populated ObjectId before string comparison|
|Carousel arrows not showing on small screens|Replaced `books.length > 4` with actual scroll overflow state|
|EPUB in-browser reader blank pages|EPUB full read dropped — browser sandbox blocks `epubjs` scripts in `about:srcdoc` iframes|
|Refresh cookie silently dropped on Safari mobile|`sameSite` changed from `"strict"` to `"none"` for cross-origin Railway subdomains|
|Refresh cookie not sent at all on iOS|Cookie path changed from `"/api/auth/refresh"` to `"/"` — sub-path scoping triggers Safari ITP purging|
|Double refresh race condition causing 403 logout|Shared `performRefresh()` lock — concurrent calls reuse the in-flight promise instead of firing a second rotation|
|Cart empty on page refresh|`loadCart()` called in `initAuth` after token validation so cart survives every page reload|
|Stale coupon totals after adding/removing cart items|Replaced `$setOnInsert` with `$set: { coupon: null }` — runs on every update, not just document creation|
|Recently viewed duplicate entries in MongoDB|Atomic aggregation pipeline (`$concatArrays + $filter + $slice`) + `useRef` in-flight guard on frontend|
|KUN not greeting user by name|Zustand `isHydrated` false on first render — added `if (!isHydrated) return null` guard to `ChatWidget`|
|Cart not updating in Zustand after KUN adds a book|KUN tools write directly to MongoDB — added `loadCart()` call after SSE stream completes|
|Science fiction search returning no results|Text index only covered `title` + `author` — added regex fallback on `authorName`, `category`, `description`, `tags`|
|Emails not delivered on Railway|Railway blocks SMTP (587/465) — replaced Nodemailer with Resend (HTTPS delivery)|
|Gmail rendering email templates incorrectly|Rewrote all `.hbs` templates from `flex`/`grid`/`backdrop-filter` to `<table>` layout with fully inline styles|

---

## 📁 Build Phases

|Phase|What Was Built|
|---|---|
|1|Project foundation — Express + Vite scaffolding, folder structure, tooling|
|2|Authentication — register, login, JWT, refresh tokens, httpOnly cookies|
|3|Book catalog — CRUD, Cloudinary uploads, GraphQL layer, Author model|
|4|Cart + Stripe checkout — webhook fulfillment, idempotency|
|5|User library, downloads, wishlist, BOLA protection|
|6|Admin dashboard — analytics, user/order/author/review management|
|7|Book preview (PDF/EPUB), order history, profile sub-pages, GraphQL showcase|
|8|Coupon system, recommendations engine, hero scoring, deals section|
|9|Test suite — 91 backend tests (Vitest + Supertest) + frontend unit/component/E2E tests (RTL + Playwright)|
|10–11|Image optimization, bundle splitting, font strategy, animations, Lighthouse audit|
|SEO|Structured data, sitemap, Open Graph, Search Console setup|
|Security|Headers, CORS, rate limiting, file byte verification, HTML sanitization, audit logging|
|Reading Progress|Full PDF reader for owners + MongoDB reading position persistence|
|Bug Fixes|RHF fix, cache clear on auth, discount filter, hydration race condition, coupon banner|
|12|Docker containerization + Railway deployment|
|OG Image & Prerender|`VITE_SITE_URL` wired into Dockerfile + Railway env; nginx prerender.io bot routing — social link previews working on WhatsApp, Twitter, Slack|
|Auth Refresh|`sameSite=none`, cookie path fix, `performRefresh()` shared lock — post-deployment auth hardening|
|Server-Side Cart|Cart + RecentlyViewed migrated from localStorage → MongoDB — syncs across all browsers and devices|
|KUN AI Chatbot|OpenAI `gpt-4o-mini` + SSE streaming + 13 tool definitions — floating widget + full Contact page|
|Avatar Upload|In-browser crop (`react-easy-crop`), Cloudinary storage, remove avatar|
|Email Migration|Replaced Nodemailer with Resend; rewrote all templates to Gmail-compatible table layout|
|Mobile Navigation|Bottom tab bar replacing hamburger menu; profile page tab layout; books page loading + autocomplete fixes|

---

## 📸 Screenshots

> Login Page

<img width="1920" height="988" alt="kun-bookshop-login-page" src="https://github.com/user-attachments/assets/82cae2f4-a00f-4cb9-ab09-9e9e70ff9f93" />
<br />

> Homepage (Hero & Recommended Section)

<img width="1920" height="2218" alt="kun-bookshop-hero-recommended" src="https://github.com/user-attachments/assets/9bb933f3-0987-4cca-98c1-29b4f6b36274" />
<br />

> Browse Page

<img width="1920" height="3555" alt="kun-bookshop-browse-page" src="https://github.com/user-attachments/assets/777c62c9-92ba-4d45-9582-f034fbac682b" />
<br />

> Book Detail Page

<img width="1920" height="2681" alt="kun-bookshop-book-detail-page_ikigai" src="https://github.com/user-attachments/assets/2fa9f839-a948-4289-a142-760ec8af8691" />
<br />

> Library Page

<img width="1920" height="1068" alt="kun-bookshop-library-page" src="https://github.com/user-attachments/assets/35ba6699-452c-48e7-ab8c-2a485a601ddc" />
<br />

> Profile Page

<img width="1920" height="1303" alt="kun-bookshop-profile-page_2" src="https://github.com/user-attachments/assets/438424c1-aa9a-4c02-888b-8133fa790af8" />
<br />

> Mobile Version

<img width="616" height="990" alt="6  kun-bookshop-mobile-version" src="https://github.com/user-attachments/assets/f625182d-23ba-48d6-8f27-d6e5754aabe7" />
<br />

> Contact Page

<img width="1920" height="2610" alt="kun-bookshop-contact-page" src="https://github.com/user-attachments/assets/f7966bee-7744-4644-843e-8539778e18e2" />

---

## 📄 License

MIT — feel free to use this as a reference or starting point for your own projects.

---

## 👤 Author

**Kevin Mahendra** [GitHub](https://github.com/thekevinkun) · [LinkedIn](https://www.linkedin.com/in/kevinmahendra1997/)
