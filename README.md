<div align="center">

# 🥦 FreshTrack AI

### _Scan · Track · Cook — Before It Expires_

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&logoColor=white)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**FreshTrack AI** is a smart, AI-powered food expiry tracking web application that helps you reduce food waste by scanning product expiry dates, managing your pantry inventory, and generating creative AI-powered recipes from ingredients before they go bad.

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🖼️ Screenshots](#️-screenshots)
- [🧱 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [🔌 API Reference](#-api-reference)
- [🖥️ Pages & Routes](#️-pages--routes)
- [🧠 How AI Works](#-how-ai-works)
- [💾 Data Storage](#-data-storage)
- [🎨 Design System](#-design-system)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 🔍 Smart Expiry Scanning
- **Camera-based OCR scanning** using [Tesseract.js](https://tesseract.projectnaptha.com/) — point your camera at any product label and the app extracts the expiry date automatically
- Supports multiple date formats: `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY/MM/DD`, `Best Before`, `Use By`, `Expiry`, and more
- Manual fallback entry for items that can't be scanned

### 📦 Inventory Management
- Full pantry inventory with product name, category, expiry date, and days-remaining tracking
- **Urgency-based status badges** (Fresh → Expiring Soon → Critical) with animated pulse effects
- Search & filter inventory by name or category in real time
- One-click removal of consumed or discarded items
- Data is persisted across sessions using browser `localStorage`

### 🍳 AI-Powered Recipe Generation
- Integration with **OpenAI GPT-4o** via the [Vercel AI SDK](https://sdk.vercel.ai/)
- Automatically suggests recipes based on your expiring ingredients
- Custom recipe generator where you specify preferences (dietary restrictions, cuisine style, etc.)
- Graceful fallback: generates a mock recipe if no API key is configured (perfect for demos)
- Three recipe tabs: **All Recipes**, **Quick & Easy**, and **Best Match**

### 🔔 Expiry Notifications
- Real-time notification bell in the navbar with animated badge for unread alerts
- Auto-refreshes every 60 seconds to check for critical items (≤ 3 days)
- Full-screen expiry alert modal for urgent items
- Mark notifications as read individually

### 🔐 Authentication
- Email/password login and signup flow
- Demo login mode for quick exploration (no credentials needed)
- Auth-gated routes — Scan, Inventory, and Recipes require login
- Mobile-friendly bottom navigation bar for authenticated users

### 🎨 Premium UI/UX
- Dark-mode-first cyberpunk/neon aesthetic with custom `coder-primary`, `coder-accent`, `coder-secondary` color tokens
- Smooth Framer Motion animations on all page transitions and card entries
- Glassmorphism cards with `backdrop-blur` and subtle gradient overlays
- Fully responsive — desktop sidebar nav + mobile bottom tab bar
- Animated shimmer text on headings and pulsing notification badges

---

## 🖼️ Screenshots

| Page | Description |
|------|-------------|
| **Home** | Landing page with feature cards for Scan, Track, and Recipes, plus Sign In / Create Account buttons |
| **Login** | Animated neon login form with demo login support |
| **Inventory** | Full pantry table with urgency badges, search bar, and quick-access recipe finder |
| **Scan** | Camera scanner with OCR processing overlay and manual entry option |
| **Recipes** | Recipe cards with ingredient match count, cook time, and difficulty |
| **Recipe Generator** | AI-powered custom recipe generation form with dietary preference support |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) + [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) |
| **Component Library** | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **OCR Engine** | [Tesseract.js](https://tesseract.projectnaptha.com/) |
| **AI / LLM** | [OpenAI GPT-4o](https://openai.com/) via [Vercel AI SDK](https://sdk.vercel.ai/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Date Utilities** | [date-fns](https://date-fns.org/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Font** | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| **Storage** | Browser `localStorage` |

---

## 📁 Project Structure

```
freshtrack-ai/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (ThemeProvider, Navbar, AuthCheck)
│   ├── page.tsx                # Home / Landing page
│   ├── globals.css             # Global styles & design tokens
│   ├── scan/
│   │   └── page.tsx            # Camera scanner + OCR page
│   ├── inventory/
│   │   └── page.tsx            # Pantry inventory management
│   ├── recipes/
│   │   ├── page.tsx            # Recipe suggestions listing
│   │   ├── generate/
│   │   │   └── page.tsx        # AI custom recipe generator
│   │   └── results/
│   │       └── page.tsx        # Generated recipe results
│   ├── add-manual/
│   │   └── page.tsx            # Manual product entry form
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── signup/
│   │   └── page.tsx            # Sign-up page
│   ├── profile/
│   │   └── page.tsx            # User profile page
│   ├── settings/
│   │   └── page.tsx            # App settings page
│   └── api/
│       ├── recipes/
│       │   └── route.ts        # POST /api/recipes — AI recipe generation
│       ├── notifications/
│       │   └── route.ts        # GET/POST /api/notifications
│       └── calendar/
│           └── route.ts        # Calendar integration API
│
├── components/
│   ├── navbar.tsx              # Responsive nav (desktop + mobile bottom bar)
│   ├── notifications.tsx       # Notification bell + popover
│   ├── expiry-alert.tsx        # Full-screen urgency alert modal
│   ├── auth-check.tsx          # Route guard component
│   ├── theme-provider.tsx      # next-themes wrapper
│   ├── use-router.ts           # Router utility hook
│   └── ui/                     # shadcn/ui component library
│
├── hooks/
│   └── use-toast.ts            # Toast notification hook
│
├── lib/
│   └── utils.ts                # Utility functions (cn, etc.)
│
├── styles/                     # Additional stylesheets
├── public/                     # Static assets (images, recipe photos)
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration & custom tokens
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** ≥ 18.x ([Download](https://nodejs.org/))
- **npm** ≥ 9.x (comes with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Aakansh-tandon/FreshTrack_AI.git
   cd FreshTrack_AI
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

### Environment Variables

Create a `.env.local` file in the root of the project:

```env
# OpenAI API Key — required for AI recipe generation
# Get yours at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Note:** If `OPENAI_API_KEY` is not set, the app will still work! The recipe generator automatically falls back to a built-in mock recipe generator so you can explore all features without an API key.

### Running the App

**Development server** (with hot reload):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production build:**

```bash
npm run build
npm start
```

**Lint check:**

```bash
npm run lint
```

---

## 🔌 API Reference

### `POST /api/recipes`

Generates a recipe using OpenAI GPT-4o based on provided ingredients.

**Request Body:**
```json
{
  "ingredients": ["Chicken", "Spinach", "Yogurt"],
  "preferences": ["gluten-free", "low-carb"]
}
```

**Response (success):**
```json
{
  "success": true,
  "recipe": "# Chicken Delight\n\nA delicious and easy-to-prepare dish..."
}
```

**Response (error):**
```json
{
  "error": "Failed to generate recipe"
}
```

> The system prompt instructs GPT-4o to act as a professional chef specializing in reducing food waste by using expiring ingredients creatively.

---

### `GET /api/notifications`

Returns a list of food expiry notifications based on inventory data.

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "productName": "Milk",
      "expiryDate": "2026-04-15",
      "daysLeft": 2,
      "read": false
    }
  ]
}
```

### `POST /api/notifications`

Marks a notification as read.

**Request Body:**
```json
{
  "notificationId": 1
}
```

---

## 🖥️ Pages & Routes

| Route | Auth Required | Description |
|-------|:---:|-------------|
| `/` | ❌ | Home landing page with feature overview |
| `/login` | ❌ | Email/password login + demo login |
| `/signup` | ❌ | New account registration |
| `/scan` | ✅ | Camera OCR scanner + manual entry link |
| `/add-manual` | ✅ | Manual product name + expiry date entry form |
| `/inventory` | ✅ | Full pantry inventory with search & filters |
| `/recipes` | ✅ | AI-matched recipe suggestions from expiring stock |
| `/recipes/generate` | ✅ | Custom AI recipe generator with preferences |
| `/recipes/results` | ✅ | Displays generated recipe output |
| `/profile` | ✅ | User profile page |
| `/settings` | ✅ | App preferences and settings |

---

## 🧠 How AI Works

FreshTrack AI integrates OpenAI's **GPT-4o** model through the **Vercel AI SDK** (`ai` package) to generate personalized recipes.

### Workflow

```
User selects expiring ingredients
        ↓
Frontend sends POST to /api/recipes
        ↓
Server builds a structured prompt:
  "Create a recipe using: Chicken, Spinach, Yogurt.
   Consider dietary preferences: gluten-free.
   Format with: title, description, ingredients,
   instructions, cooking time, difficulty."
        ↓
GPT-4o responds with a full markdown recipe
        ↓
Recipe is displayed to the user
```

### Fallback (Demo Mode)

When no `OPENAI_API_KEY` is configured, the server automatically generates a **structured mock recipe** using the provided ingredients — ensuring the full user experience is available at all times without needing an API key.

### OCR Engine — Tesseract.js

The camera scanner uses **Tesseract.js** (WASM-based OCR) to extract expiry dates from product images entirely in the browser — no data is sent to any external server for scanning.

The engine is configured to:
- Whitelist date-relevant characters: `0-9 / - . :`
- Match 7 common date formats including `Best Before`, `Use By`, and `Expiry` labels
- Fall back to reconstructing a date from raw number groups if no labeled format is found

---

## 💾 Data Storage

This application uses **browser `localStorage`** as its persistence layer, making it fully self-contained with no backend database required.

| Key | Value | Description |
|-----|-------|-------------|
| `isAuthenticated` | `"true"` / `null` | User authentication state |
| `inventory` | `JSON array` | List of all food inventory items |
| `recipeIngredients` | `JSON array` | Selected ingredients passed to recipe generator |

> **Note:** Data is stored per-browser and per-origin. Clearing browser data will reset the app. For production use, this would be replaced with a proper backend database and JWT-based authentication.

---

## 🎨 Design System

FreshTrack AI uses a custom dark cyberpunk theme built on top of Tailwind CSS.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `coder-primary` | `#00ff9d` (neon green) | Primary actions, active nav, badges |
| `coder-accent` | `#00d4ff` (electric blue) | Secondary actions, expiry tracking |
| `coder-secondary` | `#bf00ff` (purple) | Tertiary elements, recipe section |

### Typography

- **Font:** Inter (Google Fonts, loaded via `next/font`)
- **Headings:** Gradient text using `bg-clip-text` with `text-transparent` + `bg-gradient-to-r`
- **Body:** Muted foreground (`text-muted-foreground`) on dark backgrounds

### UI Patterns

| Pattern | Implementation |
|---------|---------------|
| **Glassmorphism cards** | `bg-card/80 backdrop-blur-sm` |
| **Neon borders** | `border-coder-primary/20` with hover states |
| **Animated entries** | Framer Motion `initial → animate` with staggered delays |
| **Pulse effects** | `animate-pulse` on critical expiry badges |
| **Shimmer headings** | `animate-text-shimmer` custom keyframe |
| **Grid background** | `bg-grid-pattern` custom CSS pattern |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit with a clear message
   ```bash
   git commit -m "feat: add barcode scanning support"
   ```
4. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a **Pull Request** against the `main` branch

### Development Guidelines

- Follow existing TypeScript and component patterns
- Use `shadcn/ui` components where possible — avoid new UI libraries
- All new pages must work in both authenticated and unauthenticated states as appropriate
- Keep the AI prompt in `app/api/recipes/route.ts` focused on food waste reduction


<div align="center">

**Built with ❤️ to reduce food waste, one expiry date at a time.**

[⬆ Back to Top](#-freshtrack-ai)

</div>
