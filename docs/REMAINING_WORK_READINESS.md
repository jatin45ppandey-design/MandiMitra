# Data readiness and environment setup

The project deliberately **does not include made-up mandi rates or coordinates**.

## 1. Import actual mandi prices

The official dataset is the Government of India AGMARKNET price resource:
https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi

From `backend/`, run:

```powershell
python -m scripts.doctor
python -m scripts.sync_mandi_catalog --page-size 5 --max-pages 1 --dry-run
```

If the API times out, download **authentic** CSV from the official site and save it outside Git:

```powershell
python -m scripts.import_csv --file "C:\path\official-mandi.csv" --source-url "https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi" --confirm-official-source --offline-state "Uttar Pradesh" --offline-limit 3000
```

For continued ingestion, the sync and manual importer both export snapshots from the
**cumulative verified history**. Offline selection balances markets and reported
days, instead of displaying only the newest few hundred national rows. No
unreported day gets an inferred rate.

## 2. Scheduled sync

The optional `.github/workflows/mandimitra-data-sync.yml` schedule imports genuine
records only if a `MANDIMITRA_DATA_GOV_API_KEY` GitHub Actions repository secret
is configured. A successful run uploads verified backend and frontend
snapshots as a downloadable Actions artifact. It **does not auto-commit changing
government data to main** or assume the hosting server updates automatically.
Review the report dates and coverage and publish the artifact through a separate
release step. This also avoids secretly overwriting the last known-good bundle
on API failure.

## 3. Verified mandi locations

After importing genuine records:

```powershell
python -m scripts.coordinate_candidates --state "Uttar Pradesh" --output "data/reference/market-coordinate-candidates.csv"
```

This generates names only. Every new candidate has a blank latitude/longitude,
`verified=false`, and no source. Verify **the exact mandi yard location**
and add a legitimate HTTPS source before moving approved rows into
`data/reference/market-coordinates.csv`. Never substitute district centers.
Once populated, nearby-road comparisons offer a mandi origin dropdown, with GPS
and manual coordinate fallback.

## 4. Supabase and AI

The connected Supabase account must have access to the **correct MandiMitra project**
before any actual PostgreSQL migration. At the time this branch was authored, that
project was not returned by the available connected Supabase project list; no remote
database migration was performed. Configure the backend connection and review
`backend/app/db/schema.sql` before changing `DATABASE_BACKEND=postgres`.
Set Gemma credentials only in `backend/.env` or hosting secrets and verify
provider availability separately.

## 5. Verify

```powershell
cd backend
python -m pytest
python -m ruff check .
cd ../frontend
npm ci
npm run lint
npm run build
npm test
```

Real-world acceptance additionally requires mobile testing, genuine dataset freshness,
source attribution, routing API validity, PostgreSQL auth and live AI connection.
