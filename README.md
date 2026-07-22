# Snaplnk.io

**A fast, modern URL shortener with QR code generation, click analytics, and a clean dashboard.** Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Supabase.

Shorten long URLs, generate QR codes automatically, track every click with geo-location and device analytics, and manage everything from a single dashboard.

---

## Features

### Currently Implemented

- **URL Shortening** — Create short links with auto-generated 7-character codes (using nanoid with an unambiguous alphabet that excludes 0/O/1/l/I). Custom alias support with uniqueness validation.
- **QR Code Generation** — Every shortened link gets an auto-generated QR code, uploaded to Cloudinary and downloadable as PNG.
- **Click Analytics** — Track clicks with device type, browser, OS, country/city/region (via Vercel edge geolocation), referrer domain, and bot detection. Visitor hashing for unique click counting.
- **Smart Redirect** — 302 redirects that check link activity, expiration dates, and max click limits. Bot traffic is detected and excluded from click counters.
- **Authentication** — Email/password signup and sign-in, plus Google and GitHub OAuth via Supabase Auth. Password visibility toggle and form validation.
- **Dashboard** — Personalized greeting with user name and date, four stat cards with sparkline charts (links, clicks, QR codes, bio pages), quick-create link card, click analytics chart with 7d/30d/90d range toggle, recent links card with last-click location, full links table with search/filter/tabs/row actions.
- **Link Management** — Archive/unarchive, soft delete/restore, copy short URL, download QR code, share via Web Share API, and context menu on each link row.
- **Command Palette** — Ctrl+K quick-search for navigating dashboard sections with keyboard shortcuts.
- **Responsive Design** — Mobile drawer navigation, adaptive sidebar, touch-friendly controls.

### Planned / Placeholder Pages

- Bio pages (link-in-bio landing pages)
- QR codes management view
- Archived, expired, deleted links views
- Tags, custom domains, team/workspace management
- API keys, billing/subscription, settings
- Pricing, FAQ, docs, and blog pages

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2.10 (App Router), React 19.2.4 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4, tw-animate-css, clsx, tailwind-merge |
| **UI** | shadcn/ui (base-nova), @base-ui/react, motion (Framer Motion v12) |
| **Icons** | lucide-react, react-icons (Feather, Heroicons, BoxIcons, etc.) |
| **Auth** | Supabase Auth (@supabase/ssr, @supabase/supabase-js) |
| **Database** | Supabase (PostgreSQL) with RPC functions |
| **Short Codes** | nanoid (55-char unambiguous alphabet, 7-char codes) |
| **QR Codes** | qrcode library, Cloudinary for image hosting |
| **Charts** | Recharts |
| **Validation** | Zod v4 |
| **Geolocation** | @vercel/functions (Vercel edge) |
| **User-Agent Parsing** | ua-parser-js |
| **Bot Detection** | isbot |
| **Password Hashing** | bcryptjs |
| **Date Formatting** | date-fns |
| **Deployment** | Vercel |

---

## Project Structure

