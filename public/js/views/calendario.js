/* Aliester - Calendario View */

// eventosData is now loaded from InsForge via store.js

let calendarioMonth = 5; // June (0-indexed)
let calendarioYear = 2026;
let _gcalStatus = null; // { connected, connection }
let _gcalSyncing = false;

async function fetchGcalStatus() {
  try {
    const { data, error } = await window.insforge.functions.invoke('google-calendar-sync', {
      body: { action: 'status' },
    });
    if (!error && data) {
      _gcalStatus = data;
    }
  } catch (err) {
    console.error('Failed to fetch gcal status:', err);
  }
}

async function connectGoogleCalendar() {
  try {
    // Tell the function where to redirect the browser after OAuth callback
    const redirectUrl = window.location.origin + window.location.pathname + '#/calendario';
    const { data, error } = await window.insforge.functions.invoke('google-calendar-sync', {
      body: { action: 'oauth-init', redirect_url: redirectUrl },
    });
    if (error) {
      showToast('Error al iniciar conexion con Google', 'error');
      return;
    }
    if (data?.authUrl) {
      // Use same-window navigation so the popup isn't blocked and the
      // callback redirect lands back in the app
      window.location.href = data.authUrl;
    }
  } catch (err) {
    showToast('Error al conectar con Google Calendar', 'error');
  }
}

async function disconnectGoogleCalendar() {
  try {
    const { data, error } = await window.insforge.functions.invoke('google-calendar-sync', {
      body: { action: 'disconnect' },
    });
    if (!error && data?.disconnected) {
      _gcalStatus = { connected: false, connection: null };
      renderCalendario();
      showToast('Google Calendar desconectado');
    }
  } catch (err) {
    showToast('Error al desconectar', 'error');
  }
}

async function syncGoogleCalendar() {
  if (_gcalSyncing) return;
  _gcalSyncing = true;
  renderCalendario(); // re-render to show syncing state

  try {
    const { data, error } = await window.insforge.functions.invoke('google-calendar-sync', {
      body: { action: 'sync' },
    });
    if (error) {
      showToast(`Error de sincronizacion: ${error.message || 'desconocido'}`, 'error');
    } else if (data) {
      const msg = data.success
        ? `Sync completa: ${data.pushed} enviados, ${data.pulled} recibidos, ${data.updated} actualizados`
        : `Sync con errores: ${data.errors?.join(', ')}`;
      showToast(msg, data.success ? 'success' : 'error');

      // Reload events from DB
      if (typeof loadAllData === 'function') {
        await loadAllData();
      }
      await fetchGcalStatus();
    }
  } catch (err) {
    showToast('Error de sincronizacion', 'error');
  } finally {
    _gcalSyncing = false;
    renderCalendario();
  }
}

