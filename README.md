# 🩺 Release Health Monitor with Sentry Integration

A full-stack CRUD application integrated with [Sentry](https://sentry.io) for **release health monitoring**, **source map de-obfuscation**, and **automated alerting**. This project demonstrates the complete lifecycle of a release from `v1.0.0` (with bugs) through `v1.1.0` (partial fix) to `v1.1.1` (fully fixed).

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Error Tracking | Sentry (`@sentry/react`, `@sentry/node`) |
| Source Maps | `@sentry/vite-plugin` (auto-upload on build) |
| Session Replay | Sentry Session Replay (100% sample rate) |

---

## 🗂️ Project Structure

```
Health-Monitor-with-Sentry-Integration/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server + Sentry init
│   │   └── routes/
│   │       └── items.js      # Full CRUD API
│   ├── scripts/
│   │   └── release.js        # Sentry release automation script
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx          # React entry + Sentry init
│   │   ├── App.jsx           # Main CRUD app
│   │   ├── index.css         # Dark-mode glassmorphism styles
│   │   └── components/
│   │       ├── NoteList.jsx     # Note display component
│   │       ├── NoteForm.jsx     # Create/edit form
│   │       └── ErrorButtons.jsx # Error simulation panel
│   ├── scripts/
│   │   └── release.js        # Frontend Sentry release script
│   ├── vite.config.js        # Sentry plugin + source map config
│   ├── package.json
│   └── .env.example
├── verification/             # Required screenshots go here
├── .gitignore
└── README.md
```

---

## ⚙️ Setup and Running Instructions

### Prerequisites

- **Node.js** v18+ and **npm**
- A **Sentry account** (free tier is sufficient): [sentry.io](https://sentry.io)
- **Two Sentry projects** created:
  - `health-monitor-frontend` (platform: React)
  - `health-monitor-backend` (platform: Node.js / Express)

---

### Step 1 — Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/lohithadamisetti123/Health-Monitor-with-Sentry-Integration.git
cd Health-Monitor-with-Sentry-Integration

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Configure Environment Variables

**Backend** — create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
SENTRY_DSN=https://YOUR_BACKEND_KEY@oXXXXXX.ingest.sentry.io/XXXXXXX
SENTRY_RELEASE=health-monitor-backend@1.1.1

SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=health-monitor-backend
```

**Frontend** — create `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_SENTRY_DSN=https://YOUR_FRONTEND_KEY@oXXXXXX.ingest.sentry.io/XXXXXXX
VITE_SENTRY_RELEASE=health-monitor-frontend@1.1.1

SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=health-monitor-frontend
```

> **Where to find these values:**
> - **DSN** → Sentry → Your Project → Settings → Client Keys (DSN)
> - **AUTH_TOKEN** → Sentry → Settings → Auth Tokens → Create New Token (scopes: `project:releases`, `org:read`, `project:write`, `project:read`)
> - **ORG** → Your organization slug in the Sentry URL: `sentry.io/organizations/YOUR-SLUG/`

---

### Step 3 — Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
# Server starts at http://localhost:3001
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

---

### Step 4 — Build Frontend (for Source Maps)

To upload source maps to Sentry (required for readable stack traces):

```bash
cd frontend
npm run build
```

The `@sentry/vite-plugin` automatically uploads source maps to Sentry during the build.

---

## 🔁 Simulating the Error Lifecycle (v1.0.0 → v1.1.1)

### Version Tagging

Tag each version in git to associate releases with Sentry:

```bash
# Start: tag as v1.0.0 with bugs
git tag v1.0.0
git push origin v1.0.0

# After partial fix: tag v1.1.0
git tag v1.1.0
git push origin v1.1.0

# Final fix: tag v1.1.1
git tag v1.1.1
git push origin v1.1.1 --tags
```

---

### Sentry Release Registration

Run the release script to register versions with Sentry:

**Frontend releases:**

```bash
cd frontend
node scripts/release.js 1.0.0
node scripts/release.js 1.1.0
node scripts/release.js 1.1.1
```

**Backend releases:**

```bash
cd backend
node scripts/release.js 1.0.0
node scripts/release.js 1.1.0
node scripts/release.js 1.1.1
```

---

### Triggering Simulated Errors

Navigate to the **"Error Testing"** tab in the running app. You will see an **Error Simulation Panel** with the following buttons:

#### `v1.0.0` — Bug Phase (trigger these first)

| Button | Error Type | What Happens |
|---|---|---|
| **💥 [v1.0.0] Unhandled Exception** | Unhandled JS exception | Throws `TypeError` in React render — caught by Sentry as **fatal** |
| **⚡ [v1.0.0] Async Promise Rejection** | Unhandled promise rejection | Backend `/api/debug/error` returns 500 → Sentry captures it |

> Change `SENTRY_RELEASE` in `.env` to `1.0.0` and restart both servers before clicking these.

#### `v1.1.0` — Partial Fix Phase

| Button | Error Type | What Happens |
|---|---|---|
| **🔧 [v1.1.0] Handled Error (captureException)** | Handled exception | Uses `Sentry.captureException()` — error captured but app doesn't crash |

> Change `SENTRY_RELEASE` to `1.1.0`, restart, then click this.

#### `v1.1.1` — Fixed Phase

| Button | Error Type | What Happens |
|---|---|---|
| **✅ [v1.1.1] Feature Now Fixed** | No error | Shows success toast — demonstrates zero crashes in v1.1.1 |
| **🚨 Trigger Alert Flood** | Multiple Sentry events | Fires 6 `captureMessage` calls to trigger the alert rule |

> Change `SENTRY_RELEASE` to `1.1.1`, restart, then use the app normally (zero errors expected).

---

## 📊 API Endpoints

The backend exposes a fully functional REST API:

| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/api/items` | List all notes | `200` |
| `GET` | `/api/items/:id` | Get a single note | `200` / `404` |
| `POST` | `/api/items` | Create a new note | `201` |
| `PUT` | `/api/items/:id` | Update a note | `200` / `404` |
| `DELETE` | `/api/items/:id` | Delete a note | `204` / `404` |
| `GET` | `/api/health` | Health check | `200` |
| `GET` | `/api/debug/error` | Trigger backend error (v1.0.0) | `500` |

---

## 🔔 Configuring Sentry Alert Rules

In **Sentry → Your Project → Alerts → Create Alert Rule**:

1. **Condition:** `Number of occurrences` is more than `5` in `1 hour`
2. **Action:** Send notification to `email` (or Slack if configured)
3. **Name:** `High Error Rate Alert`

Click the **"🚨 Trigger Alert Flood"** button in the app to send 6 events and fire this rule.

---

## 📸 Required Verification Screenshots

Place the following screenshots in the `verification/` directory:

| Filename | What to Capture |
|---|---|
| `release-v1.0.0-errors.png` | Sentry Issues tab filtered to release `1.0.0` showing 2 errors |
| `release-v1.1.0-error.png` | Sentry Issues tab filtered to release `1.1.0` showing 1 handled error |
| `sourcemap-proof.png` | Sentry error detail with readable `src/` file paths (not minified) |
| `release-health-enabled.png` | Sentry Releases page showing crash-free session % for all 3 versions |
| `release-health-comparison.png` | Side-by-side comparison: v1.0.0 (low %) vs v1.1.1 (100%) |
| `alert-rule-config.png` | Alert rule configuration screen (>5 errors in 1 hour) |
| `alert-triggered.png` | Sentry alert history / email showing the alert fired |

---

## 🔑 Key Sentry Features Demonstrated

| Feature | Implementation |
|---|---|
| **Error Tracking** | `Sentry.init()` in both frontend and backend |
| **Release Tracking** | `release` field set from env vars in both SDK inits |
| **Source Maps** | `@sentry/vite-plugin` auto-uploads on `npm run build` |
| **Session Replay** | `Sentry.replayIntegration()` at 100% session sample rate |
| **Performance Tracing** | `browserTracingIntegration` + `httpIntegration` |
| **Error Boundaries** | `<Sentry.ErrorBoundary>` wraps the entire React tree |
| **Manual Capture** | `Sentry.captureException()` and `Sentry.captureMessage()` |
| **Release Scripts** | `sentry-cli` automation via `node scripts/release.js` |
| **Alert Rules** | Configured in Sentry UI, triggered by flood script |

---

## 🏷️ License

MIT © 2026 Shamya Lohitha Damisetti