```
snaplnk.io/
├── app/
│   ├── layout.tsx                    # Root layout (Geist fonts)
│   ├── page.tsx                      # Landing page (Header + Hero)
│   ├── globals.css                   # Tailwind v4 + shadcn theme tokens
│   ├── [shortCode]/
│   │   └── route.ts                  # GET /:shortCode — redirect handler
│   ├── (auth)/
│   │   └── signup/
│   │       ├── page.tsx              # Auth page wrapper
│   │       └── SignupClient.tsx      # Full auth UI (email, Google, GitHub)
│   ├── auth/
│   │   ├── actions.ts                # Server actions: signUp, signIn, signOut, OAuth
│   │   └── callback/
│   │       └── route.ts              # OAuth callback handler
│   ├── api/
│   │   ├── links/
│   │   │   ├── route.ts              # GET (list), POST (create) links
│   │   │   └── [linkId]/
│   │   │       └── route.ts          # GET, PATCH, DELETE single link
│   │   └── analytics/
│   │       └── overview/
│   │           └── route.ts          # GET daily click counts
│   └── dashboard/
│       ├── layout.tsx                # Auth-protected dashboard shell
│       ├── page.tsx                  # Main dashboard (greeting, stats, chart, links)
│       ├── links/page.tsx            # Link management view
│       ├── analytics/page.tsx        # Placeholder
│       ├── qr-codes/page.tsx         # Placeholder
│       ├── bio-pages/page.tsx        # Placeholder
│       ├── archived/page.tsx         # Placeholder
│       ├── expired/page.tsx          # Placeholder
│       ├── deleted/page.tsx          # Placeholder
│       ├── tags/page.tsx             # Placeholder
│       ├── domains/page.tsx          # Placeholder
│       ├── team/page.tsx             # Placeholder
│       ├── api-keys/page.tsx         # Placeholder
│       ├── billing/page.tsx          # Placeholder
│       └── settings/page.tsx         # Placeholder
├── components/
│   ├── SnaplnkButton.tsx             # CTA button with hover shimmer
│   ├── landing/
│   │   ├── Header.tsx                # Landing nav (scroll-aware, mobile drawer)
│   │   ├── HeaderAuthSection.tsx     # Auth-aware header controls
│   │   ├── Hero.tsx                  # Hero with URL input, badge, feature pills
│   │   └── TrustedSection.tsx        # "Trusted by 2M+" brand logo grid
│   ├── dashboard/
│   │   ├── DashboardShell.tsx        # Dashboard layout (sidebar + header + content)
│   │   ├── DashboardHeader.tsx       # Top bar (breadcrumbs, search, create btn)
│   │   ├── Sidebar.tsx               # Navigation sidebar (Overview/Manage/Account)
│   │   ├── UserMenu.tsx              # User avatar dropdown menu
│   │   ├── SearchBox.tsx             # Command palette (Ctrl+K)
│   │   └── main/
│   │       ├── DashboardGreeting.tsx  # "Welcome back, {name}" with date
│   │       ├── StatsOverview.tsx      # 4 stat cards with sparklines
│   │       ├── StatCard.tsx           # Reusable stat card
│   │       ├── CreateLinkCard.tsx     # Quick-create link input
│   │       ├── AnalyticsChart.tsx     # Click analytics area chart (7d/30d/90d)
│   │       ├── RecentLinksCard.tsx    # Recent 3 links with click locations
│   │       ├── RecentLinkActions.tsx  # Copy, download QR, share
│   │       └── LinksTable.tsx         # Full links table with search/actions
│   └── ui/
│       ├── card.tsx                   # shadcn/ui Card
│       └── interactive-grid-pattern.tsx  # Grid SVG pattern (hero background)
├── config/
│   ├── headerConfig.ts               # Landing page nav items
│   └── routeLabels.ts                # Dashboard breadcrumb labels
├── hooks/
│   └── useUser.tsx                   # Supabase auth user hook
├── lib/
│   ├── utils.ts                      # cn() utility
│   ├── supabase/
│   │   ├── client.ts                 # Browser-side Supabase client
│   │   ├── server.ts                 # Server-side Supabase client
│   │   └── middleware.ts             # Middleware Supabase client factory
│   ├── utils/
│   │   ├── generateShortCode.ts      # nanoid 7-char code generator
│   │   ├── generateQrCode.ts         # QR code buffer generator
│   │   ├── cloudinary.ts             # Cloudinary upload/delete
│   │   └── parseClickInfo.ts         # Click metadata extraction
│   └── validators/
│       └── links.schems.ts           # Zod schemas for create/update link
├── public/                           # Static assets (logos, images)
├── proxy.ts                          # Supabase auth middleware
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── components.json                   # shadcn/ui configuration
├── eslint.config.mjs                 # ESLint flat config
└── postcss.config.mjs                # PostCSS (Tailwind)
```

---

## Database Schema

The project uses Supabase (PostgreSQL). Key tables inferred from the code:

### `links`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `owner` | uuid | References auth.users |
| `title` | text | Optional display name |
| `original_url` | text | Destination URL |
| `short_code` | text | Unique slug (unique constraint) |
| `domain` | text | snaplnk.io or custom |
| `is_custom_alias` | boolean | Whether alias was user-defined |
| `qr_code_url` | text | Cloudinary QR code URL |
| `qr_code_public_id` | text | Cloudinary public ID for deletion |
| `favicon_url` | text | Site favicon |
| `clicks_count` | integer | Denormalized total clicks |
| `unique_clicks_count` | integer | Unique visitor count |
| `tags` | text[] | Array of tags |
| `is_active` | boolean | Whether link is active |
| `is_deleted` | boolean | Soft delete flag |
| `archived_link` | boolean | Archive flag |
| `expires_at` | timestamptz | Link expiration |
| `max_clicks` | integer | Max click limit |
| `is_password_protected` | boolean | Password gate |
| `password_hash` | text | bcrypt hash |
| `utm_source` | text | UTM tracking |
| `utm_medium` | text | UTM tracking |
| `utm_campaign` | text | UTM tracking |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `archived_at` | timestamptz | |
| `deleted_at` | timestamptz | |
| `last_clicked_at` | timestamptz | |

