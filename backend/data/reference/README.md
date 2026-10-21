# Verified mandi geocoding registry

Place `market-coordinates.csv` here after verifying every coordinate from a
trustworthy geographic dataset. No synthetic or assumed coordinates are bundled.

Required CSV columns:

`state,district,market,latitude,longitude,verified,source_url`

Only `verified=true` and a nonempty HTTPS source URL will be used. State,
district and market must match official mandi observation identifiers. This is
a basic provenance safeguard, **not independent proof of geographic accuracy**.

Distances returned by the API are straight-line/geodesic estimates and must
never be represented as road distance or transport cost.

The absence of this file is a valid configuration and returns an explicit
unavailable result instead of guessing.
