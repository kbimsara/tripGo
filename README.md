<![CDATA[<div align="center">

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/MongoDB-9-47A248?style=for-the-badge&logo=mongodb" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" />
<img src="https://img.shields.io/badge/OpenStreetMap-Free_Maps-7EBC6F?style=for-the-badge&logo=openstreetmap" />

# 🧭 TripGo — AI-Powered Trip Planner

**Plan the perfect trip with AI. Visualize on a live map. Share with the world.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Local LLM](#-run-with-local-llm-ollama) · [Project Structure](#-project-structure) · [Screenshots](#-screenshots)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Trip Designer** | Claude AI (or local LLM via Ollama) generates complete day-by-day itineraries with GPS coordinates, viewpoints, restaurants, and travel tips |
| 🗺️ **Interactive Map** | Live OpenStreetMap-powered map with real **road routing** via OSRM (free, no API key) |
| 🚗 **Turn-by-Turn Directions** | Real road paths between stops with distance & drive time labels. One-click to open in Google Maps |
| 💬 **Chat to Customize** | Refine your itinerary through natural conversation — swap places, change routes, add viewpoints |
| 💾 **Save & Account** | Trips saved to MongoDB under your account. Choose public or private per trip |
| 🌍 **Community Explore** | Browse public trips, save to your account, clone and customize any trip |
| 🔒 **Auth** | Secure email/password authentication with NextAuth v5 |

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** (App Router) + **React 19**
- **TypeScript 5**
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — animations
- **Leaflet** + **OpenStreetMap** — 100% free interactive maps
- **OSRM** — free open-source road routing engine

### Backend
- **Next.js API Routes** — serverless API
- **MongoDB** + **Mongoose** — database & ODM
- **NextAuth v5** — authentication
- **Anthropic Claude API** — AI trip generation & chat
- **Ollama** (optional) — run any LLM locally for free

### Free Services Used
| Service | Purpose | Cost |
|---|---|---|
| OpenStreetMap | Map tiles | Free forever |
| OSRM | Road routing between places | Free forever |
| MongoDB Atlas | Database (free tier) | Free |
| Ollama | Local LLM inference | Free |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))
- An [Anthropic API key](https://console.anthropic.com) **OR** Ollama (local LLM — see below)

### 1. Clone & Install

```bash
git clone https://github.com/kbimsara/tripGo.git
cd tripGo
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ── Database ────────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/tripgo
# or Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tripgo

# ── Auth ────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=your-random-secret-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000

# ── AI (choose one) ─────────────────────────────────────────────────────
# Option A — Anthropic Claude (cloud)
ANTHROPIC_API_KEY=sk-ant-...

# Option B — Ollama (local, free) — see section below
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

### 3. Run Development Server

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

Run the AI **completely free and offline** using Ollama.

### Install Ollama

Download from **[ollama.com/download](https://ollama.com/download)** (Windows/Mac/Linux)

### Choose a Model (based on your hardware)

| Model | VRAM | Speed | Best For |
|---|---|---|---|
| `qwen2.5:3b` | ~2 GB | Very fast | Low-end GPUs, quick testing |
| `qwen2.5:7b` ⭐ | ~5 GB | Fast (GPU) | **Recommended — best balance** |
| `llama3.1:8b` | ~5 GB | Fast (GPU) | Alternative to qwen2.5:7b |
| `qwen2.5:14b` | ~9 GB | Medium | High quality, needs 12GB+ VRAM |

> **Your Specs (Legion 5, i7-13650HX, 32GB RAM, 8GB VRAM):**
> → Use `qwen2.5:7b` — fits fully in VRAM, fast GPU inference ✅

### Setup Commands

```bash
# Pull your chosen model (one-time download)
ollama pull qwen2.5:7b

# Verify it's running
curl http://localhost:11434/api/tags

# Test it
ollama run qwen2.5:7b "Say hello"
```

Then set in `.env.local`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
# Leave ANTHROPIC_API_KEY unset to use Ollama
```

---

## 📁 Project Structure

```
tripGo/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx          # Sign-in page
│   │   │   └── register/page.tsx       # Registration page
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── chat/route.ts       # AI chat customization endpoint
│   │   │   │   └── generate/route.ts   # AI trip generation endpoint
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/      # NextAuth handler
│   │   │   │   └── register/route.ts  # User registration
│   │   │   └── trips/
│   │   │       ├── route.ts            # Create / list user trips
│   │   │       ├── public/route.ts     # Public trips feed
│   │   │       └── [id]/
│   │   │           ├── route.ts        # Get / update / delete trip
│   │   │           └── save/route.ts   # Save trip to account
│   │   ├── dashboard/page.tsx          # User dashboard
│   │   ├── explore/page.tsx            # Community trips explorer
│   │   ├── trip/
│   │   │   ├── new/page.tsx            # AI trip creation form
│   │   │   └── [id]/page.tsx          # Trip detail + map + chat
│   │   ├── globals.css                 # Global styles + Tailwind v4 theme
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Landing page
│   ├── components/
│   │   ├── chat/ChatPanel.tsx          # AI chat customization panel
│   │   ├── map/TripMap.tsx             # Leaflet map + OSRM road routing
│   │   ├── trip/TripCard.tsx           # Trip card component
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Navbar.tsx
│   ├── lib/
│   │   ├── ai/tripAI.ts               # AI generation & chat logic
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── db/mongoose.ts             # MongoDB connection
│   │   └── utils.ts                   # Helpers
│   ├── middleware.ts                   # Auth route protection
│   ├── models/
│   │   ├── Trip.ts                    # Trip Mongoose model
│   │   └── User.ts                    # User Mongoose model
│   └── types/
│       ├── index.ts                   # Shared TypeScript types
│       └── next-auth.d.ts             # NextAuth type extensions
├── .env.local                         # ← Create this (not committed)
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## 🗺️ Map & Routing

TripGo uses **100% free** mapping services:

| Service | URL | Usage |
|---|---|---|
| **OpenStreetMap** | `tile.openstreetmap.org` | Map tiles (dark theme via CartoDB) |
| **OSRM** | `router.project-osrm.org` | Real road routing between places |
| **Nominatim** | `nominatim.openstreetmap.org` | Geocoding (place name → coordinates) |

### How Road Routing Works

```
Place A ──► OSRM API ──► Real road geometry ──► Leaflet polyline ──► Place B
                                ↓
                    Distance label (km + drive time)
                    "Open in Google Maps" button
```

Features:
- ✅ Actual road path (not straight lines)
- ✅ Distance in km + estimated drive time per segment
- ✅ Route summary panel (total km, total drive time)
- ✅ "Open in Maps" → full multi-stop Google Maps URL
- ✅ Per-segment "Navigate" buttons
- ✅ Falls back to dashed straight line if OSRM is unavailable

---

## 🔧 Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=<32+ char random string>
NEXTAUTH_URL=https://your-domain.com
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

---

## 📄 License

ISC License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using **Next.js**, **Claude AI**, **OpenStreetMap** & **OSRM**

**[⭐ Star this repo](https://github.com/kbimsara/tripGo)** if you found it helpful!

</div>
]]>
