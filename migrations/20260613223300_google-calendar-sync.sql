-- Google Calendar Sync: calendar_connections table + events sync columns

-- ── calendar_connections ─────────────────────────────────────────────────────
CREATE TABLE public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  google_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_cursor TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_calendar_connections" ON public.calendar_connections
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_connections TO authenticated;

CREATE INDEX idx_calendar_connections_user_id ON public.calendar_connections(user_id);
CREATE UNIQUE INDEX idx_calendar_connections_user_provider ON public.calendar_connections(user_id, provider);

CREATE TRIGGER calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ── Extend events with Google sync columns ──────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS google_etag TEXT,
  ADD COLUMN IF NOT EXISTS google_updated TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS external_source TEXT;

CREATE INDEX idx_events_google_event_id ON public.events(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX idx_events_sync_status ON public.events(sync_status) WHERE sync_status != 'synced';
