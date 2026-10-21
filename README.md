# MandiMitra 🌱

**सही भाव, बेहतर फैसला।** A Hindi-first, mobile-friendly application to help Indian farmers find **reported** mandi rates, compare markets, review genuine historical observations, and eventually estimate earnings after transport.

> **Status:** The responsive frontend now implements public price search, verified-rate cards, trends, like-for-like mandi comparison, transport estimates, optional Supabase magic-link sessions, in-app alerts, local preferences, Hindi voice, sharing, and an offline PWA shell. No government dataset has been imported, so price views intentionally show honest empty states rather than made-up prices.

## Frontend product flow

The primary flow is location → crop → optional variety/grade → latest reported price → trend → mandi comparison → transport-adjusted estimate. Public prices never require sign-in. Account features remain visibly unavailable until Supabase is configured, and SMS/WhatsApp are labelled as future integrations rather than working delivery channels.

The service worker caches only application assets and the public GET price endpoints. Authenticated alerts, notifications, preferences, and sensitive account responses are excluded from runtime caching.

## Repository layout

```text
MandiMitra/
├── frontend/           # React 19, Vite 7, TypeScript, Tailwind v4, PWA
│   ├── public/data/    # Bundled versioned verified snapshot (currently empty)
│   └── src/            # App, shared components, features, API clients
├── backend/            # FastAPI, Pydantic, Python
│   ├── app/api/v1/     # Health, prices, districts, markets, trends
│   ├── app/schemas/    # Validated mandi records
│   ├── app/services/   # Business logic and ingestion seam
│   ├── data/           # Raw, processed, and versioned snapshots
│   └── tests/
├── docs/               # Architecture, API contract, implementation plan
└── .github/workflows/  # CI
```

## Prerequisites

- Node.js 22+ (Vite 7 needs a recent Node version)
- npm
- Python 3.11+ (Python 3.12 recommended)
- Git

## Local setup (Windows PowerShell)

**Terminal A — backend**

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If Python 3.12 is not installed, replace `py -3.12` with an installed Python 3.11+ interpreter. If PowerShell blocks script activation, use `backend\.venv\Scripts\python.exe` and `backend\.venv\Scripts\uvicorn.exe` directly.

API: http://localhost:8000/docs

Health: http://localhost:8000/api/v1/health

**Terminal B — frontend**

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend: http://localhost:5173

Optional account features require these public browser values in `frontend/.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Never place a database password, Supabase service-role key, messaging token, or data.gov.in API key in any `VITE_*` variable.

The public shell remains usable when the backend is unavailable and can read the bundled verified snapshot. The government API key stays backend-only.

## Verification

```powershell
cd frontend
npm run lint
npm run build
npm test

cd ../backend
python -m pytest
python -m ruff check .
```

A production PWA service worker must be tested after building and serving over HTTPS or localhost: `npm run build` then `npm run preview`. A development-server load alone is not an offline test. The manifest currently uses the bundled SVG app icon; add dedicated maskable PNG icons before store-style distribution testing.

## API key (Phase 1 only)

1. Sign in or register at https://data.gov.in/
2. Open the user dashboard / API section and generate an API key.
3. Confirm the current API resource and data license using the official catalog.
4. Put the key **only** in `backend/.env` as `DATA_GOV_API_KEY=...`.
5. Never put it in `frontend/.env`, `VITE_*` variables or GitHub commits.

Indicative AGMARKNET dataset resource ID: `9ef84268-d588-465a-a308-a864a43d0070`. Confirm API access and current data fields before using it. No live integration is claimed yet.

Useful official references:
- https://www.data.gov.in/
- https://www.data.gov.in/help
- https://agmarknet.gov.in/home

## Data integrity commitments

- Show a **reporting date** next to every actual rate; fetched-at is separate.
- Never label an older observation "today's price."
- Missing reporting days are **missing**, not interpolated.
- Do not mix commodity varieties/grades, districts from different states, or incompatible units.
- Rates are reported market observations, not guaranteed sale offers.
- Keep a verified, provenance-tagged snapshot for offline use.
- Market comparison must not claim "nearest" until verified geolocation/distance data exists.


## Phase 1 — fetch verified government records (private key stays local)

The backend now includes real data.gov.in API ingestion. It validates reported dates,
numerical prices, market identities, and writes dated snapshots atomically.

From **Windows PowerShell**:

```powershell
# Terminal in your local MandiMitra clone:
git pull origin main
cd backend

# Only if you have not already created backend/.env:
Copy-Item .env.example .env
notepad .env
```

Replace `DATA_GOV_API_KEY=` with your **own** data.gov.in API key in `backend/.env`.
Do not paste the key in chat, screenshots, or GitHub.

Install the backend as shown above, then run from the **backend** directory:

```powershell
# Safely test access; does not change any files:
python -m scripts.fetch_mandi_data --state "Uttar Pradesh" --commodity "Wheat" --page-size 10 --pages 1 --dry-run

# Import up to 5 pages of real records into both snapshots:
python -m scripts.fetch_mandi_data --state "Uttar Pradesh" --commodity "Wheat" --page-size 100 --pages 5

# Optional narrower scope:
python -m scripts.fetch_mandi_data --state "Uttar Pradesh" --commodity "Wheat" --district "Lucknow" --pages 3
```

If the official service rejects your key, returns no records, or times out,
**nothing is overwritten**. The error output is intentionally sanitized so your
API key is not printed.

After import, start the FastAPI backend and open:
- http://localhost:8000/api/v1/commodities
- http://localhost:8000/api/v1/prices?state=Uttar%20Pradesh&commodity=Wheat

The backend snapshot is `backend/data/snapshots/mandi-snapshot.json`.
The PWA copy is `frontend/public/data/mandi-snapshot.json`.
Both contain public rate observations, source attribution, actual reporting
dates, whether the fetch was partial, and the set of applied filters.
**No API credential is saved in either snapshot.**

**Important limitation:** Importing the current daily-price resource does not
guarantee seven days of history. Only draw trends for genuinely reported dates.
The frontend consumes the public price routes, so verified imported rates appear
through the normal selection flow. Phase 1 ingestion does **not** imply a live
production feed or comprehensive nearby-mandi coverage.

## Next phases

See [docs/implementation-plan.md](docs/implementation-plan.md).



## Feature branch enhancements (phases 1–8)

Phases 1–4 introduce verified CSV-to-PWA snapshot export, grade-aware trends, date-range and gaps, offline comparison/trends, and a farmer-first price movement card. Phases 5–8 (stacked branch) introduce freshness-aware transport net comparison, server-side Gemma Q&A grounded in genuine evidence, price threshold crossings, preferences restoration and speech speed.

**Operational setup still required:** Real government observations and verified mandi coordinates are not bundled yet. Configure Supabase migration/connection, live AI provider credentials, and alert-worker secret locally before claiming end-to-end integration. Details: `docs/PHASES_1_4_IMPLEMENTATION.md` and `docs/PHASES_5_8_IMPLEMENTATION.md`.
