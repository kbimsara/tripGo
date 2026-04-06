# 🧭 TripGo — AI-Powered Trip Planner

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-9-47A248?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)
![OpenRouter](https://img.shields.io/badge/OpenRouter-Qwen3-7C3AED?style=for-the-badge&logo=openai)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Free_Maps-7EBC6F?style=for-the-badge&logo=openstreetmap)

**Plan the perfect trip with AI. Visualize on a live map. Share with the world.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [AI Providers](#-ai-providers) · [Map & Routing](#️-map--routing) · [Project Structure](#-project-structure)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Trip Designer** | Claude, OpenRouter (Qwen3), or local Ollama generates complete day-by-day itineraries with real GPS coordinates, viewpoints, restaurants, and travel tips |
| 🗺️ **Interactive Map** | Live OpenStreetMap with real **road routing** via OSRM — 100% free, no API key needed |
| 🚗 **Turn-by-Turn Directions** | Actual road paths between stops with distance and drive-time labels. One-click open in Google Maps |
| 📍 **Accurate Geocoding** | All AI-generated place names are verified and corrected via **Nominatim** (OSM) with country-filtered lookups |
| 🧠 **Think-Tag Stripping** | Automatically strips `<think>...</think>` reasoning blocks from models like Qwen3 before parsing |
| ⚡ **Rate Limit Retry** | Exponential backoff (8 s → 16 s → 32 s → 64 s) for OpenRouter 429 errors |
| 💬 **AI Chat to Customize** | Refine your itinerary through natural conversation — swap places, add viewpoints, change routes |
| 💾 **Save & Account** | Trips saved to MongoDB under your account. Public or private per trip |
| 🌍 **Community Explore** | Browse public trips, save favourites, clone and customize any community trip |
| 🔒 **Auth** | Secure email/password authentication with NextAuth v5 + bcrypt + JWT |

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** (App Router) + **React 19**
- **TypeScript 5**
- **Tailwind CSS v4** — light theme with custom color scale & animations
- **Framer Motion** — page transitions and micro-interactions
- **Leaflet + React Leaflet** — interactive map with CartoDB dark tiles
- **OSRM** — free open-source road routing engine

### Backend
- **Next.js API Routes** — serverless API
- **MongoDB + Mongoose** — nested subdocuments for days, places, routes, chat history
- **NextAuth v5** — credentials provider, JWT strategy
- **Zustand + SWR** — client-side state and data fetching

### AI Providers (choose one or more)

| Provider | Model | Free? |
|---|---|---|
| **OpenRouter** ⭐ | `qwen/qwen3.6-plus:free` | ✅ Free tier |
| **Anthropic Claude** | `claude-3-5-sonnet` | 💳 Paid |
| **Ollama** | Any local model | ✅ Completely free |

### Free Services Used

| Service | Purpose | Cost |
|---|---|---|
| OpenStreetMap / CartoDB | Dark map tiles | Free forever |
| OSRM | Real road routing between places | Free forever |
| Nominatim | Place name → verified GPS coordinates | Free forever |
| OpenRouter free tier | Qwen3 AI generation & chat | Free (rate limited) |
| MongoDB (local) | Trip and user storage | Free |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **MongoDB** — local install or [Atlas free tier](https://www.mongodb.com/atlas)
- **An AI provider** — OpenRouter free key, Anthropic API key, or Ollama (see [AI Providers](#-ai-providers))

### 1. Clone & Install

```bash
git clone https://github.com/kbimsara/tripGo.git
cd tripGo
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ── Database ─────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/tripgo
# Atlas example:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tripgo

# ── Auth ──────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=your-random-secret-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# ── AI Provider — pick ONE (or more, priority order below) ──

# Option A: OpenRouter — free Qwen3 model (recommended for zero cost)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=qwen/qwen3.6-plus:free

# Option B: Anthropic Claude (cloud)
ANTHROPIC_API_KEY=sk-ant-...

# Option C: Ollama (local, completely offline)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

**Priority order:** Claude → OpenRouter → Ollama (first set variable wins)

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 4. Create Your First Account

1. Navigate to `/register`
2. Enter name, email, and password
3. Hit **Plan Trip** and describe your dream destination

---

## 🤖 AI Providers

### Option A — OpenRouter (Recommended · Free)

Get a free API key at **[openrouter.ai](https://openrouter.ai)**:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=qwen/qwen3.6-plus:free
```

**Qwen3** is a reasoning model that emits `<think>...</think>` blocks before the JSON output.
TripGo automatically strips these before parsing, so you get clean itineraries every time.

Free-tier rate limits are handled with automatic **exponential backoff retry**:
`8 s → 16 s → 32 s → 64 s` (up to 4 retries per request)

### Option B — Anthropic Claude

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Uses `claude-3-5-sonnet-20241022` by default. Best quality, paid per token.

### Option C — Ollama (Fully Offline · Free)

Run the AI completely **locally** — no internet or API key needed.

**Install:** Download from [ollama.com/download](https://ollama.com/download)

| Model | VRAM | Speed | Notes |
|---|---|---|---|
| `qwen2.5:3b` | ~2 GB | Very fast | Good for low-end GPUs |
| `qwen2.5:7b` ⭐ | ~5 GB | Fast | **Best balance — recommended** |
| `llama3.1:8b` | ~5 GB | Fast | Great alternative |
| `qwen2.5:14b` | ~9 GB | Medium | Higher quality |

```bash
# Pull the model (one-time download)
ollama pull qwen2.5:7b

# Verify it's running
curl http://localhost:11434/api/tags
```

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

---

## 🗺️ Map & Routing

TripGo uses **100% free** mapping services — no API keys required.

| Service | Endpoint | Purpose |
|---|---|---|
| **CartoDB Dark** | `basemaps.cartocdn.com/dark_all` | Map tiles |
| **OSRM** | `router.project-osrm.org` | Real road routing |
| **Nominatim** | `nominatim.openstreetmap.org` | Place name → verified GPS |

### How Road Routing Works

```
Place A ──► OSRM API ──► Real road geometry ──► Leaflet polyline ──► Place B
                              │
                  Distance label (km + estimated drive time)
                  "Open in Google Maps" deep-link for full day route
```

### Geocoding & Coordinate Validation

AI models (especially local/free ones) frequently **hallucinate GPS coordinates** — putting a Sri Lanka temple in the UK, or a restaurant in the Caribbean. TripGo fixes this with a two-step pipeline:

```
LLM output (possibly wrong coords)
        │
        ▼
stripThinkingTags()     ← remove <think> blocks (Qwen3)
        │
        ▼
Nominatim geocode       ← country-filtered lookup (e.g. countrycodes=lk)
        │
        ▼
Outlier filter          ← median-based 30° threshold removes bad coords
        │
        ▼
Real GPS saved to DB    ← correct map pins every time
```

**Map features:**
- ✅ Real road paths via OSRM (not straight lines)
- ✅ Distance (km) + estimated drive time per segment
- ✅ Route summary panel with total distance and time
- ✅ Multi-stop Google Maps link for the full day
- ✅ Day-colored markers and polylines
- ✅ Graceful fallback to dashed lines if OSRM is unavailable
- ✅ ResizeObserver + `invalidateSize()` to prevent split-tile rendering bugs

---

## 📁 Project Structure

```
tripGo/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # Sign-in page (light theme)
│   │   │   └── register/page.tsx         # Registration page
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── chat/route.ts         # In-trip AI chat refinement
│   │   │   │   └── generate/route.ts     # Full trip plan generation
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/        # NextAuth handler
│   │   │   │   └── register/route.ts    # User registration endpoint
│   │   │   └── trips/
│   │   │       ├── route.ts              # Create / list user trips
│   │   │       ├── public/route.ts       # Public community feed
│   │   │       └── [id]/
│   │   │           ├── route.ts          # GET / PUT / DELETE trip
│   │   │           └── save/route.ts     # Save / clone trip
│   │   ├── dashboard/page.tsx            # User trip dashboard
│   │   ├── explore/page.tsx              # Community trips explorer
│   │   ├── trip/
│   │   │   ├── new/page.tsx              # AI trip creation form
│   │   │   └── [id]/page.tsx            # Trip detail — map + itinerary + chat
│   │   ├── globals.css                   # Tailwind v4 theme + light UI tokens
│   │   ├── layout.tsx                    # Root layout
│   │   └── page.tsx                      # Landing page with hero search
│   ├── components/
│   │   ├── chat/ChatPanel.tsx            # AI chat interface (light theme)
│   │   ├── map/TripMap.tsx               # Leaflet + OSRM routing map
│   │   ├── trip/TripCard.tsx             # Trip preview card
│   │   └── ui/
│   │       ├── Button.tsx                # Shared button component
│   │       ├── Navbar.tsx                # Responsive navbar (scroll-aware)
│   │       └── Toast.tsx                 # Toast notification system
│   ├── lib/
│   │   ├── ai/tripAI.ts                 # LLM integration: Claude, OpenRouter, Ollama
│   │   │                                #   + think-tag stripping + JSON repair
│   │   │                                #   + Nominatim geocoding + retry logic
│   │   ├── auth.ts                      # NextAuth config (credentials + JWT)
│   │   ├── db/mongoose.ts               # MongoDB connection pooling
│   │   └── utils.ts                     # Shared helpers (cn, formatDate, etc.)
│   ├── middleware.ts                     # Route protection (dashboard, trip/*, explore)
│   ├── models/
│   │   ├── Trip.ts                      # Trip Mongoose schema
│   │   └── User.ts                      # User Mongoose schema
│   └── types/
│       ├── index.ts                     # Trip, Place, Day, User, ChatMessage types
│       └── next-auth.d.ts               # Session type extensions
├── .env.example                         # Template for environment variables
├── .env.local                           # ← Create this locally (never committed)
├── CLAUDE.md                            # Project notes for Claude AI
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🔧 Scripts

```bash
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## 🌐 Deployment (Vercel)

```bash
npm i -g vercel
vercel
```

Set these in the Vercel dashboard under **Settings → Environment Variables**:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/tripgo
NEXTAUTH_SECRET=<32+ character random string>
NEXTAUTH_URL=https://your-domain.vercel.app

# AI — at least one required
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=qwen/qwen3.6-plus:free
# or
ANTHROPIC_API_KEY=sk-ant-...
```

> **Note:** Ollama is not available on Vercel (serverless). Use OpenRouter or Anthropic for cloud deployments.

---

## 🧩 Key Architecture Notes

### AI Pipeline (`src/lib/ai/tripAI.ts`)

```
User prompt
    │
    ▼
Provider selection: Claude → OpenRouter → Ollama
    │
    ▼
LLM response (raw text)
    │
    ▼
stripThinkingTags()    ← remove <think>…</think> from reasoning models
    │
    ▼
extractJSON()          ← strip markdown fences, repair malformed JSON
    │
    ▼
Nominatim geocoding    ← validate + fix every GPS coordinate
    │
    ▼
Structured Trip object ← saved to MongoDB
```

### Coordinate Outlier Detection

Uses a **median-based** filter (not average) with a 30° threshold to detect AI-hallucinated coordinates. The median is robust to single outliers, so multi-city trips spanning continents still work correctly.

### Map Race Condition Fix

A `mapReady` state flag prevents the `renderMap` function from running before Leaflet's async initialization completes. A `ResizeObserver` calls `map.invalidateSize()` whenever the container resizes, preventing split tile rendering.

---

## 📄 License

ISC License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using **Next.js · OpenRouter · Claude AI · OpenStreetMap · OSRM · Nominatim**

**[⭐ Star this repo](https://github.com/kbimsara/tripGo)** if you found it helpful!

</div>