### `click_events`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `link_id` | uuid | References links.id |
| `ip_address` | text | |
| `user_agent` | text | |
| `referrer` | text | |
| `referrer_domain` | text | |
| `country` | text | |
| `country_code` | text | |
| `city` | text | |
| `region` | text | |
| `device_type` | text | mobile, tablet, desktop |
| `browser` | text | |
| `browser_version` | text | |
| `os` | text | |
| `os_version` | text | |
| `is_bot` | boolean | Bot detection flag |
| `visitor_hash` | text | SHA-256 of IP + UA |
| `clicked_at` | timestamptz | |

### Supabase RPC Functions

- `increment_clicks(p_link_id)` — Atomically increments click count
- `daily_link_counts(p_owner, p_days)` — Daily link creation counts
- `daily_click_counts(p_owner, p_days)` — Daily click totals
- `daily_qr_counts(p_owner, p_days)` — Daily QR generation counts
- `daily_bio_page_counts(p_owner, p_days)` — Daily bio page counts (placeholder)
- `get_daily_clicks_for_owner(p_owner, p_days)` — Daily click data for analytics chart

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/links` | Create a short link | Required |
| `GET` | `/api/links` | List user's links (with pagination, archive filter) | Required |
| `GET` | `/api/links/:id` | Get single link details | Required |
| `PATCH` | `/api/links/:id` | Update link (title, tags, archive, delete, etc.) | Required |
| `DELETE` | `/api/links/:id` | Permanently delete a link (removes QR from Cloudinary) | Required |
| `GET` | `/api/analytics/overview?range=7d\|30d\|90d` | Daily click counts for authenticated user | Required |
| `GET` | `/:shortCode` | Redirect to original URL and log click | Public |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (for auth + database)
- A Cloudinary account (for QR code image hosting)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd snaplnk.io

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Email/Password, Google, and GitHub auth providers
3. Create the `links` and `click_events` tables (see schema above)
4. Enable Row Level Security (RLS) policies for both tables
5. Create the RPC functions listed in the schema section

### Cloudinary Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret from the dashboard

### Run

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Architecture Highlights

### URL Shortening Flow

1. User enters a URL on the landing page or dashboard
2. `POST /api/links` validates the URL and optionally checks custom alias uniqueness
3. A 7-character short code is generated via `nanoid` (alphabet: `23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`)
4. A QR code is generated as a `Buffer` via the `qrcode` library
5. The QR buffer is uploaded to Cloudinary via `streamifier`
6. The link record is inserted into Supabase with the QR URL

### Redirect Flow

1. Visitor hits `GET /:shortCode`
2. Server queries Supabase for a matching `short_code` where `is_active = true` and `is_deleted = false`
3. Checks `expires_at` (if set) and `max_clicks` (if set)
4. If valid, fires a `logClick` function (async, fire-and-forget):
   - Parses IP, user-agent, referrer, geolocation (Vercel edge), device type, browser, OS
   - Detects bots via `isbot` (bots are logged but don't increment the click counter)
   - Generates a `visitor_hash` (SHA-256 of IP + user-agent) for unique visitor counting
   - Inserts a `click_events` row and calls `increment_clicks` RPC
5. Redirects (302) to the original URL

### Analytics

- Daily click counts are fetched via the `get_daily_clicks_for_owner` RPC
- The dashboard renders an area chart using Recharts with 7d/30d/90d range toggles
- Stat cards show sparkline trends over the last 10 days with percentage change
- Recent links display the last click location (city, country) per link

---

## Configuration

- **Next.js** — `next.config.ts` allows custom dev origins
- **TypeScript** — Strict mode enabled, path alias `@/*` maps to root
- **Tailwind CSS v4** — Theme defined in `globals.css` with OKLCH color tokens, light and dark modes, custom radii
- **shadcn/ui** — Configured with `base-nova` style in `components.json`
- **ESLint** — Flat config with `eslint-config-next` (core-web-vitals + TypeScript)

---

## Current Status

Version **0.1.0** — Early stage. Core URL shortening, QR generation, redirect, click analytics, and dashboard are functional. Many dashboard sections (analytics detail view, QR management, bio pages, tags, domains, team, billing, settings) are placeholder pages awaiting implementation.

---

## Author

Built by [Hiala](https://hila-11.com) — based in Srinagar, Kashmir.

---

## License

MIT
