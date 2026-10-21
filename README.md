# MandiMitra 🌱

**सही भाव, बेहतर फैसला।** A Hindi-first, mobile-friendly application to help Indian farmers find **reported** mandi rates, compare markets, review genuine historical observations, and eventually estimate earnings after transport.

> **Status:** Phase 0 foundation. The UI and backend run, but no government dataset has been imported. All price views intentionally show an empty state rather than made-up prices.

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

The homepage must remain usable when the backend is unavailable (it will display a small status message). The government API key is not needed for Phase 0.

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

A production PWA service worker must be tested after building and serving over HTTPS or localhost: `npm run build` then `npm run preview`. A development-server load alone is not an offline test. Android-installable PNG icons have not yet been added.

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

## Next phases

See [docs/implementation-plan.md](docs/implementation-plan.md).

