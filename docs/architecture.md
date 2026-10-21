# MandiMitra architecture — Phase 0

## Components

```text
Official data.gov.in / AGMARKNET resource
                 |
                 v
       FastAPI provider seam (Phase 1)
                 |
                 v
       Validation + standardization
      - state/district identities
      - commodity/variety
      - real reporting dates
      - INR/quintal
      - missing-data handling
                 |
                 v
       Verified versioned JSON
          /              \
 backend/data/...   frontend/public/data/...
          |               |
      FastAPI v1      Offline PWA cache
          |               |
          +------React UI-+
```

Phase 0 only creates the architecture boundaries. **No API ingestion, verified price history, actual nearby-market search or transport recommendation is implemented.**

## Data rules

- Treat `arrival_date` as the reported market date (verify semantics per source).
- Distinguish `fetched_at` from `arrival_date`.
- `null` represents missing numeric observations, never zero.
- Currency and units are explicit. Normalize to INR/quintal only after validating source units.
- Keep `state` and `district` together as a location identity.
- Market proximity requires geocodes or reliable distance information.
- The bundled snapshot is shipped with frontend assets and precached in production.
- Never expose the government API key to frontend JavaScript.

## Real integration pathway (Phase 1)

1. Retrieve government API data from the backend using HTTPX with bounded timeout/retry.
2. Validate response status, date and fields; record license/source and retrieval timestamp.
3. Normalize known aliases, without collapsing varieties/grades blindly.
4. Reject invalid price relationships and tag missing fields honestly.
5. Persist a verified snapshot on successful validation. Preserve the previous good snapshot on failure.
6. Export the same verified, attributed snapshot to frontend/public/data for offline fallback.
7. Test slow internet, stale datasets, offline reload, and different dates across markets.

## Scope decision

No database/authentication/machine-learning layer is needed for the hackathon foundation. APIs and snapshot repositories remain modular for later expansion.

