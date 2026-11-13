# FlatMate – Shared Living Management System & Chore Debt Tracker

**FlatMate** is a full-stack, production-quality, responsive web application designed for two or more flatmates to manage household chores, divide responsibilities, track pending tasks, exchange duties, and maintain a credit/debt system whenever one person completes another person's assigned work.

It also features a dedicated **Pantry & Item Debt Tracker** for tracking everyday borrowed groceries between flatmates (such as *"2 onions"*, *"1 glass of rice"*, *"1 packet of milk"*, etc.).

---

## 🌟 Key Features

### 1. User Authentication & Flat Isolation
- **JWT-based secure authentication** with bcrypt password hashing.
- Create a flat household or join an existing one using a unique **Invitation Code** (e.g. `FLAT-2026`).
- Multi-member flats with member roles (`admin`, `member`), customizable avatar colors, and contact info.
- Strict database isolation ensuring members only access their own household's data.

### 2. Household Task Management & Kanban Board
- Create, edit, and delete household tasks with categories:
  - 🧹 Cleaning
  - 🍽️ Washing dishes
  - 🍳 Cooking
  - 🛒 Grocery shopping
  - 🧺 Laundry
  - 🚿 Bathroom cleaning
  - 🗑️ Garbage disposal
  - ✨ Other
- Set priority (*Low*, *Medium*, *High*, *Urgent*), due dates, and custom effort **Credit Values** (1 to 5 credits).
- **Interactive Kanban Board** (Pending, In Progress, Completed columns) and flexible Grid view.
- Overdue chore auto-detection.

### 3. Chore Credit & Debt Ledger System (Core Feature)
- **Automatic Credit Engine**:
  - When flatmate A completes a chore assigned to flatmate B:
    1. A earns the task's credit value.
    2. B incurs a corresponding chore debt.
    3. An immutable transaction is recorded in the permanent ledger.
    4. Real-time notifications and activity logs are dispatched.
  - Completing your own assigned task marks it done without creating debt.
- **Master Credit Ledger Table**:
  - Displays: `Person | Credits Earned | Credits Owed | Net Balance`.
- **Pairwise Direct Debt Matrix**:
  - Shows direct relationships (e.g. *"Rahul owes Arghadeep 2 credits"*).
  - 1-click **Settle Up** modal to record mutual debt settlements or offsets.
- **Dispute System**:
  - Flag or dispute incorrect credit transactions with a reason.
  - Immutable audit trail preserves historical accuracy without silent deletion.

### 4. Pantry & Item Debt Tracker ("Things I Owe / Owed to Me")
- Solve the classic flatmate dilemma: *"Who borrowed what from the kitchen?"*
- Track borrowed groceries and pantry staples:
  - e.g. **2 onions**, **1 glass of rice**, **1 packet of milk**, **4 eggs**, **cooking oil**.
- Filter by:
  - *Things I Owe Flatmates*
  - *Things Owed to Me*
  - *Settled / Returned history*
- 1-click **Mark as Returned** action.

### 5. Chore Exchange & Borrowed Work
- Dedicated chore exchange hub:
  - **Ask for Help**: Request a flatmate to take over your chore.
  - **Volunteer**: Offer to take over someone else's chore to earn credits.
  - **Chore Swap**: Propose swapping two different chores between flatmates.
- Accept or decline incoming proposals with automatic task reassignment.

### 6. Friendly Flatmate Recognition & Leaderboard
- Positive, non-toxic household standings:
  - 😇 **Most Helpful Flatmate** (most chores completed for others)
  - 🏆 **Chore Master** (most overall tasks completed)
  - 💎 **Credit Tycoon** (highest credits earned)
  - 🤝 **Reliable Roomie** (maintains a balanced or positive standing)

### 7. Real-Time Socket.IO Updates & Notifications
- Instant live alerts for task assignments, completions on your behalf, exchange requests, debt settlements, and borrowed pantry items.
- Slide-in toast alerts and unread notification bell dropdown.

### 8. UI/UX Design System
- Modern SaaS aesthetic inspired by Linear, Notion, and Trello.
- **Light & Dark mode toggle** with local storage persistence.
- Fully responsive: desktop sidebar navigation and mobile bottom tab navigation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, React Router v6, Axios, Socket.IO Client, Context API |
| **Backend** | Node.js, Express.js, Socket.IO, Mongoose, JWT, bcryptjs, Morgan |
| **Database** | MongoDB Atlas (Cloud Cluster) |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** v18+ and **npm** v9+ installed.

### 2. Environment Configuration

Copy the example env files and fill in your own values:

```bash
# Backend
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secret, etc.

# Frontend (only needed for production builds)
cp client/.env.example client/.env
```

