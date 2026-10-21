# MandiMitra: OpenRouteService road-distance integration

## Why
A mandi with the highest reported modal price need not yield the highest
estimated proceeds once the farmer enters **their own** freight assumptions.
The ORS `driving-car` matrix API provides estimated road distances and
travel durations. It does **not** provide a freight quote or guarantee a road
route is accessible to a loaded agricultural vehicle.

## Backend-only configuration
Add to `backend/.env` (never into `frontend/.env.local`):

```dotenv
OPENROUTESERVICE_API_KEY=REPLACE_WITH_YOUR_PRIVATE_KEY
```

The actual key is never committed. Never add `VITE_OPENROUTESERVICE_API_KEY`.

## Data prerequisites
1. Import authentic AGMARKNET-derived prices, with correct reporting dates,
   varieties and grades.
2. Populate `backend/data/reference/market-coordinates.csv` from trusted,
   independently checked mandi locations using the format in
   `backend/data/reference/README.md`.
3. With no coordinates, the API returns `coordinates_unavailable`, not
   an invented distance or location.
4. ORS routing does not fill gaps in prices or mandi positions.

## API contract
`POST /api/v1/markets/road-compare`, with JSON body:

```json
{
  "state": "Uttar Pradesh",
  "commodity": "Wheat",
  "variety": "Dara",
  "grade": "FAQ",
  "latitude": 26.85,
  "longitude": 80.95,
  "radius_km": 150,
  "quantity_quintals": "10",
  "cost_per_km": "25",
  "fixed_cost": "500"
}
```

**The example coordinates are illustrative farmer coordinates, not an
assertion that a specific mandi has verified coordinates.**

- Only like-for-like markets in the requested state are selected.
- Candidates are prefiltered by straight-line radius; at most 8 locations
  are sent to ORS, keeping API quota exposure bounded per request.
- ORS sends the farmer origin and up to 8 markets in a single matrix call.
- Output includes `distance_km` (road), `duration_minutes`, each
  original `observation` with actual reported date and an optional
  `estimate`.
- `estimated transport cost = (one-way road km × farmer-entered ₹/km)
  + farmer-entered fixed cost`.
- `estimated net proceeds = modal price × quantity - estimated cost`.
- Costs are **user-provided**, not a freight quote. Round-trip, tolls,
  vehicle type and handling costs must be included explicitly by the user
  in their cost assumptions.
- Omit both `quantity_quintals` and `cost_per_km` to get road
  distance/time only; no amount is invented.
- `source=OpenRouteService` refers to routing; the price record's
  own `source` indicates mandi-price provenance.
- Unreachable routes return `route_status=unreachable` with null metrics,
  never a made-up distance.
- Missing key, throttling or API failures return a sanitized HTTP 503.
- The routing key is never sent to the frontend.

## Frontend integration
The user's new frontend code on `frontend/mandimitra-ui` must be pushed
before modifying UI safely. Then add an optional `Driving distance` action
to Mandi Compare/Transport UI, calling the typed backend endpoint only after
a user action with granted geolocation or manually entered coordinates.

- Show road km and **estimated** travel duration.
- Distinguish straight-line results from the existing `/markets/nearby`.
- Label cost input as one-way rupees per kilometre.
- Display price reporting dates and stale/missing-data states.
- When API returns `coordinates_unavailable`, show a data-coverage
  message rather than an empty fabricated map.
- Avoid autosending GPS coordinates on every render or keystroke.

## Production security / operation
- Gate the endpoint with API gateway/IP rate limiting and request budgets
  before public deployment (it consumes a third-party paid/quota resource).
- Consider a bounded server-side response cache with short TTL.
- Monitor ORS quota/429s without logging tokens or users' GPS coordinates.
- Only request location with explicit permission. Do not persist farmer
  geolocation in database by default.
- Test with `python -m pytest backend/tests/test_openrouteservice.py`
  from repository root; from `backend/` run `python -m pytest`.
- Live ORS verification remains pending until the local private key and
  verified mandi coordinates are configured.
