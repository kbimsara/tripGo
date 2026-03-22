# 🧭 TripGo — AI-Powered Trip Planner

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-9-47A248?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Free_Maps-7EBC6F?style=for-the-badge&logo=openstreetmap)

**Plan the perfect trip with AI. Visualize on a live map. Share with the world.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Local LLM](#-run-with-local-llm-ollama) · [Project Structure](#-project-structure)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Trip Designer** | Claude AI or local LLM (Ollama) generates complete day-by-day itineraries with GPS coordinates, viewpoints, restaurants, and travel tips |
| 🗺️ **Interactive Map** | Live OpenStreetMap map with real **road routing** via OSRM — free, no API key |
| 🚗 **Turn-by-Turn Directions** | Actual road paths between stops with distance and drive-time labels. One-click to open in Google Maps |
| 📍 **Accurate Locations** | All AI-generated place coordinates are verified and corrected via **Nominatim geocoding** (OSM) |
| 💬 **Chat to Customize** | Refine your itinerary through natural conversation — swap places, change routes, add viewpoints |
| 💾 **Save & Account** | Trips saved to MongoDB under your account. Choose public or private per trip |
| 🌍 **Community Explore** | Browse public trips, save to your account, clone and customize any trip |
| 🔒 **Auth** | Secure email/password authentication with NextAuth v5 |

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** (App Router) + **React 19**
- **TypeScript 5**
- **Tailwind CSS v4**
- **Framer Motion** — animations
- **Leaflet + OpenStreetMap** — 100% free interactive maps
- **OSRM** — free open-source road routing engine

### Backend
- **Next.js API Routes** — serverless API
- **MongoDB + Mongoose** — database
- **NextAuth v5** — authentication
- **Anthropic Claude API** — AI trip generation and chat
- **Ollama** *(optional)* — run any LLM locally for free

### Free Services Used

| Service | Purpose | Cost |
|---|---|---|
| OpenStreetMap | Map tiles (via CartoDB dark) | Free forever |
| OSRM | Road routing between places | Free forever |
| Nominatim | Geocoding — place name to real GPS | Free forever |
| MongoDB Atlas | Database (free tier) | Free |
| Ollama | Local LLM inference | Free |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))
- An [Anthropic API key](https://console.anthropic.com) **OR** Ollama for local AI (see below)

### 1. Clone & Install

```bash
git clone https://github.com/kbimsara/tripGo.git
cd tripGo
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ── Database ────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/tripgo
# Atlas example:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tripgo

# ── Auth ─────────────────────────────────────────────────
NEXTAUTH_SECRET=your-random-secret-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# ── AI — choose ONE option ───────────────────────────────

# Option A: Anthropic Claude (cloud)
ANTHROPIC_API_KEY=sk-ant-...

# Option B: Ollama (local, completely free)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 4. Create Your First Account

1. Go to `/register`
2. Enter your name, email, and password
3. Click **Plan My First Trip**

---

## 🦙 Run with Local LLM (Ollama)

Run the AI **completely free and offline** using Ollama — no API key needed.

### Install Ollama

Download from **[ollama.com/download](https://ollama.com/download)**

### Choose a Model

| Model | VRAM Needed | Speed | Recommendation |
|---|---|---|---|
| `qwen2.5:3b` | ~2 GB | Very fast | Low-end GPUs / quick testing |
| `qwen2.5:7b` ⭐ | ~5 GB | Fast (GPU) | **Best balance — recommended** |
| `llama3.1:8b` | ~5 GB | Fast (GPU) | Great alternative |
| `qwen2.5:14b` | ~9 GB | Medium | Higher quality, needs 12 GB+ VRAM |

> **Legion 5 · i7-13650HX · 32 GB RAM · 8 GB VRAM** → use `qwen2.5:7b` (fits fully in VRAM ✅)

### Setup

```bash
# Download the model (one-time, ~4.7 GB)
ollama pull qwen2.5:7b

# Verify Ollama is running
curl http://localhost:11434/api/tags

# Quick test
ollama run qwen2.5:7b "Say hello"
```

Then set in `.env.local`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

---

## 🗺️ Map & Routing

TripGo uses **100% free** mapping services — no API keys required.

| Service | Endpoint | Purpose |
|---|---|---|
| **CartoDB** | `basemaps.cartocdn.com/dark_all` | Dark map tiles |
| **OSRM** | `router.project-osrm.org` | Real road routing |
| **Nominatim** | `nominatim.openstreetmap.org` | Place name → GPS coordinates |

### How Road Routing Works

```
Place A ──► OSRM API ──► Real road geometry ──► Leaflet polyline ──► Place B
                               │
                   Distance label (km + drive time)
                   "Open in Google Maps" button
```

### Why Geocoding is Important

Local LLMs often **hallucinate GPS coordinates** (e.g., putting Paris in the wrong country).
TripGo automatically fixes this: after the LLM generates the itinerary, every place name is
**geocoded via Nominatim** to get the real coordinates before saving to the database.

```
LLM output (wrong coords) ──► Nominatim geocode ──► Real GPS ──► Map shows correct location
```

Map features:
- ✅ Real road paths (not straight lines)
- ✅ Distance in km + estimated drive time per segment
- ✅ Route summary panel with total distance and time
- ✅ Multi-stop Google Maps link for the full day
- ✅ Per-segment "Navigate" buttons
- ✅ Graceful fallback to dashed lines if OSRM is unavailable

---

## 📁 Project Structure

```
tripGo/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx           # Sign-in page
│   │   │   └── register/page.tsx        # Registration page
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── chat/route.ts        # AI chat customization
│   │   │   │   └── generate/route.ts    # AI trip generation
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/       # NextAuth handler
│   │   │   │   └── register/route.ts   # User registration
│   │   │   └── trips/
│   │   │       ├── route.ts             # Create / list user trips
│   │   │       ├── public/route.ts      # Public community trips
│   │   │       └── [id]/
│   │   │           ├── route.ts         # Get / update / delete
│   │   │           └── save/route.ts    # Save trip to account
│   │   ├── dashboard/page.tsx           # User dashboard
│   │   ├── explore/page.tsx             # Community trips explorer
│   │   ├── trip/
│   │   │   ├── new/page.tsx             # AI trip creation form
│   │   │   └── [id]/page.tsx           # Trip detail + map + chat
│   │   ├── globals.css                  # Tailwind v4 theme + global styles
│   │   ├── layout.tsx                   # Root layout
│   │   └── page.tsx                     # Landing page
│   ├── components/
│   │   ├── chat/ChatPanel.tsx           # AI chat panel
│   │   ├── map/TripMap.tsx              # Leaflet map + OSRM routing
│   │   ├── trip/TripCard.tsx            # Trip card component
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Navbar.tsx
│   ├── lib/
│   │   ├── ai/tripAI.ts                # LLM generation + Nominatim geocoding
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── db/mongoose.ts              # MongoDB connection
│   │   └── utils.ts                    # Shared helpers
│   ├── middleware.ts                    # Route protection
│   ├── models/
│   │   ├── Trip.ts                     # Trip schema
│   │   └── User.ts                     # User schema
│   └── types/
│       ├── index.ts                    # Shared TypeScript types
│       └── next-auth.d.ts              # NextAuth type extensions
├── .env.local                          # ← Create this (never committed)
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🔧 Scripts

```bash
npm run dev      # Development server on localhost:3000
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

Set these environment variables in the Vercel dashboard under **Settings → Environment Variables**:

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=<32+ char random string>
NEXTAUTH_URL=https://your-domain.vercel.app
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📄 License

ISC License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using **Next.js · Claude AI · OpenStreetMap · OSRM · Nominatim**

**[⭐ Star this repo](https://github.com/kbimsara/tripGo)** if you found it helpful!

</div>
