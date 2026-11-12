# SmartDeal AI

> **Automated Gadget Price Comparison Web App for India** — Search any gadget (e.g., *iPhone 15*, *Samsung Galaxy S24*, *boAt Rockerz 450*, *MacBook Air M2*) to compare prices across **Amazon India**, **Flipkart**, **Croma**, **Reliance Digital**, and **Vijay Sales**, sorted Low to High with the cheapest deal and savings highlighted.

---

## Features

- **Zero-Setup Local Run** — Starts immediately with `npm run install-all` and `npm run dev`. No MongoDB, no `.env` file, and no API key required.
- **Dual Price Engine (Sample & Live)**
  - **Sample Mode (Default):** Generates realistic, query-specific sample prices in INR (`₹`) with a clear `Sample data` badge when `SERPAPI_KEY` is not set.
  - **Live Mode (Automatic):** Add `SERPAPI_KEY` to `server/.env` to query Google Shopping India (`gl=in`, `hl=en`) via SerpApi — no code changes needed.
- **Smart Filtering & Model Matching**
  - Filters out accessories (cases, covers, chargers, screen guards, cables) unless explicitly searched.
  - Distinguishes product variants using title token matching (e.g., `iPhone 15` vs `iPhone 15 Pro` / `Plus` / `Max`).
  - Normalizes Indian price strings (`₹79,900`, `Rs. 79,900.00`) into numeric INR values.
- **DB-Optional Storage Layer**
  - **FileStore (Default):** Persists users, wishlists, search history, and price cache as JSON files in `server/data/`.
  - **MongoStore (Automatic):** Add `MONGO_URI` to `server/.env` to switch seamlessly to MongoDB via Mongoose.
- **Caching & Resilient Fallback**
  - Caches price lookups for `CACHE_TTL_HOURS` (default `3` hours) with a **Refresh Prices** (`refresh=true`) bypass option.
  - If a store fails in Live Mode, falls back to prior live cache or shows `Price unavailable` with a direct store search link.
- **Authentication, Wishlist & History**
  - JWT + `bcryptjs` authentication (`/login`, `/register`, protected `/wishlist`).
  - Recent searches synced to `localStorage` for guests and backend storage for logged-in users.
- **Affiliate Link Ready** — `server/utils/buildAffiliateLink.js` optionally appends `AMAZON_AFFILIATE_TAG` and `FLIPKART_AFFILIATE_ID` when configured.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM, Axios, Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express, Helmet, CORS, Morgan, Express Rate Limit |
| **Auth & Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `30 req/min` IP rate limiting |
| **Storage** | Local JSON (`FileStore` default) or MongoDB (`MongoStore` via `mongoose`) |
| **Live Pricing** | SerpApi Google Shopping (`gl=in`, `hl=en`) |

---

## Quick Start (3 Steps — Zero Setup)

1. **Install all dependencies (root, server, and client):**
   ```bash
   npm run install-all
   ```

2. **Start both servers concurrently:**
   ```bash
   npm run dev
   ```

3. **Open the application:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Available Root Scripts

| Script | Description |
| :--- | :--- |
| `npm run install-all` | Installs dependencies in root, `server/`, and `client/` |
| `npm run dev` | Runs Express server (`:5000`) and Vite dev server (`:5173`) together |
| `npm run server` | Runs only the backend dev server (`nodemon`) |
| `npm run client` | Runs only the frontend dev server (`vite`) |
| `npm start` | Runs production server and `vite preview` |

---

## Project Structure

```text
smartdealAI/
├── package.json                  # Root scripts & concurrently runner
├── .gitignore
├── README.md
├── client/                       # React + Vite + Tailwind frontend
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx               # Routes & global wishlist sync
│       ├── api/axios.js          # Axios instance + JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── ProductCard.jsx
│       │   └── ProtectedRoute.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── ComparePrices.jsx
│       │   ├── Wishlist.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── About.jsx
│       │   └── Contact.jsx
│       └── utils/formatters.js
└── server/                       # Node.js + Express backend
    ├── .env.example
    ├── index.js                  # Express app, middleware & startup
    ├── package.json
    ├── config/env.js             # Default config & JWT fallback
    ├── middleware/
    │   ├── auth.js               # requireAuth & optionalAuth
    │   └── errorHandler.js
    ├── routes/
    │   ├── auth.js
    │   ├── prices.js
    │   ├── wishlist.js
    │   └── history.js
    ├── services/
    │   └── priceService.js       # Sample/Live engine, filtering & sorting
    ├── storage/
    │   ├── index.js              # Auto-selects FileStore or MongoStore
    │   ├── FileStore.js          # JSON persistence in server/data/
    │   └── MongoStore.js         # Mongoose adapter (loaded only if MONGO_URI set)
    └── utils/
        └── buildAffiliateLink.js
```

---

## Configuration (Optional)

Create `server/.env` (you can copy `server/.env.example`) whenever you want to enable Live Mode, MongoDB, or custom settings.

### 1. Enable Live Prices (SerpApi)

Add your SerpApi key to `server/.env` and restart `npm run dev`:

```env
SERPAPI_KEY=your_serpapi_api_key_here
```

At startup, the server logs `Price Mode: LIVE (SerpApi Google Shopping)`.

### 2. Switch to MongoDB Storage

Add your MongoDB connection string to `server/.env` and restart `npm run dev`:

```env
MONGO_URI=mongodb://localhost:27017/smartdeal_ai
```

At startup, the server logs `Storage: MongoDB (Mongoose connected)`.

### Environment Variables (`server/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Backend server port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin for frontend |
| `JWT_SECRET` | Dev fallback (with warning) | Secret key for signing JWT tokens |
| `CACHE_TTL_HOURS` | `3` | Duration (hours) to cache price results |
| `SERPAPI_KEY` | *(unset)* | Enables Live Google Shopping India prices |
| `MONGO_URI` | *(unset)* | Enables MongoDB storage via Mongoose |
| `AMAZON_AFFILIATE_TAG` | *(unset)* | Appends `?tag=` to Amazon India links |
| `FLIPKART_AFFILIATE_ID` | *(unset)* | Appends `?affid=` to Flipkart links |

---

## API Reference

| Method & Endpoint | Auth | Description |
| :--- | :--- | :--- |
| `GET /api/health` | Public | Server status, active storage adapter, price mode, and cache TTL |
| `GET /api/prices` | Optional | Query params: `query` (2–100 chars), `sort` (`asc` \| `desc`), `store` (`all` \| `amazon` \| `flipkart` \| `other`), `refresh` (`true` \| `false`) |
| `POST /api/auth/register` | Public | Register user (`name`, `email`, `password`) and return JWT |
| `POST /api/auth/login` | Public | Authenticate user and return JWT |
| `GET /api/auth/me` | Required | Get currently authenticated user profile |
| `GET /api/wishlist` | Required | List saved wishlist items |
| `POST /api/wishlist` | Required | Add or update a gadget in wishlist |
| `DELETE /api/wishlist/:id` | Required | Remove a gadget from wishlist |
| `GET /api/history` | Required | Fetch user's recent search queries (up to 15) |

---

## Security & Privacy Notes

- External API keys (`SERPAPI_KEY`, `JWT_SECRET`, `MONGO_URI`) live strictly on the backend and are never exposed to React or browser network requests.
- `server/.env` and `server/data/` are excluded via `.gitignore`.
- All `/api/*` routes are protected with `helmet`, CORS origin rules, and IP-based rate limiting (`30 requests/minute`).
