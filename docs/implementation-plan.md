# Four-hour build plan

## Scope

The problem statement requires:
1. Crop + district selection, actual latest reported rate and recent change.
2. Nearby mandi comparison for the same crop.
3. Hindi/local-language, slow-connection friendly single-screen UX.
4. Explicitly missing data rather than invented/interpolated observations.

Optional: transport-adjusted estimated earnings, price alerts, WhatsApp/SMS, voice, seasonal history.

## Phase 0 — Project foundation (code scaffold)

- React + Vite + TypeScript, Tailwind, React Router, TanStack Query.
- Hindi/English prototype shell, clear empty states, accessibility-first controls.
- FastAPI, typed Pydantic records, snapshot repository, health and versioned endpoints.
- No artificial market records or leaked API keys.
- Vitest / Pytest / lint / CI configuration.

**Do not mark Phase 0 verified until frontend npm install/build/lint/test and backend pytest/ruff succeed.**

## Phase 1 — Official dataset ingestion (~40 minutes)

- Create API key at data.gov.in and test backend-only request.
- Capture source record/date/variety/units.
- Import clean official CSV if API unreliable.
- Bundle a genuine dated snapshot with source provenance.
- Independently source enough real historical observations for a 7-day chart.
- Select demo crop/district based on verified data availability.

## Phase 2 — Farmer selection + latest rate (~35 minutes)

- Searchable commodity/district, state disambiguation.
- Large modal rate + date, unit, minimum/maximum as details.
- Clearly label stale/unreported rates.
- Empty states for missing selections/records.

## Phase 3 — Actual trends (~35 minutes)

- Genuine observations only, no fake interpolation.
- Market and variety specific 7-day series; missing days represented honestly.
- Mobile chart + readable text summary.

## Phase 4 — Mandi comparison (~35 minutes)

- Same commodity, appropriate variety/grade and comparable dates.
- Actual same-district mandis first; add nearby districts only with verified geography.
- Distinguish latest data dates and explain data mismatch.

## Phase 5 — Transport calculator (~30 minutes)

- Farmer enters quantity (quintal) and estimated transport/other costs.
- `net = modal_price * quantity - transport - other costs`.
- Clearly label indicative calculation, not guaranteed sale proceeds.

## Phase 6 — Offline, Hindi UX, demo (~55 minutes)

- Precaching of trusted snapshot and assets.
- Airplane mode reload on a previously loaded app.
- Source dates, stale warnings, slow-connection behavior.
- Mobile accessibility, Hindi translations, tests, README, release build.
- Judge demo: crop → price/date → trend → mandi compare → cost → offline.

## Kill switches

If behind schedule, skip voice, geolocation, maps, price alerts, SMS, login, database, and advanced animation. Never skip honest dates, source attribution or demo reliability.

