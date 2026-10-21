# API contract (v1)

Development base URL: `http://localhost:8000/api/v1`

FastAPI interactive documentation: `http://localhost:8000/docs`

| Method | Endpoint | Query parameters | Response |
|---|---|---|---|
| GET | `/health` | — | `{status:"ok",service:"mandimitra-api"}` |
| GET | `/commodities` | — | `{items:string[]}` |
| GET | `/states` | — | `{items:string[]}` |
| GET | `/districts` | optional `state` | `{items:string[]}` |
| GET | `/prices` | optional `commodity,state,district,market,variety` | `PriceResponse` |
| GET | `/trends` | required `commodity,state,district,market`, optional `variety` | `TrendResponse` |
| GET | `/markets/compare` | required `commodity,state,district`, optional `variety` | `PriceResponse` |

`PriceResponse`: `{records:MarketPrice[],count:number,verified:boolean,latest_report_date:YYYY-MM-DD|null}`.

`MarketPrice` contains `state,district,market,commodity,variety,arrival_date,min_price,max_price,modal_price,price_unit,source,fetched_at`.

`TrendResponse`: `{observations:[{report_date,modal_price,market,variety}],verified:boolean,message:string|null}`.

**Phase 0 behavior:** The repository starts with zero verified records. Price list and trend endpoints return empty data honestly. They do **not** fetch live prices. Market comparison currently filters a district only; no distance-based proximity has been implemented.

**Future API contracts:** Real historical fetches, grouping and rate freshness policies are Phase 1/2 deliverables. Breaking schema changes should be documented before altering frontend consumers.

