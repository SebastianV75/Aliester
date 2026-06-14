/**
 * google-calendar-sync — InsForge edge function
 *
 * Actions (via ?action= query param or body.action):
 *   oauth-init     — Generate Google OAuth2 URL with Calendar API scopes
 *   oauth-callback — Exchange auth code for tokens, store in calendar_connections
 *   status         — Return connection status for current user
 *   sync           — Bidirectional sync: push local events, pull remote events
 *   disconnect     — Remove the calendar connection
 */

import { createClient, createAdminClient } from 'npm:@insforge/sdk';

/* ── Constants ─────────────────────────────────────────────────────────── */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const JSON_HEADERS: Record<string, string> = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json',
};

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

/* ── Helpers ───────────────────────────────────────────────────────────── */

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function jsonError(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

function getBaseUrl(): string {
  return Deno.env.get('INSFORGE_BASE_URL') || '';
}

function getCallbackUrl(): string {
  return `${getBaseUrl()}/functions/google-calendar-sync?action=oauth-callback`;
}

function getClientCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')?.trim();
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/* ── HMAC-signed OAuth state ───────────────────────────────────────────── */

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function b64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

interface OAuthStatePayload {
  uid: string;
  exp: number;
  nonce: string;
  redir: string;
}

async function generateSignedState(
  userId: string,
  redirectUrl: string,
): Promise<string> {
  const secret = Deno.env.get('JWT_SECRET') || '';
  if (!secret) throw new Error('JWT_SECRET not configured');

  const payload: OAuthStatePayload = {
    uid: userId,
    exp: Date.now() + STATE_TTL_MS,
    nonce: crypto.randomUUID().slice(0, 8),
    redir: redirectUrl,
  };

  const payloadStr = b64urlEncode(JSON.stringify(payload));
  const sig = await hmacSign(payloadStr, secret);
  return `${payloadStr}.${sig}`;
}

async function verifySignedState(
  state: string,
): Promise<OAuthStatePayload | null> {
  const secret = Deno.env.get('JWT_SECRET') || '';
  if (!secret) return null;

  const dotIdx = state.lastIndexOf('.');
  if (dotIdx < 1) return null;

  const payloadStr = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);

  // Verify HMAC
  const expectedSig = await hmacSign(payloadStr, secret);
  if (sig !== expectedSig) return null;

  // Parse and check expiration
  try {
    const payload: OAuthStatePayload = JSON.parse(b64urlDecode(payloadStr));
    if (payload.exp < Date.now()) return null;
    if (!payload.uid || !payload.redir) return null;
    return payload;
  } catch {
    return null;
  }
}

function sanitizeRedirectUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    // Block redirects to InsForge backend
    if (parsed.hostname.includes('insforge.app')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/* ── Google OAuth helpers ──────────────────────────────────────────────── */

async function exchangeCodeForTokens(
  code: string,
  credentials: { clientId: string; clientSecret: string },
): Promise<{ access_token: string; refresh_token?: string; expires_in: number } | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: getCallbackUrl(),
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Token exchange failed:', res.status, errText);
    return null;
  }

  return res.json();
}

async function refreshAccessToken(
  refreshToken: string,
  credentials: { clientId: string; clientSecret: string },
): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) return null;
  return res.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<{ email: string } | null> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getValidAccessToken(
  connection: Record<string, unknown>,
  credentials: { clientId: string; clientSecret: string },
  db: ReturnType<typeof createClient>['database'],
): Promise<string | null> {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at as string).getTime()
    : 0;
  const now = Date.now();
  const bufferMs = 60_000; // 1 minute buffer

  if (expiresAt > now + bufferMs) {
    return connection.access_token as string;
  }

  // Token expired or about to expire — refresh
  const refreshToken = connection.refresh_token as string;
  if (!refreshToken) return null;

  const refreshed = await refreshAccessToken(refreshToken, credentials);
  if (!refreshed) return null;

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  // Update stored tokens
  await db
    .from('calendar_connections')
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq('id', connection.id as string);

  return refreshed.access_token;
}

/* ── Action handlers ───────────────────────────────────────────────────── */

