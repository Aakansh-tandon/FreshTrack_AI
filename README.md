<div align="center">
  <h1>FreshTrack AI</h1>
  <p><em>Scan · Track · Cook — Before It Expires</em></p>

  <p>
    <a href="https://fresh-track-ai.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/Live_Demo-00ff9d?style=for-the-badge&logo=vercel&logoColor=black" alt="Live Demo" />
    </a>
    <a href="https://github.com/Aakansh-tandon/FreshTrack_AI/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-00d4ff?style=for-the-badge" alt="License" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini 2.0" />
  </p>
</div>

## 📖 Overview

FreshTrack AI is a full-stack, AI-powered food expiry tracking and waste reduction web application. Designed with a premium dark cyberpunk aesthetic, it helps users track their pantry, intelligently predicts when items will spoil, and automatically generates recipes using expiring ingredients to minimize food waste.

---

## ✨ Features

### 📸 Smart Expiry Scanning
Camera-based OCR using `Tesseract.js` directly in the browser. It extracts expiry dates with confidence scoring (High/Medium/Low) and supports over 7 different date formats. **Privacy first:** All OCR processing happens client-side; no image data is ever sent to any external server.

### 🗄️ Full-Stack Inventory Management
A robust PostgreSQL-backed pantry tracking product name, category, expiry date, and quantity. The system auto-computes status (Fresh → Expiring Soon → Critical → Expired) and days remaining via generated columns. Row Level Security (RLS) ensures strict user data isolation.

### ⚖️ Weighted Urgency Scoring Algorithm
A dedicated FastAPI microservice calculates a dynamic urgency score per item using the formula:
`score = (1 / days_remaining) × category_weight × quantity_factor`
Items are ranked and displayed with visual urgency badges to prioritize consumption.

### 🤖 Automated Recipe Generation Pipeline
Zero user input required. When critical items are detected, a pipeline triggers: detects critical cluster → ranks by urgency → sends a structured POST request to **Google Gemini 2.0 Flash** → parses the JSON recipe response → saves to recipe history → notifies the user.

### 🍳 Custom Recipe Generator
Users can specify available ingredients alongside dietary preferences (e.g., gluten-free, vegan). This uses the same Gemini 2.0 Flash pipeline with preference injection for highly tailored culinary suggestions.

### 🔔 Smart Notifications
Database-backed, actionable alerts such as *"Milk expires in 2 days → Make Pancakes"*. The dashboard auto-refreshes these alerts every 60 seconds. Notifications are triggered automatically upon item addition and auto-recipe generation.

### 📊 Waste Reduction Analytics Dashboard
Visualizes your impact using `Recharts`. Includes a PieChart for inventory status breakdown and a BarChart comparing total category count vs. critical items. Tracks key metrics: Items Saved This Week, Waste Reduction %, Critical Count, and Total Tracked. 

### ♻️ Consumption Tracking
Allows users to mark items as Consumed or Discarded (Expired/Waste). This historical log feeds the analytics engine, enabling precise waste reduction percentage calculations.

### 🔐 Supabase Auth
Secure real email/password authentication via JWT. All routes are strictly auth-gated. A pre-configured demo account (`demo@freshtrack.ai`) with seeded realistic inventory is available for instant exploration.

### 🎨 Premium UI/UX
A sleek dark cyberpunk/neon aesthetic featuring glassmorphism cards and fluid `Framer Motion` page transitions. The interface is fully responsive, offering a desktop sidebar and a mobile bottom navigation bar, styled with custom color tokens: Primary (`#00ff9d`), Accent (`#00d4ff`), and Secondary (`#bf00ff`).

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│  Browser / Mobile Device (React 19, Tailwind, Framer)       │
│  [ Tesseract.js (In-Browser OCR) ]                          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌────────────────────────────┐  ┌─────────────────────────────┐
│      FRONTEND HOSTING      │  │        MICROSERVICE         │
│  Vercel (Next.js 16 App)   │  │  Render (FastAPI / Python)  │
│  - API Routes              ├──┼─► - Urgency Scoring         │
│  - Server Actions          │  │   - External AI Calls       │
└──────────────┬─────────────┘  └─────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌────────────────────────────┐  ┌─────────────────────────────┐
│    DATABASE & AUTH TIER    │  │       AI LLM TIER           │
│  Supabase (PostgreSQL)     │  │  Google Gemini 2.0 Flash    │
│  - Row Level Security      │  │  - JSON Recipe Generation   │
│  - JWT Auth                │  │                             │
└────────────────────────────┘  └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16, React 19, TypeScript |
| **Styling & UI** | Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend Service** | FastAPI (Python) |
| **Database & Auth** | Supabase (PostgreSQL + RLS) |
| **LLM / AI** | Google Gemini 2.0 Flash |
| **Computer Vision** | Tesseract.js |
| **Data Visualization** | Recharts |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 🗃️ Database Schema

The system relies on 4 core tables managed in Supabase PostgreSQL:

1. **`inventory_items`**
   - `id` (uuid, PK), `user_id` (uuid, FK), `name` (text), `category` (text), `expiry_date` (date), `quantity` (int), `status` (computed), `created_at` (timestamp)
2. **`consumption_logs`**
   - `id` (uuid, PK), `item_id` (uuid, FK), `user_id` (uuid, FK), `action` (text: consumed/discarded), `logged_at` (timestamp)
3. **`recipe_history`**
   - `id` (uuid, PK), `user_id` (uuid, FK), `recipe_json` (jsonb), `used_items` (text[]), `created_at` (timestamp)
4. **`notifications`**
   - `id` (uuid, PK), `user_id` (uuid, FK), `message` (text), `type` (text), `is_read` (boolean), `created_at` (timestamp)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase Account
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aakansh-tandon/FreshTrack_AI.git
   cd FreshTrack_AI
   ```

2. **Setup the Frontend (Next.js)**
   ```bash
   npm install
   ```

3. **Setup the Backend (FastAPI)**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

### Environment Variables

Create a `.env.local` in the root (for Next.js) and a `.env` in the `/backend` folder (for FastAPI).

| Variable | Location | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Your Supabase anonymous API key |
| `NEXT_PUBLIC_API_URL` | Frontend | URL of the FastAPI backend (e.g., `http://localhost:8000`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Supabase service key for backend admin operations |
| `GEMINI_API_KEY` | Backend | Google Gemini 2.0 Flash API key for recipe generation |

### Running Locally

**Start the FastAPI Backend:**
```bash
cd backend
uvicorn main:app --reload
```
*(Runs on `http://localhost:8000`)*

**Start the Next.js Frontend:**
```bash
# In the project root
npm run dev
```
*(Runs on `http://localhost:3000`)*

---

## 🔌 API Reference

The FastAPI backend exposes the following endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory` | Fetch all user inventory items. |
| `POST` | `/api/inventory` | Add a new item. Body: `{ name, category, expiry_date, quantity }` |
| `PATCH`| `/api/inventory/[id]` | Update item status or quantity. |
| `POST` | `/api/recipes` | Generate custom recipe. Body: `{ ingredients: [], preferences: [] }` |
| `GET` | `/api/notifications` | Fetch user notifications. |
| `POST` | `/api/notifications` | Create a new alert or mark as read. |
| `GET` | `/api/consumption-logs`| Fetch historical logs for analytics. |
| `GET` | `/api/auto-trigger` | Manually invoke the automated recipe pipeline. |

---

## ⚖️ Urgency Scoring

To prioritize which food needs to be eaten first, the FastAPI service calculates a score based on expiration proximity, item type, and amount.

**Formula:**
`Score = (1 / Days Remaining) × Category Weight × Quantity Factor`

**Category Weights:**
| Category | Weight | Reason |
| :--- | :--- | :--- |
| Seafood | 2.0 | Highest risk of foodborne illness |
| Meat | 1.8 | High spoilage risk |
| Dairy | 1.5 | Moderate to high spoilage risk |
| Produce | 1.2 | Moderate spoilage, visually detectable |
| Frozen/Pantry | 0.5 | Long shelf life |

*Items with higher scores receive priority placement and aggressive UI highlighting.*

---

## 🧠 AI Pipeline: Automated Recipe Generation

FreshTrack AI proactively prevents waste by suggesting what to cook before it goes bad.

1. **Trigger:** The system detects a cluster of items entering the "Critical" state (≤ 2 days remaining).
2. **Rank:** Items are sorted descending by their Urgency Score.
3. **Prompt Construction:** The backend formats the top critical ingredients into a structured prompt, enforcing JSON output requirements.
4. **LLM Invocation:** The prompt is sent to **Google Gemini 2.0 Flash**.
5. **Parsing:** The response is validated and parsed into a JSON recipe object (title, prep time, instructions, macros).
6. **Persistence & Alert:** The recipe is saved to `recipe_history` and a notification is dispatched to the user dashboard.

---

## 🎮 Demo

A pre-populated demo account is available for recruiters and reviewers to instantly explore the dashboard without setting up an account.

**Login Credentials:**
- **Email:** `demo@freshtrack.ai`
- **Password:** *(Try logging in via the demo button on the auth page)*

**What's included in the Demo:**
- A populated pantry with a mix of Fresh, Expiring Soon, and Critical items.
- Pre-calculated waste reduction analytics on the dashboard.
- Historical consumption logs.
- Generated recipes based on the current critical inventory.

---

## 🌍 Deployment

### 1. Supabase Setup
- Create a new Supabase project.
- Execute the provided SQL schema file to generate tables and RLS policies.
- Retrieve the `URL`, `Anon Key`, and `Service Role Key`.

### 2. Render Setup (FastAPI)
- Connect your GitHub repository to Render.
- Create a new **Web Service**.
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`
- Add `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to Environment Variables.

### 3. Vercel Setup (Next.js)
- Import the repository into Vercel.
- Framework Preset: Next.js.
- Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL` (pointing to the Render URL) to Environment Variables.
- Click **Deploy**.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
