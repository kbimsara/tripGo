# 🧭 TripGo — AI-Powered Trip Planner

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-9-47A248?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)
![OpenRouter](https://img.shields.io/badge/OpenRouter-Free_Tier-7C3AED?style=for-the-badge&logo=openai)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Free_Maps-7EBC6F?style=for-the-badge&logo=openstreetmap)

**Plan the perfect trip with AI. Visualize on a live map. Share with the world.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [AI Providers](#-ai-providers) · [Map & Routing](#️-map--routing) · [Project Structure](#-project-structure)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Trip Designer** | Claude, OpenRouter, or local Ollama generates complete day-by-day itineraries with real GPS coordinates, viewpoints, restaurants, and travel tips |
| 📍 **Geographic Accuracy** | Destination-bounds validation ensures all AI-generated places stay within the correct city/region — no more pins scattered across wrong countries |
| 🗺️ **Interactive Map** | Live OpenStreetMap with real **road routing** via OSRM — 100% free, no API key needed |
| 🚗 **Turn-by-Turn Directions** | Actual road paths between stops with distance and drive-time labels. One-click open in Google Maps |
| 🔍 **Accurate Geocoding** | All AI-generated place names verified and corrected via **Nominatim** (OSM) with bounding-box filtering |
| 🧠 **Think-Tag Stripping** | Automatically strips `<think>...</think>` reasoning blocks from models like Qwen3 before JSON parsing |
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

### AI Providers (choose one)

| Provider | Model | Free? |
|---|---|---|
| **OpenRouter** ⭐ | `openai/gpt-oss-120b:free` | ✅ Free tier |
| **Anthropic Claude** | `claude-sonnet-4-20250514` | 💳 Paid |
| **Ollama** | Any local model | ✅ Completely free |

**Priority order:** Claude → OpenRouter → Ollama (first configured variable wins)

### Free Services Used

| Service | Purpose | Cost |
|---|---|---|
| OpenStreetMap / CartoDB | Dark map tiles | Free forever |
| OSRM | Real road routing between places | Free forever |
| Nominatim | Place name → verified GPS + bounding box | Free forever |
| OpenRouter free tier | AI generation & chat | Free (rate limited) |
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
AUTH_SECRET=your-random-secret-minimum-32-characters   # same value — required by NextAuth v5
NEXTAUTH_URL=http://localhost:3000

# ── AI Provider — pick ONE (priority: Claude → OpenRouter → Ollama) ──

# Option A: OpenRouter — free tier (recommended for zero cost)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-oss-120b:free

# Option B: Anthropic Claude (cloud)
ANTHROPIC_API_KEY=sk-ant-...

# Option C: Ollama (local, completely offline)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

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
OPENROUTER_MODEL=openai/gpt-oss-120b:free
```

`openai/gpt-oss-120b:free` is the recommended free model — 120B parameters, 131K context window, reliable structured JSON output.

Free-tier rate limits are handled with automatic **exponential backoff retry**:
`8 s → 16 s → 32 s → 64 s` (up to 4 retries per request)

Other tested free models:

| Model | Notes |
|---|---|
| `openai/gpt-oss-120b:free` ⭐ | Recommended — large, reliable JSON |
| `google/gemma-4-31b-it:free` | Good alternative, 262K context |
| `qwen/qwen3-235b-a22b:free` | Reasoning model; emits `<think>` tags (stripped automatically) |

### Option B — Anthropic Claude

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Uses `claude-sonnet-4-20250514` by default. Best quality, paid per token.

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
| **Nominatim** | `nominatim.openstreetmap.org` | Place name → GPS + bounding box |

### How Road Routing Works

```
Place A ──► OSRM API ──► Real road geometry ──► Leaflet polyline ──► Place B
                              │
                  Distance label (km + estimated drive time)
                  "Open in Google Maps" deep-link for full day route
```

### Geocoding & Coordinate Validation

AI models frequently **hallucinate GPS coordinates** — placing a Colombo restaurant in Delhi, or a Sri Lanka temple in the UK. TripGo corrects this with a multi-layer pipeline:

```
LLM output (possibly wrong coords)
        │
        ▼
stripThinkingTags()          ← remove <think> blocks (reasoning models)
        │
        ▼
GEOGRAPHIC CONSTRAINT prompt ← destination names injected into every request
        │
        ▼
getDestinationBounds()       ← Nominatim bounding box per destination
        │                       (half-diagonal clamped 15–600 km)
        ▼
Nominatim geocode            ← place name search with bounds validation
        │
        ▼
haversine distance check     ← reject candidates > radius × 1.5 from destination
        │
        ▼
Coordinate outlier filter    ← median-based 30° threshold removes any survivors
        │
        ▼
Real GPS saved to DB         ← correct map pins every time
```

**AI prompt-level rules** (SYSTEM_PROMPT rules 13–18) are the first line of defence:
- All places must be within ~20 km of the destination city
- Each day's places must be geographically clustered in the same neighbourhood
- Max route distance: 30 km/day for city trips, 100 km/day for country trips
- Multi-destination trips assign each day to exactly one destination

**Map features:**
- ✅ Real road paths via OSRM (not straight lines)
- ✅ Distance (km) + estimated drive time per segment
- ✅ Route summary panel with total distance and time
- ✅ Multi-stop Google Maps link for the full day
- ✅ Day-colored markers and polylines
- ✅ Graceful fallback to dashed straight lines if OSRM is unavailable
- ✅ ResizeObserver + `invalidateSize()` to prevent split-tile rendering bugs
- ✅ Render-token pattern prevents `fitBounds` crash when async OSRM fetch outlasts the map lifecycle

---

## 📁 Project Structure

```
tripGo/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # Sign-in page
│   │   │   └── register/page.tsx         # Registration page
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── chat/route.ts         # In-trip AI chat refinement
│   │   │   │   └── generate/route.ts     # Full trip plan generation (AI only)
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
│   │   ├── globals.css                   # Tailwind v4 theme tokens
│   │   ├── layout.tsx                    # Root layout
│   │   └── page.tsx                      # Landing page with hero search
│   ├── components/
│   │   ├── chat/ChatPanel.tsx            # AI chat interface
│   │   ├── map/TripMap.tsx               # Leaflet + OSRM routing map
│   │   ├── trip/TripCard.tsx             # Trip preview card
│   │   └── ui/
│   │       ├── Button.tsx                # Shared button component
│   │       ├── Navbar.tsx                # Responsive navbar (scroll-aware)
│   │       └── Toast.tsx                 # Toast notification system
│   ├── lib/
│   │   ├── ai/tripAI.ts                 # LLM: Claude · OpenRouter · Ollama
│   │   │                                #   + think-tag stripping + JSON repair
│   │   │                                #   + destination bounds + haversine validation
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
AUTH_SECRET=<same value as NEXTAUTH_SECRET>
NEXTAUTH_URL=https://your-domain.vercel.app

# AI — at least one required
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-oss-120b:free
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
stripThinkingTags()        ← remove <think>…</think> from reasoning models
    │
    ▼
extractJSON() + repairJSON() ← strip markdown fences, fix trailing commas
    │
    ▼
getDestinationBounds()     ← Nominatim bounding box per destination
    │
    ▼
geocodePlaces()            ← validate GPS, reject stray coords via haversine
    │
    ▼
Structured Trip object     ← saved to MongoDB via POST /api/trips
```

### Two-Step Trip Creation

The trip creation flow keeps AI generation and database persistence separate:

1. `POST /api/ai/generate` — runs `generateTripPlan()`, returns structured JSON. No DB write. Timeout: 5 min.
2. `POST /api/trips` — saves the trip to MongoDB with owner, saves counter, empty chat history.
3. Frontend redirects to `/trip/[saveData.trip._id]`.

### Geographic Bounds Validation

For every trip generation:
1. Each destination is looked up in Nominatim to retrieve its bounding box.
2. The box half-diagonal is computed as the allowed radius (clamped 15–600 km).
3. Every geocoded candidate is checked with `haversineKm()` — if it's further than `radius × 1.5` from the nearest destination, it's rejected and the next Nominatim result is tried.
4. If all candidates fail, the place snaps to the destination centre.

### Map Render-Token Race Condition

`renderMap` is async and can take several seconds to await OSRM routes. If the map is torn down (component unmount, day switch) before the await resolves, `leafletMap.current` becomes `null`. Fix:

- A `renderTokenRef` counter increments at the start of each `renderMap` call.
- Each invocation captures its own `myToken`.
- After `await Promise.all(OSRM)`, the continuation checks `myToken !== renderTokenRef.current` — stale calls bail out cleanly.
- `fitBounds` uses optional chaining (`?.`) as a final safety net.

### Coordinate Outlier Detection

Uses a **median-based** filter (not mean) with a 30° threshold to detect AI-hallucinated coordinates. The median is robust to single outliers, so multi-city trips spanning continents still work correctly.

---

## 📄 License

ISC License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using **Next.js · OpenRouter · Anthropic · OpenStreetMap · OSRM · Nominatim**

**[⭐ Star this repo](https://github.com/kbimsara/tripGo)** if you found it helpful!

</div>
