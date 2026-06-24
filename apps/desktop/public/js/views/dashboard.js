/* Aliester - Dashboard View (Dynamic Data) */
/* Command-center layout: greeting + quick actions on top, then a 6-card
   KPI strip, a "Hoy" agenda band, and a 3-column section grid. */

function renderDashboard() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const dateLabel = now.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Finanzas del mes ─────────────────────────────────────────────────
  const finanzasMes = finanzasData.filter(f => {
    if (!f.fecha) return false;
    const d = new Date(f.fecha);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const ingresosMes = finanzasMes.filter(f => f.tipo === 'ingreso').reduce((sum, f) => sum + f.monto, 0);
  const gastosMes = finanzasMes.filter(f => f.tipo === 'gasto').reduce((sum, f) => sum + f.monto, 0);
  const balanceMes = ingresosMes - gastosMes;
  const burnRate = ingresosMes > 0 ? Math.round((gastosMes / ingresosMes) * 100) : (gastosMes > 0 ? 100 : 0);

  // ── Tareas y proyectos ───────────────────────────────────────────────
  const allTareas = proyectosData.flatMap(p => p.tareas || []);
  const lastEtapa = etapasData.length > 0 ? etapasData.reduce((a, b) => a.orden > b.orden ? a : b) : null;
  const tareasPendientes = lastEtapa ? allTareas.filter(t => getTaskEtapaId(t) !== lastEtapa.id) : allTareas;
  const tareasUrgentes = tareasPendientes.filter(t => t.prioridad === 'alta');
  const tareasEnProgreso = tareasPendientes.filter(t => getTaskEtapaId(t) === 4);
  const proyectosActivos = proyectosData.length;
  const tareasPendientesList = [...tareasPendientes]
    .sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.prioridad] ?? 2) - ({ alta: 0, media: 1, baja: 2 }[b.prioridad] ?? 2))
    .slice(0, 6);

  // ── Proyectos con progreso ───────────────────────────────────────────
  const proyectosConProgreso = proyectosData.map(p => {
    const tareas = p.tareas || [];
    const total = tareas.length;
    const done = tareas.filter(t => getTaskEtapaId(t) === lastEtapa?.id).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...p, total, done, pct };
  }).sort((a, b) => b.total - a.total).slice(0, 4);

  // ── Eventos ──────────────────────────────────────────────────────────
  const eventosHoy = eventosData.filter(e => e.fecha === today);
  const proximosEventos = eventosData
    .filter(e => e.fecha >= today)
    .sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')) || String(a.hora || '').localeCompare(String(b.hora || '')))
    .slice(0, 4);
  const totalProximosEventos = eventosData.filter(e => e.fecha >= today).length;

  // ── Suscripciones ────────────────────────────────────────────────────
  const suscripcionesActivas = suscripcionesData.filter(s => s.estado === 'activa');
  const totalSuscripciones = suscripcionesActivas.reduce((sum, s) => sum + s.costo, 0);
  const proximaCorte = suscripcionesActivas
    .filter(s => Number.isFinite(Number(s.fechaCorte)))
    .sort((a, b) => Number(a.fechaCorte) - Number(b.fechaCorte))[0];

  // ── Cuentas ──────────────────────────────────────────────────────────
  const totalCuentas = (cuentasData || []).reduce((sum, c) => sum + (Number(c.saldo) || 0), 0);
  const cuentasCount = (cuentasData || []).length;

  // ── Notas ────────────────────────────────────────────────────────────
  const notasRecientes = (notasData || [])
    .slice()
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
    .slice(0, 3);

  // ── Gastos recientes ─────────────────────────────────────────────────
  const gastosRecientes = finanzasData
    .filter(f => f.tipo === 'gasto')
    .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
    .slice(0, 5);

  const categoriaColors = {
    Alimentacion: 'badge-info',
    Servicios: 'badge-neutral',
    Transporte: 'badge-warning',
    Trabajo: 'badge-success',
    Proyecto: 'badge-info',
    Entretenimiento: 'badge-warning',
    Salud: 'badge-success',
    Educacion: 'badge-info',
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const eventColorClass = (c) => ['blue', 'green', 'orange', 'red'].includes(c) ? c : 'blue';
  const formatCutoffDay = (day) => Number.isFinite(Number(day)) ? `Día ${Number(day)}` : 'Sin corte';

  const eventItem = (e) => `
    <div class="dash-agenda-item">
      <div class="dash-agenda-time">${e.hora ? e.hora.substring(0, 5) : '—'}</div>
      <div class="dash-agenda-body">
        <div class="dash-agenda-title">
          ${e.sync_status === 'synced' ? '<span class="event-sync-badge" title="Sincronizado con Google">G</span>' : ''}
          ${e.titulo}
        </div>
        ${e.descripcion ? `<div class="dash-agenda-sub">${e.descripcion}</div>` : ''}
      </div>
      <span class="calendar-event ${eventColorClass(e.color)}" style="width:6px;height:6px;padding:0;border-radius:50%"></span>
    </div>
  `;

  const html = `
    <!-- Top bar: greeting + quick actions -->
    <div class="dash-topbar">
      <div class="dash-topbar-left">
        <div class="dash-greeting">${greeting}</div>
        <div class="dash-date">${dateLabel}</div>
      </div>
      <div class="dash-topbar-right">
        <button class="btn btn-secondary btn-sm dash-quick" onclick="openTareaModal()" ${proyectosData.length === 0 ? 'disabled' : ''} title="Nueva tarea">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Tarea
        </button>
        <button class="btn btn-secondary btn-sm dash-quick" onclick="openFinanzasModal()" title="Nueva transaccion">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Transaccion
        </button>
        <button class="btn btn-secondary btn-sm dash-quick" onclick="openNuevoEventoModal()" title="Nuevo evento">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/></svg>
          Evento
        </button>
        <button class="btn btn-secondary btn-sm dash-quick" onclick="openNuevaNotaModal()" title="Nueva nota">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Nota
        </button>
        <a href="#/asistente" class="btn btn-primary btn-sm dash-quick" title="Hablar con Ali">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          Ali
        </a>
      </div>
    </div>

    <!-- App launcher (compact horizontal) -->
    <div class="app-launcher">
      <div class="app-launcher-grid">
        <a href="#/finanzas" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--success-light);color:var(--success)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span class="app-launcher-label">Finanzas</span>
          <span class="app-launcher-desc">${formatCurrency(balanceMes)}</span>
        </a>
        <a href="#/proyectos" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--info-light);color:var(--info)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span class="app-launcher-label">Proyectos</span>
          <span class="app-launcher-desc">${tareasPendientes.length} pendientes</span>
        </a>
        <a href="#/calendario" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--warning-light);color:var(--warning)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <span class="app-launcher-label">Calendario</span>
          <span class="app-launcher-desc">${eventosHoy.length > 0 ? eventosHoy.length + ' hoy' : (totalProximosEventos > 0 ? totalProximosEventos + ' próximos' : 'Sin eventos')}</span>
        </a>
        <a href="#/notas" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--bg-tertiary);color:var(--text-secondary)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <span class="app-launcher-label">Notas</span>
          <span class="app-launcher-desc">${notasRecientes.length} recientes</span>
        </a>
        <a href="#/suscripciones" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--error-light);color:var(--error)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <span class="app-launcher-label">Suscripciones</span>
          <span class="app-launcher-desc">${formatCurrency(totalSuscripciones)} / mes</span>
        </a>
        <a href="#/cuentas" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--accent-light);color:var(--accent)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <span class="app-launcher-label">Cuentas</span>
          <span class="app-launcher-desc">${formatCurrency(totalCuentas)}</span>
        </a>
      </div>
    </div>

    <!-- KPI summary strip -->
    <div class="dashboard-summary">
      <div class="dashboard-summary-grid">
        <a href="#/finanzas" class="summary-card">
          <div class="summary-card-header">
            <span>Balance del mes</span>
            <span class="summary-card-trend ${balanceMes >= 0 ? 'is-pos' : 'is-neg'}">${burnRate}%</span>
          </div>
          <div class="summary-card-value" style="color:${balanceMes >= 0 ? 'var(--success)' : 'var(--error)'}">${formatCurrency(balanceMes)}</div>
          <div class="summary-card-bar">
            <div class="summary-card-bar-fill" style="width:${Math.min(burnRate, 100)}%; background:${balanceMes >= 0 ? 'var(--success)' : 'var(--error)'}"></div>
          </div>
          <div class="summary-card-detail"><span style="color:var(--success)">+${formatCurrency(ingresosMes)}</span> &middot; <span style="color:var(--error)">-${formatCurrency(gastosMes)}</span></div>
        </a>
        <a href="#/proyectos" class="summary-card">
          <div class="summary-card-header"><span>Tareas pendientes</span></div>
          <div class="summary-card-value">${tareasPendientes.length}</div>
          <div class="summary-card-detail">
            ${tareasUrgentes.length > 0 ? `<span class="badge badge-error">${tareasUrgentes.length} urgentes</span> ` : ''}
            ${tareasEnProgreso.length > 0 ? `<span class="badge badge-info">${tareasEnProgreso.length} en curso</span>` : '<span class="text-tertiary">Sin curso</span>'}
          </div>
        </a>
        <a href="#/proyectos" class="summary-card">
          <div class="summary-card-header"><span>Proyectos activos</span></div>
          <div class="summary-card-value">${proyectosActivos}</div>
          <div class="summary-card-detail">${allTareas.length} tareas en total</div>
        </a>
        <a href="#/calendario" class="summary-card">
          <div class="summary-card-header"><span>Agenda</span></div>
          <div class="summary-card-value">${eventosHoy.length > 0 ? 'Hoy' : (proximosEventos.length > 0 ? formatDate(proximosEventos[0].fecha) : 'Libre')}</div>
          <div class="summary-card-detail">
            ${eventosHoy.length > 0
              ? eventosHoy.length + ' evento' + (eventosHoy.length > 1 ? 's' : '') + ' hoy'
              : (totalProximosEventos > 0
                  ? totalProximosEventos + ' evento' + (totalProximosEventos > 1 ? 's' : '') + ' proximo' + (totalProximosEventos > 1 ? 's' : '')
                  : 'Sin eventos proximos')}
          </div>
        </a>
        <a href="#/suscripciones" class="summary-card">
          <div class="summary-card-header"><span>Suscripciones</span></div>
          <div class="summary-card-value">${formatCurrency(totalSuscripciones)}</div>
          <div class="summary-card-detail">${suscripcionesActivas.length} activas${proximaCorte ? ' &middot; corte ' + formatCutoffDay(proximaCorte.fechaCorte) : ''}</div>
        </a>
        <a href="#/cuentas" class="summary-card">
          <div class="summary-card-header"><span>Saldo en cuentas</span></div>
          <div class="summary-card-value">${formatCurrency(totalCuentas)}</div>
          <div class="summary-card-detail">${cuentasCount} cuenta${cuentasCount !== 1 ? 's' : ''} registrada${cuentasCount !== 1 ? 's' : ''}</div>
        </a>
      </div>
    </div>

    <!-- Hoy: agenda band -->
    ${(eventosHoy.length > 0 || proximosEventos.length > 0) ? `
      <div class="dashboard-section dash-agenda">
        <div class="dashboard-section-header">
          <span class="dashboard-section-title">
            ${eventosHoy.length > 0 ? 'Tu dia de hoy' : 'Proximos eventos'}
          </span>
          <a href="#/calendario" class="btn btn-ghost btn-sm">Ver calendario</a>
        </div>
        <div class="dashboard-section-body">
          ${(eventosHoy.length > 0 ? eventosHoy : proximosEventos).slice(0, 4).map(eventItem).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Main 3-column grid -->
    <div class="dashboard-grid dashboard-grid-three">
      <!-- Left column: Gastos -->
      <div class="dashboard-section">
        <div class="dashboard-section-header">
          <span class="dashboard-section-title">Gastos recientes</span>
          <a href="#/finanzas" class="btn btn-ghost btn-sm">Ver todo</a>
        </div>
        <div class="dashboard-section-body">
          ${gastosRecientes.length > 0 ? `<div class="list-view"><table class="list-table"><thead><tr><th>Concepto</th><th>Categoria</th><th class="text-right">Monto</th></tr></thead><tbody>${gastosRecientes.map(f => `<tr><td><div class="dash-cell-primary">${f.concepto}</div><div class="dash-cell-sub">${formatDate(f.fecha)}</div></td><td><span class="badge ${categoriaColors[f.categoria] || 'badge-neutral'}">${f.categoria}</span></td><td class="text-right text-mono">${formatCurrency(f.monto)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="dashboard-empty">Sin gastos registrados</div>'}
        </div>
      </div>

      <!-- Middle column: Tareas + Proyectos -->
      <div class="dashboard-col-stack">
        <div class="dashboard-section">
          <div class="dashboard-section-header">
            <span class="dashboard-section-title">Tareas pendientes</span>
            <a href="#/proyectos" class="btn btn-ghost btn-sm">Ver todo</a>
          </div>
          <div class="dashboard-section-body">
            ${tareasPendientesList.length > 0 ? `<div class="dashboard-task-list">${tareasPendientesList.map(t => {
              const proyecto = proyectosData.find(p => (p.tareas || []).some(x => x.id === t.id));
              return `<div class="dashboard-task-row"><input type="checkbox" ${lastEtapa && getTaskEtapaId(t) === lastEtapa.id ? 'checked' : ''} onchange="dashboardToggleTarea('${t.id}', this.checked)"><span class="task-title">${t.titulo}</span><span class="task-meta">${proyecto ? proyecto.nombre : ''}</span><span class="badge ${t.prioridad === 'alta' ? 'badge-error' : t.prioridad === 'media' ? 'badge-warning' : 'badge-neutral'}">${t.prioridad}</span></div>`;
            }).join('')}</div>` : '<div class="dashboard-empty">Sin tareas pendientes</div>'}
          </div>
        </div>
        ${proyectosConProgreso.length > 0 ? `
          <div class="dashboard-section">
            <div class="dashboard-section-header">
              <span class="dashboard-section-title">Proyectos</span>
              <a href="#/proyectos" class="btn btn-ghost btn-sm">Ver todo</a>
            </div>
            <div class="dashboard-section-body">
              <div class="dash-project-list">
                ${proyectosConProgreso.map(p => `
                  <div class="dash-project-row">
                    <div class="dash-project-row-top">
                      <div class="dash-project-name">${p.nombre}</div>
                      <div class="dash-project-pct">${p.pct}%</div>
                    </div>
                    <div class="ast-bar"><div class="ast-bar-fill" style="width:${p.pct}%;background:${p.pct === 100 ? 'var(--success)' : 'var(--info)'}"></div></div>
                    <div class="dash-project-meta">${p.done}/${p.total} tareas${etapasData.find(e => e.id === 4) ? ' &middot; ' + etapasData.find(e => e.id === 4).nombre + ': ' + (p.tareas || []).filter(t => getTaskEtapaId(t) === 4).length : ''}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Right column: Notas + Suscripciones -->
      <div class="dashboard-col-stack">
        ${notasRecientes.length > 0 ? `
          <div class="dashboard-section">
            <div class="dashboard-section-header">
              <span class="dashboard-section-title">Notas recientes</span>
              <a href="#/notas" class="btn btn-ghost btn-sm">Ver todo</a>
            </div>
            <div class="dashboard-section-body">
              <div class="dash-notes-list">
                ${notasRecientes.map(n => `
                  <a href="#/notas" class="dash-note-row">
                    <div class="dash-note-title">${n.titulo}</div>
                    <div class="dash-note-content">${(n.contenido || '').replace(/<[^>]+>/g, ' ').substring(0, 120)}</div>
                    <div class="dash-note-date">${n.fecha ? formatDate(n.fecha) : ''}</div>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
        ${suscripcionesActivas.length > 0 ? `
          <div class="dashboard-section">
            <div class="dashboard-section-header">
              <span class="dashboard-section-title">Suscripciones</span>
              <a href="#/suscripciones" class="btn btn-ghost btn-sm">Ver todo</a>
            </div>
            <div class="dashboard-section-body">
              <div class="dash-subs-list">
                ${suscripcionesActivas.slice(0, 4).map(s => `
                  <div class="dash-subs-row">
                    <div class="dash-subs-body">
                      <div class="dash-subs-name">${s.servicio}</div>
                  ${s.fechaCorte ? `<div class="dash-subs-sub">Corte ${formatCutoffDay(s.fechaCorte)}</div>` : ''}
                    </div>
                    <div class="dash-subs-cost text-mono">${formatCurrency(s.costo)}</div>
                  </div>
                `).join('')}
                ${suscripcionesActivas.length > 4 ? `<div class="dash-subs-more">+${suscripcionesActivas.length - 4} más &middot; ${formatCurrency(totalSuscripciones)} total</div>` : ''}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  render(html);
}

// Quick-toggle a task from the dashboard checkbox.
// Moves between "En proceso" (4) <-> "Terminado" (last etapa).
async function dashboardToggleTarea(id, checked) {
  if (typeof etapasData === 'undefined' || etapasData.length === 0) return;
  const etapasOrdenadas = [...etapasData].sort((a, b) => a.orden - b.orden);
  const finalEtapa = etapasOrdenadas[etapasOrdenadas.length - 1];
  const etapaEnProceso = etapasOrdenadas.find(e => e.id === 4)
    || etapasOrdenadas[etapasOrdenadas.length - 2]
    || etapasOrdenadas[0];
  const etapaDestino = checked ? finalEtapa.id : etapaEnProceso.id;
  const ok = await updateTask(id, {
    etapaId: etapaDestino,
    estado: String(etapaDestino),
  });
  if (ok) {
    showToast(checked ? 'Tarea completada' : 'Tarea reabierta', 'success');
    renderDashboard();
  } else {
    showToast('No se pudo actualizar la tarea', 'error');
  }
}

Router.register('/', renderDashboard);
