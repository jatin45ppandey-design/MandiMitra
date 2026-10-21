# Backend phases 4–7: Supabase integration, earnings, alerts and hardening

## Current state
Code is implemented on a feature branch. Credentials are placeholders, **not tested
against a live Supabase project**. SMS/WhatsApp are deliberately disabled until verified
consent, template registration and provider setup exist. Do not claim a deployed service.

## Phase 4: Supabase PostgreSQL
1. Create a Supabase project yourself and copy the server-side PostgreSQL connection
   URI into `backend/.env` as `DATABASE_URL`. Use the correct URL-escaped password.
2. Set `DATABASE_BACKEND=postgres`.
3. Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` for server-side user token
   verification (client-side uses publishable/anon key; never server DB password).
4. From `backend/`, run `python -m scripts.migrate_postgres`. This executes
   `app/db/schema.sql` via the server-side connection. No cloud database is modified
   unless this command is actually run.
5. Import authentic CSV with:
   `python -m scripts.import_csv --file <downloaded.csv> --source-url <actual OGD page> --confirm-official-source`
6. For OGD API imports: configure a **new** private `DATA_GOV_API_KEY`, then run
   `python -m scripts.fetch_mandi_data --state "Uttar Pradesh" --commodity "Wheat" --dry-run`
   before running without `--dry-run`.
7. API read path switches to PostgreSQL only when `DATABASE_BACKEND=postgres`.
   With `snapshot`, legacy JSON/SQLite fallback is retained for local demo.
8. Security: do not grant direct table access to the frontend. Only server-side
   app accesses the DB. User endpoints verify the Supabase JWT through
   `/auth/v1/user` and filter every query by authenticated user ID.

### Remaining production safeguards
- Use a dedicated, least-privilege DB role rather than a privileged migration role
  for the live API.
- Review table grants and RLS behaviour using actual project credentials.
- Add versioned migrations instead of relying indefinitely on CREATE IF NOT EXISTS.
- Verify resource schema, licensing, API limits, historical coverage and genuine
  CSV provenance before declaring live integration ready.

## Phase 5: Estimated proceeds
`POST /api/v1/transport/estimate` accepts positive modal rate and quantity,
nonnegative cost components, and returns gross, total costs and estimated net.
Caller must supply a verified rate: this arithmetic-only endpoint does not
claim its input was independently verified. The result is not a guaranteed sale.

## Phase 6: Authentication, subscriptions and in-app alerts
- `POST /api/v1/alerts`, `GET /api/v1/alerts`, `DELETE /api/v1/alerts/{uuid}`
- `PUT /api/v1/preferences`
- `GET /api/v1/notifications`
- All user-specific endpoints require a valid Supabase bearer token.
- External messaging channel enrollment returns 422 until consent infrastructure
  has been implemented and verified.
- `python -m scripts.process_alerts` processes new official observations and
  writes idempotent in-app notification events. Run as a scheduled worker.
- No in-app notifications can be created when no actual verified data exists.

## Phase 7: Messaging and QA
- Mock provider returns `mock_only`, never `delivered`.
- SMS/WhatsApp adapter remains explicitly disabled: provider credentials alone do
  not authorize sending without consent, approved templates and event logging.
- Run from `backend/`:
  ```powershell
  python -m pip install -e ".[dev]"
  python -m ruff check .
  python -m pytest
  ```
- Run with credentials absent for unit tests. Live Supabase integration and API
  preflight require manual environment setup.
- Test DB migrations and row ownership against a dedicated staging Supabase
  instance before marking these phases production-ready.

## Codex frontend contract
FastAPI OpenAPI: `http://localhost:8000/openapi.json`.
Frontend must not contain server DB URL, private OGD API key or provider token.
Location/price endpoints remain public; alert/preference endpoints need session JWT.
