# 📚 Kun Bookshop

A full-stack digital bookstore built with the MERN stack and TypeScript. Users can browse, preview, purchase, and read digital books (PDF/EPUB) directly in the browser. Admins get a full dashboard for managing the entire store.

> **Portfolio project** — built phase by phase from scratch to production-ready.

---

## 🚀 Live Demo

> **Frontend:** [https://kunbookshop.up.railway.app](https://kunbookshop.up.railway.app)  
> **API:** [https://api-kunbookshop.up.railway.app](https://api-kunbookshop.up.railway.app)

---

## 📸 Screenshots

> *(Add screenshots here after deployment)*

---

## ✨ Features

### For Users
- 🔐 **Authentication** — Register, login, logout with JWT stored in httpOnly cookies. Token refresh flow with rotating refresh tokens.
- 📖 **Book Catalog** — Browse, search, filter by category bucket, file type, and price range. Autocomplete search suggestions. Debounced input.
- 🎠 **Hero Carousel** — Auto-cycling featured books with direction-aware crossfade animation and fixed autoplay bug (stable interval via refs).
- 🔥 **Deals Section** — Discount-filtered catalog powered by server-side `$expr` MongoDB query. "Shop Now" links navigate directly to filtered results.
- 🆕 **New Arrivals** — 4 newest books on the homepage in a 2×2 compact grid.
- 👁️ **Recently Viewed** — Per-user localStorage history of visited book pages, shown on the browse page. Hides automatically when filters are active.
- 📄 **Book Preview** — In-browser PDF/EPUB reader for non-owners. Page-capped at a configurable preview limit. Signed Cloudinary URLs with 15-minute expiry.
- 📘 **Full Book Reader** — Owners read PDF books in-browser with no page cap. EPUB owners download to their native app (browser sandbox constraint).
- 📌 **Reading Progress** — Auto-saves PDF reading position to MongoDB 2 seconds after navigation. Restores position on next open. Debounce implemented via `setTimeout` refs (not a state hook) to prevent false saves on restore.
- 🛒 **Shopping Cart** — Zustand-powered cart persisted to localStorage per user. Slide-in drawer with animated item entry/exit.
- 💳 **Stripe Checkout** — Full Stripe payment flow with webhook fulfillment. Idempotency-guarded — duplicate checkout sessions for the same books are prevented.
- 🎟️ **Coupon System** — Apply discount codes at checkout. Backend validates and calculates discount server-side. `usedCount` incremented via webhook after payment.
- 📣 **Coupon Announcement Banner** — Homepage-only animated banner cycling through active coupons every 6 seconds. Auto-disappears when no valid coupons exist. Shimmer animation via CSS `@keyframes`.
- 📦 **Order History** — Full order list with status badges, item snapshots, and coupon row.
- 📚 **Personal Library** — Purchased books with Read (PDF) and Download (EPUB/PDF) buttons. Illustrated empty state.
- 💾 **Secure Downloads** — Signed Cloudinary URLs with 1-hour expiry. BOLA-protected ownership check before every download.
- ❤️ **Wishlist** — Add/remove books from a personal wishlist on the book detail page.
- ⭐ **Reviews & Ratings** — Leave, edit, delete reviews. Mark reviews as helpful. `isPurchaseVerified` set server-side. Batch reviewer name population to prevent N+1.
- 👤 **Author Pages** — Public author profiles with bio, book grid, and social links.
- 🔍 **GraphQL Demo** — Showcase page at `/graphql-demo` querying book reviews via GraphQL.
- 🌟 **Recommendations** — Personalised book recommendations based on library and wishlist category overlap, with fallback to top-rated.

### For Admins
- 📊 **Dashboard** — Stats cards + Recharts revenue line chart + recent orders table.
- 📚 **Book Management** — Full CRUD with Cloudinary file/cover upload, category and tag management, soft delete.
- ✍️ **Author Management** — Full CRUD with Cloudinary avatar upload.
- 👥 **User Management** — Role toggle (user ↔ admin), delete, search, pagination.
- 🛍️ **Order Tracking** — Status filter + pagination across all orders.
- ⭐ **Review Moderation** — Rating filter, search, delete any review.
- 🎟️ **Coupon Management** — Create, toggle active/inactive, delete, and **email blast** a coupon to all verified users via Handlebars email template.

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | v5 | HTTP server and API routing |
| TypeScript | 5.7 | Type safety |
| MongoDB + Mongoose | 8 | Database and ODM |
| Zod | v4 | Request validation |
| JSON Web Token | — | Access + refresh token auth |
| bcryptjs | — | Password hashing (10 rounds) |
| Stripe | — | Payment processing + webhooks |
| Cloudinary | — | File storage (books, covers, avatars) — signed URLs |
| Nodemailer + Handlebars | — | Transactional emails |
| GraphQL (express-graphql) | — | Showcase query layer |
| Winston | — | Structured logging |
| Helmet | — | Security headers |
| express-rate-limit | — | Rate limiting (100 req/15min) |
| express-mongo-sanitize | — | NoSQL injection prevention |
| Multer | — | Multipart file uploads |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI library |
| TypeScript | — | Type safety |
| Vite | 6 | Build tool |
| Tailwind CSS | v4 | Styling (config-free, `@theme` in CSS) |
| React Router | — | Client-side routing |
| TanStack Query | v5 | Server state, caching, background refetch |
| Zustand | v5 | Client state (auth, cart) |
| Radix UI | — | Accessible primitives (dialog, dropdown) |
| Mantine | v7 | Component library |
| Framer Motion | — | Animations and micro-interactions |
| Recharts | — | Admin revenue charts |
| react-pdf (pdfjs) | — | In-browser PDF rendering |
| epubjs | — | EPUB preview rendering |
| axios | 1.14.0 | HTTP client (pinned — supply chain safety) |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Production database (M0 free tier) |
| Cloudinary | File storage and image optimization |
| Stripe | Payments (test + live keys) |
| Railway | Hosting (backend + frontend Docker containers) |
| Docker + nginx | Containerization and SPA serving |

---

## 🏗️ Project Structure

```
kun-bookshop/
├── client/                     # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── features/       # BookCard, BookPreview, CartDrawer, CouponBanner...
│   │   │   ├── layout/         # Navbar, Hero, Footer, DealsSection...
│   │   │   └── ui/             # Shared primitives
│   │   ├── hooks/              # All TanStack Query hooks
│   │   ├── lib/                # axios instance, react-query client, cloudinary helper
│   │   ├── routes/             # File-based page components
│   │   │   ├── admin/          # Admin dashboard pages (lazy-loaded)
│   │   │   ├── books/          # Catalog + detail pages
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
│   │   ├── middleware/         # auth, admin, upload, ownership, rateLimiter
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # Express routers
│   │   ├── services/           # email.service, download.service
│   │   ├── templates/          # Handlebars email templates
│   │   ├── utils/              # jwt, logger
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
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, sets httpOnly cookie |
| POST | `/logout` | — | Clears cookie |
| POST | `/refresh` | — | Refresh access token |
| GET | `/me` | ✅ | Get current user |

### Books — `/api/books`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Paginated catalog with filters |
| GET | `/featured` | — | Hero carousel books (score-based) |
| GET | `/categories` | — | Distinct category list |
| GET | `/recommendations` | ✅ | Personalised recommendations |
| GET | `/:id` | — | Single book detail |
| GET | `/:id/preview` | — | Signed preview URL (15min expiry) |
| GET | `/:id/read` | ✅ | Signed full-read URL, owners only |
| POST | `/` | 🔒 Admin | Create book |
| PUT | `/:id` | 🔒 Admin | Update book |
| DELETE | `/:id` | 🔒 Admin | Soft delete |

### Cart, Checkout & Webhooks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/checkout/create-session` | ✅ | Create Stripe checkout session |
| GET | `/api/checkout/success` | — | Handle redirect after payment |
| POST | `/api/webhooks/stripe` | — | Stripe webhook (raw body) |

### Library, Wishlist & Downloads — `/api/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/library` | ✅ | User's purchased books |
| GET | `/wishlist` | ✅ | User's wishlist |
| POST | `/wishlist/:bookId` | ✅ | Add to wishlist |
| DELETE | `/wishlist/:bookId` | ✅ | Remove from wishlist |
| POST | `/api/downloads/book/:bookId` | ✅ | Generate signed download URL |
| GET | `/api/downloads/history` | ✅ | Download history |

### Reading Progress — `/api/reading-progress`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:bookId` | ✅ | Get saved reading position |
| PUT | `/:bookId` | ✅ | Upsert reading position |

### Reviews — `/api/reviews`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/book/:bookId` | — | Book reviews (paginated) |
| POST | `/` | ✅ | Create review |
| PUT | `/:id` | ✅ | Update own review |
| DELETE | `/:id` | ✅ | Delete review |
| POST | `/:id/helpful` | ✅ | Mark review helpful |

### Coupons — `/api/coupons`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/active` | — | Active coupons for banner |
| POST | `/validate` | ✅ | Validate + calculate discount |

### Admin — `/api/admin`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/stats` | 🔒 Admin | Dashboard stats |
| GET | `/users` | 🔒 Admin | All users |
| PUT | `/users/:id/role` | 🔒 Admin | Toggle user role |
| DELETE | `/users/:id` | 🔒 Admin | Delete user |
| GET | `/orders` | 🔒 Admin | All orders |
| GET | `/revenue` | 🔒 Admin | Revenue chart data |
| GET | `/reviews` | 🔒 Admin | All reviews |
| GET/POST/PUT/DELETE | `/coupons` | 🔒 Admin | Coupon CRUD |
| POST | `/coupons/:id/email-blast` | 🔒 Admin | Email coupon to all users |

### GraphQL — `/graphql`
Showcase layer for books and reviews. Supports `books`, `book`, `bookReviews`, `topReviews` queries and `createReview` mutation.

---

## 🔐 Security

- **JWT** in httpOnly, Secure, SameSite=Strict cookies — not accessible to JavaScript
- **Refresh token rotation** — old tokens invalidated on use
- **Helmet** — Content Security Policy and other security headers
- **CORS** — Whitelist-only, production domain only
- **Rate limiting** — 100 requests per 15 minutes per IP
- **Zod validation** — All request bodies validated server-side before touching the DB
- **express-mongo-sanitize** — NoSQL injection prevention
- **BOLA protection** — Ownership verified server-side before downloads and reads
- **Stripe signature verification** — Webhook payload verified with raw body before `express.json()`
- **Cloudinary signed URLs** — Time-limited (15min preview, 1hr download/read) — no public file access
- **File upload validation** — Magic byte verification (not just MIME type) on upload middleware
- **`isPurchaseVerified`** on reviews — set server-side by checking `user.library`, never trusted from client
- **No stack traces in production** — Error handler strips internal details

---

## ⚡ Performance

### Lighthouse Scores (Production Build)
| Metric | Score |
|---|---|
| Performance | **85** |
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |

### Optimizations Applied
- **Route lazy-loading** — Every page is its own chunk (4–12kb each)
- **BookPreview isolated** — 426kb pdfjs chunk only downloads when preview button is clicked
- **Admin chunk** — 384kb, only loads for admin users
- **Cloudinary image optimization** — `getCoverUrl()` helper injects `f_auto,q_auto` transforms at render time. Serves WebP/AVIF automatically. Never stores transforms in the DB.
- **Google Fonts preload** — `<link rel="preload">` + non-blocking `media="print"` pattern eliminates render-blocking
- **`fetchPriority="high"`** on Hero LCP image — largest contentful paint improvement
- **White flash prevention** — `#0F172A` background on `<html>` before React hydrates
- **TanStack Query caching** — Configurable `staleTime` per hook. Preview URLs cached for 45min (under 1hr Cloudinary expiry).
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

---

## 🗄️ Database Models

| Model | Purpose |
|---|---|
| `User` | Auth, roles, library array (owned book IDs), wishlist |
| `RefreshToken` | Rotating refresh tokens |
| `Book` | Full book document with `authorName` denormalized |
| `Author` | Author profiles with Cloudinary avatar |
| `Review` | User reviews — `isPurchaseVerified` server-set |
| `Order` | Order snapshot — items, pricing, coupon, status |
| `ProcessedEvent` | Idempotency keys for Stripe webhook events |
| `AuditLog` | Admin action audit trail |
| `Download` | Download analytics per user per book |
| `Coupon` | Discount codes with usage tracking |
| `ReadingProgress` | PDF reading position per user per book (compound unique index) |

---

## 🧑‍💻 Local Development

### Prerequisites
- Node.js 22+
- MongoDB running locally (or Atlas connection string)
- Stripe CLI (for webhook testing)
- Cloudinary account

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

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
EMAIL_FROM=Kun Bookshop <your@email.com>

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

---

## 🚢 Deployment (Railway)

1. Push to GitHub
2. Create a new Railway project → "Deploy from GitHub repo"
3. Add backend service → select `server/` → Railway auto-detects Dockerfile
4. Add frontend service → select `client/` → Railway auto-detects Dockerfile
5. Set all environment variables in the Railway dashboard (same as `.env` above, but with production values)
6. Swap Stripe test keys for live keys
7. Set `CLIENT_URL`, `API_URL`, `SITE_URL` to your Railway-assigned URLs
8. MongoDB → use **MongoDB Atlas M0 free cluster** (not a Railway addon)
9. After deploy → submit `https://yourdomain.up.railway.app/sitemap.xml` to [Google Search Console](https://search.google.com/search-console)

---

## 🔍 SEO

- `react-helmet-async` — dynamic `<title>`, `<meta>`, `canonical` per page
- **JSON-LD structured data** — `Product` schema on book pages (name, price, rating, availability)
- **Sitemap** — Express endpoint at `GET /sitemap.xml`, includes all active book pages from MongoDB, cached 1 hour
- **`robots.txt`** — Served statically, blocks `/admin` and `/api`
- **Sitelinks SearchBox** — `WebSite` JSON-LD schema with `potentialAction`
- **Open Graph + Twitter Card** — Book cover, title, description on all book pages
- Lighthouse SEO score: **100**

---

## 🐛 Key Bugs Fixed (across all phases)

| Bug | Fix |
|---|---|
| Password eye toggle breaking React Hook Form sync | Destructure RHF `onChange`, call it first, then custom handler |
| Previous user's data bleeding into next login | `queryClient.clear()` on both logout and login |
| DealsSection "Shop Now" not filtering catalog | Backend `$expr` discount filter + lazy URL param initializer in `BooksPage` |
| 401 errors on library/profile during hydration | Added `isHydrated &&` guard to all protected query hooks |
| Hero autoplay timer resetting mid-cycle | `books.length` stored in ref — stable `next/prev` callbacks |
| Similar books `authorScore` always 0 | `.toString()` on populated ObjectId before string comparison |
| Carousel arrows not showing on small screens | Replaced `books.length > 4` with actual scroll overflow state |
| EPUB in-browser reader blank pages | EPUB full read dropped — browser sandbox blocks `epubjs` scripts in `about:srcdoc` iframes |
| TanStack Query cache not cleared on logout | Explicit `queryClient.clear()` on logout, login, and failed token refresh |

---

## 📁 Build Phases

| Phase | What Was Built |
|---|---|
| 1 | Project foundation — Express + Vite scaffolding, folder structure, tooling |
| 2 | Authentication — register, login, JWT, refresh tokens, httpOnly cookies |
| 3 | Book catalog — CRUD, Cloudinary uploads, GraphQL layer, Author model |
| 4 | Cart + Stripe checkout — webhook fulfillment, idempotency |
| 5 | User library, downloads, wishlist, BOLA protection |
| 6 | Admin dashboard — analytics, user/order/author/review management |
| 7 | Book preview (PDF/EPUB), order history, profile sub-pages, GraphQL showcase |
| 8 | Coupon system, recommendations engine, hero scoring, deals section |
| 9 | Manual testing (backend + frontend) + bug fixes |
| 10–11 | Image optimization, bundle splitting, font strategy, animations, Lighthouse audit |
| SEO | Structured data, sitemap, Open Graph, Search Console setup |
| Security | Headers, CORS, rate limiting, sanitization, audit logging |
| Reading Progress | Full PDF reader for owners + MongoDB reading position persistence |
| Bug Fixes | RHF fix, cache clear on auth, discount filter, hydration race condition |
| Coupon Banner | Animated homepage coupon announcement banner |
| 12 | Docker containerization + Railway deployment |

---

## 📄 License

MIT — feel free to use this as a reference or starting point for your own projects.

---

## 👤 Author

**Kevin Mahendra**  
[GitHub](https://github.com/thekevinkun) · [LinkedIn](https://www.linkedin.com/in/kevinmahendra1997/)