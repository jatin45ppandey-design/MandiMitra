# MandiMitra phases 1–4: verified-data and offline acceptance

No fabricated mandi prices are shipped. Import an authentic government CSV/API response before demoing numbers.

## Government API timeout fallback
From backend/ (with virtual environment active):

```powershell
python -m scripts.import_csv --file "C:\\path\\to\\official-mandi.csv" --source-url "https://www.data.gov.in/" --confirm-official-source --offline-state "Uttar Pradesh" --offline-limit 1200
python -m scripts.doctor
```

The CSV must genuinely come from the stated data.gov.in page; the URL flag is operator-supplied provenance, **not cryptographic verification**. After successful import the command now publishes both the backend snapshot and an offline frontend subset, preserving genuine historical dates.

If history is already stored:
```powershell
python -m scripts.export_offline_snapshot --state "Uttar Pradesh" --limit 1200
```

Existing snapshots are preserved if the import fails validation. For Supabase set up and migrate the PostgreSQL schema before switching `DATABASE_BACKEND=postgres`; test connectivity and privileges. Snapshot and SQLite work locally without cloud credentials.

## Features
- Backend trends now filter by selected grade and optional report date range.
- Repeated reported dates count as one historical day.
- Frontend price trends and same-district comparisons fall back to bundled, verified records when the API is unreachable.
- Chart gaps are explicit when reported dates skip days, without interpolating missing prices.
- 7-, 30-, 90-day and all-available reported price views.
- Only real imported data may be marked verified.

## Verify
```powershell
cd backend
python -m pytest
python -m ruff check .
cd ../frontend
npm run lint
npm run build
npm test
```
Test production PWA behavior via `npm run build` and `npm run preview`, then disconnect the network after the first online visit. Data from new CSV imports is not automatically checked into Git: review the verified snapshot before committing.