async function handleOAuthInit(userId: string, body: Record<string, unknown>): Promise<Response> {
  const credentials = getClientCredentials();
  if (!credentials) {
    return jsonError('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured', 500);
  }

  // Frontend sends the URL where the user should land after OAuth callback
  const rawRedirect = (body.redirect_url as string) || '';
  const redirectUrl = sanitizeRedirectUrl(rawRedirect);
  if (!redirectUrl) {
    return jsonError('Invalid or missing redirect_url. Send the frontend URL in the request body.', 400);
  }

  let state: string;
  try {
    state = await generateSignedState(userId, redirectUrl);
  } catch (err) {
    return jsonError(`State generation failed: ${String(err)}`, 500);
  }

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: getCallbackUrl(),
    response_type: 'code',
    scope: CALENDAR_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  return jsonResponse({ authUrl, state });
}

async function handleOAuthCallback(
  url: URL,
  db: ReturnType<typeof createClient>['database'],
): Promise<Response> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Fallback when we cannot determine the frontend URL (invalid/missing state)
  const fallbackPage = (message: string) =>
    new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Calendar</title>` +
      `<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}` +
      `.box{background:white;padding:2rem;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1);text-align:center;max-width:400px}` +
      `h2{color:#e53e3e;margin-bottom:1rem}p{color:#666}</style></head>` +
      `<body><div class="box"><h2>Google Calendar</h2><p>${message}</p><p>Close this tab and return to the app.</p></div></body></html>`,
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
      },
    );

  if (error) {
    return fallbackPage(`Google returned an error: ${error}`);
  }

  if (!code || !state) {
    return fallbackPage('Missing authorization code or state parameter.');
  }

  // Verify HMAC-signed state and extract payload
  const statePayload = await verifySignedState(state);
  if (!statePayload) {
    return fallbackPage('Invalid or expired state. Please try connecting again from the app.');
  }

  const resolvedUserId = statePayload.uid;
  const frontendRedirect = statePayload.redir;

  const credentials = getClientCredentials();
  if (!credentials) {
    return new Response(null, {
      status: 302,
      headers: { ...CORS_HEADERS, Location: `${frontendRedirect}${frontendRedirect.includes('?') ? '&' : '?'}gcal_error=credentials_missing` },
    });
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code, credentials);
  if (!tokens) {
    return new Response(null, {
      status: 302,
      headers: { ...CORS_HEADERS, Location: `${frontendRedirect}${frontendRedirect.includes('?') ? '&' : '?'}gcal_error=token_exchange_failed` },
    });
  }

  // Get Google email
  const userInfo = await getGoogleUserInfo(tokens.access_token);
  const googleEmail = userInfo?.email || null;

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Upsert calendar connection: check existing first, then insert or update
  const { data: existing } = await db
    .from('calendar_connections')
    .select('id')
    .eq('user_id', resolvedUserId)
    .eq('provider', 'google')
    .maybeSingle();

  const connectionRow = {
    user_id: resolvedUserId,
    provider: 'google',
    google_email: googleEmail,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    token_expires_at: expiresAt,
    calendar_id: 'primary',
    sync_enabled: true,
  };

  let saveError;
  if (existing) {
    const { error } = await db
      .from('calendar_connections')
      .update(connectionRow)
      .eq('id', existing.id);
    saveError = error;
  } else {
    const { error } = await db
      .from('calendar_connections')
      .insert([connectionRow]);
    saveError = error;
  }

  if (saveError) {
    console.error('Save error:', saveError);
    return new Response(null, {
      status: 302,
      headers: { ...CORS_HEADERS, Location: `${frontendRedirect}${frontendRedirect.includes('?') ? '&' : '?'}gcal_error=save_failed` },
    });
  }

  // Redirect to the frontend URL with success status
  const separator = frontendRedirect.includes('?') ? '&' : '?';
  return new Response(null, {
    status: 302,
    headers: { ...CORS_HEADERS, Location: `${frontendRedirect}${separator}gcal_status=connected` },
  });
}

