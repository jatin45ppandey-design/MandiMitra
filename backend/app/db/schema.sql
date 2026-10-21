-- Execute using the dedicated migration command and a privileged migration role.
-- Application queries use their own restricted PostgreSQL role.
CREATE TABLE IF NOT EXISTS mandi_observations (
    identity TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    market TEXT NOT NULL,
    commodity TEXT NOT NULL,
    variety TEXT,
    grade TEXT,
    report_date DATE NOT NULL,
    record JSONB NOT NULL,
    source TEXT NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mandi_observation_lookup
    ON mandi_observations(state, district, commodity, report_date DESC);

CREATE TABLE IF NOT EXISTS farmer_preferences (
    user_id UUID PRIMARY KEY,
    language TEXT NOT NULL DEFAULT 'hi' CHECK (language IN ('hi','en')),
    default_state TEXT,
    default_district TEXT,
    default_commodity TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    commodity TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    market TEXT NOT NULL,
    variety TEXT NOT NULL,
    grade TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('above','below')),
    threshold NUMERIC(12,2) NOT NULL CHECK (threshold > 0),
    channel TEXT NOT NULL DEFAULT 'in_app'
        CHECK (channel IN ('in_app','sms','whatsapp')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS price_alerts_owner ON price_alerts(user_id);
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES price_alerts(id) ON DELETE CASCADE,
    observation_identity TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(alert_id, observation_identity, channel)
);
-- Server-side DB credentials are never exposed in browser code.
-- API ownership checks are mandatory even with RLS configured.
ALTER TABLE farmer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
-- No anonymous/client policies; all access through authenticated backend.