function renderGcalBar() {
  if (!_gcalStatus) return '';

  if (_gcalStatus.connected) {
    const conn = _gcalStatus.connection;
    const email = conn?.google_email || 'Google Calendar';
    const lastSync = conn?.last_sync_at
      ? new Date(conn.last_sync_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Nunca';

    return `
      <div class="gcal-bar gcal-connected">
        <div class="gcal-bar-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span class="gcal-bar-email">${email}</span>
          <span class="gcal-bar-last-sync">Ultima sync: ${lastSync}</span>
        </div>
        <div class="gcal-bar-actions">
          <button class="btn btn-primary btn-sm" onclick="syncGoogleCalendar()" ${_gcalSyncing ? 'disabled' : ''}>
            ${_gcalSyncing
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Sincronizando...'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Sincronizar ahora'}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="disconnectGoogleCalendar()" title="Desconectar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="gcal-bar gcal-disconnected">
      <div class="gcal-bar-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="gcal-bar-email">Google Calendar no conectado</span>
      </div>
      <div class="gcal-bar-actions">
        <button class="btn btn-primary btn-sm" onclick="connectGoogleCalendar()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Conectar Google Calendar
        </button>
      </div>
    </div>
  `;
}

function renderCalendario() {
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  const firstDay = new Date(calendarioYear, calendarioMonth, 1).getDay();
  const daysInMonth = new Date(calendarioYear, calendarioMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calendarioYear, calendarioMonth, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getMonth() === calendarioMonth && today.getFullYear() === calendarioYear;

  let days = '';

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    days += `<div class="calendar-day other-month"><span class="calendar-day-number">${daysInPrevMonth - i}</span></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarioYear}-${String(calendarioMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = isCurrentMonth && today.getDate() === d;
    const dayEvents = eventosData.filter(e => e.fecha === dateStr);

    days += `
      <div class="calendar-day ${isToday ? 'today' : ''}" onclick="openEventoModal('${dateStr}')">
        <span class="calendar-day-number">${d}</span>
        ${dayEvents.map(e => `
          <div class="calendar-event ${e.color}" title="${e.sync_status === 'synced' ? 'Sincronizado con Google' : 'Solo local'}">
            ${e.sync_status === 'synced' ? '<span class="event-sync-badge" title="Google Calendar">G</span>' : ''}
            ${e.titulo}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Next month days
  const totalCells = firstDay + daysInMonth;
  const remaining = 42 - totalCells;
  for (let i = 1; i <= remaining; i++) {
    days += `<div class="calendar-day other-month"><span class="calendar-day-number">${i}</span></div>`;
  }

  const html = `
    <div class="control-panel">
      <h2 class="control-panel-title">Calendario</h2>
      <div class="control-panel-spacer"></div>
      <div class="control-panel-actions">
        <button class="btn btn-primary btn-sm" onclick="openNuevoEventoModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Evento
        </button>
      </div>
    </div>

    ${renderGcalBar()}

    <div class="calendar">
      <div class="calendar-header">
        <div class="calendar-nav">
          <button class="btn btn-secondary btn-sm" onclick="changeMonth(-1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="changeMonth(1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <span class="calendar-title">${monthNames[calendarioMonth]} ${calendarioYear}</span>
        <button class="btn btn-secondary btn-sm" onclick="goToToday()">Hoy</button>
      </div>
      <div class="calendar-grid">
        ${dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
        ${days}
      </div>
    </div>

    <!-- Proximos eventos -->
    <div style="margin-top:var(--space-lg)">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Proximos Eventos</span>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${eventosData.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5).map(e => `
              <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
                <div style="width:4px;height:32px;border-radius:2px;background:var(--${e.color === 'blue' ? 'info' : e.color === 'green' ? 'success' : e.color === 'orange' ? 'warning' : 'error'})"></div>
                <div style="flex:1">
                  <div style="font-size:var(--text-sm);font-weight:500">${e.titulo}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-secondary)">${formatDate(e.fecha)} ${e.hora !== '00:00' ? e.hora : ''}</div>
                </div>
                <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteEvento('${e.id}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  render(html);
}

function changeMonth(delta) {
  calendarioMonth += delta;
  if (calendarioMonth > 11) { calendarioMonth = 0; calendarioYear++; }
  if (calendarioMonth < 0) { calendarioMonth = 11; calendarioYear--; }
  renderCalendario();
}

function goToToday() {
  const today = new Date();
  calendarioMonth = today.getMonth();
  calendarioYear = today.getFullYear();
  renderCalendario();
}

function openNuevoEventoModal() {
  const body = `
    <div class="form-group full">
      <div class="form-field">
        <label>Titulo</label>
        <input type="text" class="input" id="evento-titulo" placeholder="Nombre del evento">
      </div>
    </div>
    <div class="form-group">
      <div class="form-field">
        <label>Fecha</label>
        <input type="date" class="input" id="evento-fecha" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-field">
        <label>Hora</label>
        <input type="time" class="input" id="evento-hora" value="10:00">
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Color</label>
        <select class="input" id="evento-color">
          <option value="blue">Azul</option>
          <option value="green">Verde</option>
          <option value="orange">Naranja</option>
          <option value="red">Rojo</option>
        </select>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveEvento()">Crear</button>
  `;

  openModal('Nuevo Evento', body, footer);
}

function openEventoModal(dateStr) {
  const dayEvents = eventosData.filter(e => e.fecha === dateStr);

  const body = `
    <div style="margin-bottom:var(--space-md)">
      <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-sm)">${formatDate(dateStr)}</div>
    </div>
    ${dayEvents.length > 0 ? dayEvents.map(e => `
      <div style="display:flex;align-items:center;gap:12px;padding:8px;border:1px solid var(--border-subtle);border-radius:var(--radius-md);margin-bottom:8px">
        <div style="width:4px;height:24px;border-radius:2px;background:var(--${e.color === 'blue' ? 'info' : e.color === 'green' ? 'success' : e.color === 'orange' ? 'warning' : 'error'})"></div>
        <div style="flex:1">
          <div style="font-size:var(--text-sm);font-weight:500">${e.titulo}</div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary)">${e.hora}</div>
        </div>
      </div>
    `).join('') : '<div style="text-align:center;padding:var(--space-lg);color:var(--text-secondary)">No hay eventos</div>'}
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="closeModal();openNuevoEventoModal()">+ Evento</button>
  `;

  openModal('Eventos del dia', body, footer);
}

async function saveEvento() {
  const titulo = document.getElementById('evento-titulo').value;
  const fecha = document.getElementById('evento-fecha').value;
  const hora = document.getElementById('evento-hora').value;
  const color = document.getElementById('evento-color').value;

  if (!titulo || !fecha) {
    showToast('Completa titulo y fecha', 'error');
    return;
  }

  const result = await createEvent({ titulo, fecha, hora, color });
  if (result) {
    closeModal();
    renderCalendario();
    showToast('Evento creado');
  }
}

async function deleteEvento(id) {
  const ok = await deleteEventRemote(id);
  if (ok) {
    renderCalendario();
    showToast('Evento eliminado');
  }
}

Router.register('/calendario', async () => {
  // Check for OAuth return params
  const urlParams = new URLSearchParams(window.location.search);
  const gcalStatus = urlParams.get('gcal_status');
  const gcalError = urlParams.get('gcal_error');

  if (gcalStatus === 'connected') {
    showToast('Google Calendar conectado exitosamente', 'success');
    // Clean URL params
    window.history.replaceState({}, '', window.location.pathname + '#/calendario');
  } else if (gcalError) {
    showToast(`Error de conexion con Google: ${gcalError}`, 'error');
    window.history.replaceState({}, '', window.location.pathname + '#/calendario');
  }

  await fetchGcalStatus();
  renderCalendario();
});