Backend `server/.env` fields:

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5001`) |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret for JWT signing |
| `JWT_EXPIRE` | Token expiry (e.g. `30d`) |
| `CLIENT_URL` | Frontend URL (for CORS) |
| `NODE_ENV` | `development` or `production` |

Frontend `client/.env` fields (only for production):

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full backend API URL, e.g. `https://flatmate-api.onrender.com/api` |
| `VITE_SOCKET_URL` | Backend origin for Socket.IO, e.g. `https://flatmate-api.onrender.com` |

### 3. Running the Application

In the root directory `/Users/arghadeep/splitshome`:

#### Start Backend:
```bash
cd server
npm start # runs on http://localhost:5001
```

#### Start Frontend:
```bash
cd client
npm run dev # runs on http://localhost:5173
```

---

## 🔑 Pre-seeded Demo Accounts

The database has been pre-seeded with sample data matching the exact scenario:

| Flatmate | Email | Password | Role | Net Chore Balance |
|---|---|---|---|---:|
| **Arghadeep Debnath** | `arghadeep@example.com` | `password123` | Admin | **+3 credits** |
| **Rahul Sharma** | `rahul@example.com` | `password123` | Member | **-2 credits** |
| **Priya Patel** | `priya@example.com` | `password123` | Member | **-1 credits** |

- **Household Name**: Emerald Heights Apt 4B
- **Invitation Code**: `FLAT-2026`

To re-seed the sample database at any time:
```bash
cd server && node seed.js
```

---

## 🚀 Production Deployment (Vercel + Render)

The app is split into two separate deployments:
- **Frontend → Vercel** (static React/Vite build)
- **Backend → Render** (Node.js/Express + Socket.IO)

---

### Step 1 — Push to GitHub

```bash
cd /Users/arghadeep/splitshome

git init
git add .
git commit -m "feat: initial FlatMate production release"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/flatmate-app.git
git branch -M main
git push -u origin main
```

> ⚠️ The `.gitignore` excludes `server/.env`, `node_modules/`, and `client/dist/` — your credentials are safe.

---

### Step 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set these build settings:

   | Field | Value |
   |---|---|
   | **Root Directory** | `server` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node index.js` |
   | **Node Version** | `18` |

4. Add **Environment Variables** in the Render dashboard:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://...` (your Atlas URI) |
   | `JWT_SECRET` | `your_long_random_secret` |
   | `JWT_EXPIRE` | `30d` |
   | `CLIENT_URL` | `https://flatmate-app.vercel.app` ← fill after Vercel deploy |

5. Click **Create Web Service** — Render will assign you a URL like:
   `https://flatmate-api.onrender.com`

> 💡 **Free tier note:** Render free services sleep after 15 min of inactivity. The first request after sleep takes ~30 s. Upgrade to Starter (\$7/mo) to keep it always-on.

---

### Step 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set these build settings:

   | Field | Value |
   |---|---|
   | **Root Directory** | `client` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
   | **Framework Preset** | Vite |

4. Add **Environment Variables** in the Vercel dashboard:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://flatmate-api.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://flatmate-api.onrender.com` |

5. Click **Deploy** — Vercel assigns you a URL like:
   `https://flatmate-app.vercel.app`

6. **Go back to Render** and update `CLIENT_URL` env var to your Vercel URL, then **redeploy** the backend.

---

### Step 4 — Verify Deployment

Hit the health check endpoint:
```
https://flatmate-api.onrender.com/api/health
```

Expected response:
```json
{ "status": "ok", "message": "FlatMate API Server is live and healthy" }
```

Then open your Vercel URL, log in with the demo credentials, and you're live! 🎉

---

### Architecture Diagram

```
Browser (Vercel CDN)
  │
  ├── HTTPS API calls → Render Web Service (Express)
  │                           │
  │                           └── MongoDB Atlas (Cloud DB)
  │
  └── WebSocket (Socket.IO) → Render Web Service
```

---

## 📁 Project Structure

```
splitshome/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # AuthContext, FlatContext, SocketContext, ThemeContext
│   │   ├── pages/           # Route-level page components
│   │   └── services/        # api.js (Axios), socket.js (Socket.IO)
│   ├── .env.example         # Frontend env template
│   └── vercel.json          # Vercel SPA rewrite + cache rules
│
├── server/                  # Node.js + Express backend
│   ├── config/              # db.js, socket.js
│   ├── controllers/         # Route logic (10 controllers)
│   ├── middleware/          # auth.js, flatAuth.js, errorHandler.js
│   ├── models/              # Mongoose schemas (8 models)
│   ├── routes/              # Express routers (10 route files)
│   ├── utils/               # notificationHelper.js, activityLogger.js
│   ├── seed.js              # Database seeder
│   ├── index.js             # App entry point
│   └── .env.example         # Backend env template
│
├── render.yaml              # Render deploy blueprint
├── .gitignore
└── README.md
```