async function handleStatus(
  db: ReturnType<typeof createClient>['database'],
): Promise<Response> {
  const { data, error } = await db
    .from('calendar_connections')
    .select('id, provider, google_email, sync_enabled, last_sync_at, calendar_id')
    .eq('provider', 'google')
    .maybeSingle();

  if (error) {
    return jsonError(`Query error: ${error.message}`, 500);
  }

  return jsonResponse({
    connected: !!data,
    connection: data || null,
  });
}

async function handleDisconnect(
  db: ReturnType<typeof createClient>['database'],
): Promise<Response> {
  const { error } = await db
    .from('calendar_connections')
    .delete()
    .eq('provider', 'google');

  if (error) {
    return jsonError(`Delete error: ${error.message}`, 500);
  }

  // Clear sync metadata from events
  await db
    .from('events')
    .update({
      google_event_id: null,
      google_etag: null,
      google_updated: null,
      sync_status: 'local',
      external_source: null,
    })
    .eq('sync_status', 'synced');

  return jsonResponse({ disconnected: true });
}

async function handleSync(
  db: ReturnType<typeof createClient>['database'],
  userId: string,
): Promise<Response> {
  const credentials = getClientCredentials();
  if (!credentials) {
    return jsonError('Google credentials not configured', 500);
  }

  // Get connection
  const { data: connection, error: connError } = await db
    .from('calendar_connections')
    .select('*')
    .eq('provider', 'google')
    .maybeSingle();

  if (connError || !connection) {
    return jsonError('No Google Calendar connection found', 404);
  }

  // Get valid access token (refresh if needed)
  const accessToken = await getValidAccessToken(connection, credentials, db);
  if (!accessToken) {
    return jsonError('Could not obtain valid access token. Please reconnect.', 401);
  }

  const calendarId = (connection.calendar_id as string) || 'primary';
  const syncCursor = connection.sync_cursor as string | null;

  const results = {
    pushed: 0,
    pulled: 0,
    updated: 0,
    errors: [] as string[],
  };

  // ── Phase 1: Push local events to Google ──────────────────────────────
  const { data: localEvents } = await db
    .from('events')
    .select('*')
    .eq('sync_status', 'local')
    .is('google_event_id', null);

  if (localEvents && localEvents.length > 0) {
    for (const event of localEvents) {
      try {
        const gcalEvent = {
          summary: event.titulo,
          start: {
            date: event.fecha,
            // If time is set and not midnight, use dateTime instead
            ...(event.hora && event.hora !== '00:00'
              ? { dateTime: `${event.fecha}T${event.hora}:00`, timeZone: 'America/Mexico_City' }
              : {}),
          },
          end: {
            date: event.fecha,
            ...(event.hora && event.hora !== '00:00'
              ? {
                  dateTime: `${event.fecha}T${addHour(event.hora, 1)}:00`,
                  timeZone: 'America/Mexico_City',
                }
              : {}),
          },
        };

        // Remove date if dateTime is set (Google doesn't allow both)
        if (gcalEvent.start.dateTime) delete gcalEvent.start.date;
        if (gcalEvent.end.dateTime) delete gcalEvent.end.date;

        const res = await fetch(
          `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(gcalEvent),
          },
        );

        if (res.ok) {
          const created = await res.json();
          await db
            .from('events')
            .update({
              google_event_id: created.id,
              google_etag: created.etag,
              google_updated: created.updated,
              sync_status: 'synced',
              external_source: 'google',
            })
            .eq('id', event.id);
          results.pushed++;
        } else {
          const errBody = await res.text();
          results.errors.push(`Push failed for ${event.id}: ${res.status} ${errBody}`);
        }
      } catch (err) {
        results.errors.push(`Push error for ${event.id}: ${String(err)}`);
      }
    }
  }

  // ── Phase 2: Pull remote events from Google ───────────────────────────
  try {
    const listParams = new URLSearchParams({
      maxResults: '250',
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days back
      timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days forward
    });

    if (syncCursor) {
      listParams.set('syncToken', syncCursor);
    }

    const listRes = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${listParams}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      const remoteEvents = listData.items || [];
      const newSyncToken = listData.nextSyncToken || syncCursor;

      for (const gEvent of remoteEvents) {
        // Skip cancelled events
        if (gEvent.status === 'cancelled') continue;

        const fecha = gEvent.start?.date || gEvent.start?.dateTime?.split('T')[0];
        const hora = gEvent.start?.dateTime
          ? gEvent.start.dateTime.split('T')[1]?.substring(0, 5) || '00:00'
          : '00:00';

        if (!fecha) continue;

        // Check if event already exists by google_event_id
        const { data: existing } = await db
          .from('events')
          .select('id')
          .eq('google_event_id', gEvent.id)
          .maybeSingle();

        if (existing) {
          // Update existing event if Google version is newer
          const existingUpdated = existing.google_updated
            ? new Date(existing.google_updated as string).getTime()
            : 0;
          const remoteUpdated = gEvent.updated
            ? new Date(gEvent.updated).getTime()
            : 0;

          if (remoteUpdated > existingUpdated) {
            await db
              .from('events')
              .update({
                titulo: gEvent.summary || 'Sin titulo',
                fecha,
                hora,
                google_etag: gEvent.etag,
                google_updated: gEvent.updated,
                sync_status: 'synced',
              })
              .eq('id', existing.id);
            results.updated++;
          }
        } else {
          // Insert new remote event
          await db.from('events').insert([
            {
              titulo: gEvent.summary || 'Sin titulo',
              fecha,
              hora,
              color: 'blue',
              google_event_id: gEvent.id,
              google_etag: gEvent.etag,
              google_updated: gEvent.updated,
              sync_status: 'synced',
              external_source: 'google',
            },
          ]);
          results.pulled++;
        }
      }

      // Save new sync cursor
      await db
        .from('calendar_connections')
        .update({
          sync_cursor: newSyncToken,
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    } else if (listRes.status === 410) {
      // Sync token expired — need full sync. Clear cursor and retry.
      await db
        .from('calendar_connections')
        .update({ sync_cursor: null })
        .eq('id', connection.id);
      results.errors.push('Sync token expired. Full sync needed — run sync again.');
    } else {
      const errBody = await listRes.text();
      results.errors.push(`Pull failed: ${listRes.status} ${errBody}`);
    }
  } catch (err) {
    results.errors.push(`Pull error: ${String(err)}`);
  }

  return jsonResponse({
    success: results.errors.length === 0,
    ...results,
    syncedAt: new Date().toISOString(),
  });
}

/* ── Utility ───────────────────────────────────────────────────────────── */

function addHour(hora: string, hours: number): string {
  const [h, m] = hora.split(':').map(Number);
  const totalMinutes = (h + hours) * 60 + m;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/* ── Main Handler ──────────────────────────────────────────────────────── */

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  let action = url.searchParams.get('action') || '';
  let body: Record<string, unknown> = {};

  // Also read action from JSON body (SDK sends it there)
  if (req.method === 'POST') {
    try {
      body = await req.json();
      action = action || (body?.action as string) || '';
    } catch {
      // No body or invalid JSON — action stays empty
    }
  }

  if (!action) action = 'status';

  // oauth-callback can be a GET (Google redirects here)
  if (action === 'oauth-callback' && req.method === 'GET') {
    // For callback, we use the admin client because the redirect from Google
    // doesn't carry a user auth token. The userId is embedded in the signed state.
    const adminClient = createAdminClient({
      baseUrl: getBaseUrl(),
      apiKey: Deno.env.get('API_KEY'),
    });
    return handleOAuthCallback(url, adminClient.database);
  }

  // All other actions require authentication
  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!userToken) {
    return jsonError('Unauthorized', 401);
  }

  const client = createClient({
    baseUrl: getBaseUrl(),
    edgeFunctionToken: userToken,
  });

  const { data: userData } = await client.auth.getCurrentUser();
  if (!userData?.user?.id) {
    return jsonError('Unauthorized', 401);
  }

  const userId = userData.user.id;
  const db = client.database;

  switch (action) {
    case 'oauth-init':
      return handleOAuthInit(userId, body);

    case 'status':
      return handleStatus(db);

    case 'sync':
      return handleSync(db, userId);

    case 'disconnect':
      return handleDisconnect(db);

    default:
      return jsonError(`Unknown action: ${action}`, 400);
  }
}
