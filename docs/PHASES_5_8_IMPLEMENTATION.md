# MandiMitra Phases 5–8 implementation notes

## Transport decision
- POST /api/v1/markets/net-compare uses existing OpenRouteService road distances.
- Set OPENROUTESERVICE_API_KEY in backend/.env and provide verified market-coordinates.csv.
- Selected crop variety, grade, state, quantity and farmer-provided cost/km are required for an earnings ranking.
- Only prices reported within the last three days are eligible for a **current** net-deal recommendation; others are shown with clear exclusions.
- No rates, road distances or transport prices are guessed.

## Gemma
- Configure GEMINI_API_KEY, GEMMA_MODEL=gemma-4-26b-a4b-it, GEMMA_ENABLED=true in backend/.env.
- POST /api/v1/advisor/ask requires a verified matching mandi observation.
- The backend sends **only the matching, verified, dated market observations** to the model with strict instructions not to invent prices. An LLM output is explanatory, not a guaranteed sale price.
- The endpoint uses Google's official Gemini API REST interface, server-side key in request header.
- Bounded question size, 5 requests/minute per network address per process, bounded response length and sanitized upstream errors.
- Run a live provider test in your own environment before claiming availability; user-provided credentials are never committed.

## Profile and alerts
- Authenticated user preferences can be restored to a fresh device, without overwriting in-progress local selections.
- In-app alert worker now looks for true threshold crossings, not every observation that stays above a threshold.
- Notification API returns actual referenced observation fields where available.
- Schedule python -m scripts.process_alerts after successful data imports; scheduler/deployment wiring is environment-specific.
- SMS and WhatsApp remain disabled pending provider and affirmative opt-in.

## Voice
- Optional speech-speed selector for the existing browser Hindi/English readout.
- Voice availability depends on browser and installed device voices.

## Remaining runtime dependencies
Authentic AGMARKNET observations, audited coordinates, configured Supabase migrations/auth, a reachable Gemma API account, and hosting credentials are not provisioned by this branch. Tests use safe fixtures, never fabricated public market prices.
