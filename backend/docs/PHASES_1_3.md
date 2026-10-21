# Backend phases 1–3 implementation notes

## Phase 1: Official data
- Keep the existing authenticated OGD client and atomic JSON snapshot script.
- API access requires a **new private** `DATA_GOV_API_KEY` in `backend/.env`.
- For API-free imports, download a **genuine** CSV from data.gov.in and run:
  `python -m scripts.import_csv --file PATH.csv --source-url https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi --dry-run`
- Remove `--dry-run` once data and CSV header mapping have been verified.
- No synthetic production prices and no automatic trust of arbitrary user-uploaded CSV.
- Official API schema and authenticated resource access remain **unverified** until an actual key-based request succeeds.

## Phase 2: Durable MVP history
- SQLite `backend/data/mandi-history.sqlite3` stores validated records and deduplicates logical observations across imports.
- The API reads verified history when present, otherwise the pre-existing versioned JSON snapshot.
- SQLite is an intentionally dependency-free MVP persistence layer. A PostgreSQL migration is deferred until source coverage and actual query volume justify it.
- Original source rows and source-file hashes should be archived for production auditing; current SQLite model is not a full provenance ledger.

## Phase 3: Honest comparisons
- `/api/v1/markets/compare` returns at most one latest record per mandi+variety+grade in the chosen district.
- To get a strictly comparable set, supply both `variety` and `grade`; without these the endpoint returns an explicit scope clarification.
- `/api/v1/markets/nearby` does **not** invent GPS distance; it returns a 422 explaining that a verified coordinate directory is necessary.
- API maintains explicit reporting dates; older values are never called today's price.

## Tests / remaining gates
- Tests were added for ingestion storage, duplicate imports and comparison.
- Execute `python -m pytest` and `python -m ruff check .` from `backend/` after pulling this branch.
- No live data, successful authenticated API call, or CI pass is claimed without evidence.
