# MandiMitra: From empty screens to genuine mandi observations

MandiMitra deliberately ships without fabricated prices. The app shows
honest empty states until it imports real AGMARKNET-derived government data.

## 1. Put private credentials in backend/.env

```dotenv
DATA_GOV_API_KEY=REPLACE_WITH_YOUR_NEW_OGD_KEY
AGMARKNET_RESOURCE_ID=9ef84268-d588-465a-a308-a864a43d0070
OPENROUTESERVICE_API_KEY=REPLACE_WITH_YOUR_ORS_KEY
DATABASE_BACKEND=snapshot
```

The public URL and Supabase publishable key belong in
`frontend/.env.local`. Never put OGD or ORS secrets in `VITE_*`.

## If the official API times out

A timeout does **not** prove the API key is wrong. It also does not confirm
government records are unavailable. New fetch logic retries transient
read/connect timeouts once (45 seconds each by default) and reports HTTP
401/403/429 separately without printing the credential.

From the **backend** folder on Windows PowerShell:

```powershell
# Non-secret connection checks; they do not validate an API key.
Resolve-DnsName api.data.gov.in
Test-NetConnection api.data.gov.in -Port 443

# Probe just five government rows first. No file/database writes.
python -m scripts.sync_mandi_catalog --page-size 5 --max-pages 1 --dry-run
```

If you still see a read timeout, try a different internet connection
(e.g. phone hotspot) to distinguish ISP/campus firewall/proxy trouble
from government service latency. Avoid looping the full nationwide
import while the API is unreachable.

Optional, in your private `backend/.env`:

```dotenv
DATA_GOV_TIMEOUT_SECONDS=60
DATA_GOV_MAX_RETRIES=1
```

Allowed timeout: 5–120 seconds. Retries: 0–3; the default is one.
Do not configure unlimited retries because government API quotas apply.
Do not share full URLs containing `api-key`, print response traces with
credentials, or paste tokens into public support chats.

Only after the five-row probe succeeds should you try a 100-row
dry-run, followed by a real import. The importer never substitutes
fabricated mandi rates for unavailable official records.

## 2. Import real records without needing Supabase to be online

From the repository root (Windows PowerShell):

```powershell
cd backend
python -m pip install -e ".[dev]"
python -m scripts.sync_mandi_catalog --page-size 100 --max-pages 3 --dry-run
```

Verify that the government API really returned observations. If it does,
import a broader catalog into the local SQLite history/snapshot:

```powershell
python -m scripts.sync_mandi_catalog --page-size 100 --max-pages 150 --offline-state "Uttar Pradesh" --offline-limit 600
```

The official service may enforce a different effective page limit. Stop
rather than guessing data if the API returns an error or malformed response.
If the daily resource has 13,000+ rows, `--max-pages 150` retrieves up to
15,000 records. The command keeps the original reporting date and source.
It writes the full verified backend snapshot and a small genuine
Uttar-Pradesh-only offline frontend snapshot. No synthetic market data.

- If the database is Supabase/PostgreSQL, run the project schema migration
  first, set `DATABASE_BACKEND=postgres`, and use the same sync command.
- The sync currently runs manually, not continuously. Do not label old
  reports as "today".
- For a production run, schedule a low-frequency daily task and monitor
  API limits/error reports, not on every farmer page load.

## 3. Start the app

```powershell
# Terminal 1, from backend/
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2, from frontend/
npm install
npm run dev
```

Inspect:
- http://localhost:8000/api/v1/health
- http://localhost:8000/api/v1/data/coverage
- http://localhost:8000/api/v1/states
- http://localhost:8000/api/v1/prices?state=Uttar%20Pradesh&commodity=Wheat

If the chosen commodity wasn't returned in the imported records, the UI
correctly shows no results. Don't change UI to fake a price.

## 4. Enable driving-distance comparison

The backend endpoint `POST /api/v1/markets/road-compare` uses OpenRouteService
server-side, but ONLY with verified mandi coordinates in
`backend/data/reference/market-coordinates.csv`.

CSV columns:
`state,district,market,latitude,longitude,verified,source_url`

Source and verify each actual mandi's coordinates before setting
`verified=true`. Do not invent locations or use district centers as mandi
points. Without a registry the frontend clearly says distance is unavailable.

The frontend provides GPS-on-click and manual lat/lon input, plus optional
quantity and farmer-provided transport rate in ₹/one-way-km. The result is
a cost estimate and NOT a guaranteed market bid.

## 5. Supabase status

The PostgreSQL schema code and migration exist, but the Supabase project must
be accessible and migrated before authenticated alerts, cloud preferences
and price history can run in PostgreSQL mode. Public price browsing works
with `DATABASE_BACKEND=snapshot`.

## 6. Existing frontend work preserved

Changes in this PR branch derive from `frontend/mandimitra-ui`.
No authenticated user sessions, secrets, fake mandi records, or actual API
credentials are checked into Git. Deployment CORS and HTTPS must be configured
separately.
