# Snaplnk.io

**A fast, modern URL shortener with QR codes, bio pages, and click analytics.**

Snaplnk.io turns long links into short, branded URLs — with built-in QR code generation, geo-aware click tracking, and a clean dashboard to manage it all.

---

## ✨ Features

- 🔗 **Custom short links** — branded domains, custom slugs, bulk/multiple link creation
- 📊 **Click analytics** — track clicks over time, top countries/cities, device & browser breakdown
- 📱 **QR codes** — auto-generated for every link, downloadable as PNG
- 🌐 **Bio pages** — a "link in bio" style landing page per user
- 🗂️ **Link management** — archive, expire, and organize links by campaign/channel
- 🔐 **Auth** — Google, GitHub, and email sign-in via Supabase Auth
- ⚡ **Fast redirects** — Redis-backed caching for low-latency link resolution
- 🎨 **Clean dashboard UI** — built with a consistent neutral/black design system

---

## 🖼️ Preview

> _Add a screenshot or GIF of the dashboard here._
>
> ```md
> ![Snaplnk.io Dashboard](./public/screenshots/dashboard.png)
> ```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Framer Motion, react-icons |
| **Backend / API** | Node.js, Express |
| **Database** | MongoDB (link data, analytics) + Supabase/Postgres (auth, relational data) |
| **Cache / Redirect Layer** | Redis |
| **Auth** | Supabase Auth (Google, GitHub, Email) |
| **Charts** | Recharts |
| **QR Generation** | `qrcode` (or your QR provider of choice) |
| **Deployment** | Vercel (frontend) + your choice of Node host (backend) |

---

## 📁 Project Structure

```
snaplnk/
├── apps/
│   ├── web/                  # Next.js frontend + dashboard
│   │   ├── app/
│   │   │   ├── dashboard/    # Authenticated dashboard routes
│   │   │   ├── (marketing)/  # Public marketing site
│   │   │   └── [shortCode]/  # Redirect handler
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── supabase/     # Supabase client (server + browser)
│   │   └── public/
│   └── api/                  # Express backend
│       ├── src/
│       │   ├── routes/       # /links, /qr, /analytics, /bio
│       │   ├── models/       # MongoDB schemas
│       │   ├── services/     # Redis cache, QR generation, geo lookup
│       │   └── middleware/   # Auth, rate limiting
│       └── package.json
├── packages/
│   └── ui/                   # Shared UI components (optional monorepo setup)
└── README.md
```

> Adjust this to match your actual repo layout — update if you're not using a monorepo.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Redis instance (local or Upstash/Redis Cloud)
- A [Supabase](https://supabase.com) project

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/snaplnk.git
cd snaplnk
```

### 2. Install dependencies

```bash
# Frontend
cd apps/web && npm install

# Backend
cd ../api && npm install
```

### 3. Environment variables

Create a `.env.local` in `apps/web`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_DOMAIN=snapl.nk
```

Create a `.env` in `apps/api`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/snaplnk
REDIS_URL=redis://localhost:6379
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

### 4. Run locally

```bash
# Terminal 1 — backend
cd apps/api && npm run dev

# Terminal 2 — frontend
cd apps/web && npm run dev
```

Visit **http://localhost:3000** for the app and **http://localhost:4000** for the API.

---

## 🗄️ Database Schema (high level)

**`links`** (MongoDB / Postgres)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `owner` | uuid | References the authenticated user |
| `title` | string | Optional display name |
| `original_url` | string | The destination URL |
| `short_code` | string | Unique slug |
| `domain` | string | Custom or default domain |
| `qr_code_url` | string | Generated QR image URL |
| `clicks_count` | number | Denormalized total clicks |
| `is_deleted` | boolean | Soft delete flag |
| `created_at` | timestamp | |

**`link_clicks`** (event log — powers analytics/geo)
| Field | Type | Notes |
|---|---|---|
| `link_id` | uuid | References `links.id` |
| `country_code` | string | Resolved via IP geolocation |
| `city` | string | |
| `device` | string | |
| `browser` | string | |
| `created_at` | timestamp | |

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/links` | Create a short link |
| `GET` | `/api/links` | List links for authenticated user |
| `GET` | `/:shortCode` | Redirect + log click event |
| `GET` | `/api/links/:id/analytics` | Get click analytics for a link |
| `GET` | `/api/links/:id/qr` | Get/generate QR code |
| `POST` | `/api/bio-pages` | Create/update a bio page |

---

## 🧪 Scripts

```bash
npm run dev        # Start dev server
npm run build       # Production build
npm run lint         # Lint codebase
npm run test         # Run tests
```

---

## 🗺️ Roadmap

- [ ] Custom domains per user
- [ ] Team/workspace support
- [ ] Link expiration rules & password protection
- [ ] UTM builder
- [ ] Public API + API keys

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/<your-username>/snaplnk/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

Built by [Hiala](https://github.com/<your-username>) — based in Srinagar, Kashmir.