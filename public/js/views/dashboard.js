/* Aliester - Dashboard View (Dynamic Data) */

function renderDashboard() {
  // Calculate dynamic values
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Finanzas - current month
  const finanzasMes = finanzasData.filter(f => {
    const d = new Date(f.fecha);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const ingresosMes = finanzasMes.filter(f => f.tipo === 'ingreso').reduce((sum, f) => sum + f.monto, 0);
  const gastosMes = finanzasMes.filter(f => f.tipo === 'gasto').reduce((sum, f) => sum + f.monto, 0);
  const balanceMes = ingresosMes - gastosMes;

  // Proyectos - all tasks
  const allTareas = proyectosData.flatMap(p => p.tareas);
  const lastEtapa = etapasData.length > 0 ? etapasData.reduce((a, b) => a.orden > b.orden ? a : b) : null;
  const tareasPendientes = lastEtapa ? allTareas.filter(t => t.etapaId !== lastEtapa.id) : allTareas;
  const tareasUrgentes = tareasPendientes.filter(t => t.prioridad === 'alta');

  // Eventos - today
  const today = now.toISOString().split('T')[0];
  const eventosHoy = eventosData.filter(e => e.fecha === today);

  // Suscripciones
  const suscripcionesActivas = suscripcionesData.filter(s => s.estado === 'activa');
  const totalSuscripciones = suscripcionesActivas.reduce((sum, s) => sum + s.costo, 0);

  // Gastos recientes (top 4)
  const gastosRecientes = finanzasData
    .filter(f => f.tipo === 'gasto')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 4);

  // Tareas pendientes (top 5)
  const tareasPendientesList = tareasPendientes
    .sort((a, b) => {
      const prioridadOrder = { alta: 0, media: 1, baja: 2 };
      return (prioridadOrder[a.prioridad] || 2) - (prioridadOrder[b.prioridad] || 2);
    })
    .slice(0, 5);

  const categoriaColors = {
    'Alimentacion': 'badge-info',
    'Servicios': 'badge-neutral',
    'Transporte': 'badge-warning',
    'Trabajo': 'badge-success',
    'Proyecto': 'badge-info',
    'Entretenimiento': 'badge-warning',
    'Salud': 'badge-success',
    'Educacion': 'badge-info',
  };

  const prioridadColors = {
    alta: 'badge-error',
    media: 'badge-warning',
    baja: 'badge-neutral'
  };

  const html = `
    <!-- App Launcher Grid -->
    <div class="app-launcher">
      <div class="app-launcher-grid">
        <a href="#/finanzas" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--success-light);color:var(--success)">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span class="app-launcher-label">Finanzas</span>
          <span class="app-launcher-desc">Gastos e ingresos</span>
        </a>

        <a href="#/proyectos" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--info-light);color:var(--info)">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span class="app-launcher-label">Proyectos</span>
          <span class="app-launcher-desc">Tareas y metas</span>
        </a>

        <a href="#/calendario" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--warning-light);color:var(--warning)">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <span class="app-launcher-label">Calendario</span>
          <span class="app-launcher-desc">Eventos y citas</span>
        </a>

        <a href="#/notas" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--bg-tertiary);color:var(--text-secondary)">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <span class="app-launcher-label">Notas</span>
          <span class="app-launcher-desc">Ideas y apuntes</span>
        </a>

        <a href="#/suscripciones" class="app-launcher-item">
          <div class="app-launcher-icon" style="background:var(--error-light);color:var(--error)">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <span class="app-launcher-label">Suscripciones</span>
          <span class="app-launcher-desc">Servicios activos</span>
        </a>
      </div>
    </div>

    <!-- Resumen rapido -->
    <div class="dashboard-summary">
      <div class="dashboard-summary-grid">
        <!-- Balance del mes -->
        <div class="summary-card">
          <div class="summary-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Balance del mes</span>
          </div>
          <div class="summary-card-value" style="color:${balanceMes >= 0 ? 'var(--success)' : 'var(--error)'}">${formatCurrency(balanceMes)}</div>
          <div class="summary-card-detail" style="color:var(--success)">+${formatCurrency(ingresosMes)} ingresos</div>
          <div class="summary-card-detail" style="color:var(--error)">-${formatCurrency(gastosMes)} gastos</div>
          <a href="#/finanzas" class="summary-card-link">Ver finanzas</a>
        </div>

        <!-- Tareas pendientes -->
        <div class="summary-card">
          <div class="summary-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span>Tareas pendientes</span>
          </div>
          <div class="summary-card-value">${tareasPendientes.length}</div>
          ${tareasUrgentes.length > 0 ? `<div class="summary-card-detail"><span class="badge badge-error">${tareasUrgentes.length} urgentes</span></div>` : '<div class="summary-card-detail">Sin urgentes</div>'}
          <a href="#/proyectos" class="summary-card-link">Ver proyectos</a>
        </div>

        <!-- Proximos eventos -->
        <div class="summary-card">
          <div class="summary-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Proximos eventos</span>
          </div>
          <div class="summary-card-value">${eventosHoy.length > 0 ? 'Hoy' : 'Hoy'}</div>
          ${eventosHoy.length > 0
            ? eventosHoy.slice(0, 2).map(e => `<div class="summary-card-detail">${e.titulo} - ${e.hora || ''}</div>`).join('')
            : '<div class="summary-card-detail">Sin eventos hoy</div>'}
          <a href="#/calendario" class="summary-card-link">Ver calendario</a>
        </div>

        <!-- Suscripciones -->
        <div class="summary-card">
          <div class="summary-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span>Suscripciones</span>
          </div>
          <div class="summary-card-value">${formatCurrency(totalSuscripciones)}</div>
          <div class="summary-card-detail">${suscripcionesActivas.length} servicios activos</div>
          <a href="#/suscripciones" class="summary-card-link">Ver suscripciones</a>
        </div>
      </div>
    </div>

    <!-- Gastos recientes y Tareas -->
    <div class="dashboard-grid">
      <!-- Gastos recientes -->
      <div class="dashboard-section">
        <div class="dashboard-section-header">
          <span class="dashboard-section-title">Gastos Recientes</span>
          <a href="#/finanzas" class="btn btn-ghost btn-sm">Ver todo</a>
        </div>
        <div class="dashboard-section-body">
          ${gastosRecientes.length > 0 ? `
            <div class="list-view">
              <table class="list-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Categoria</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  ${gastosRecientes.map(f => `
                    <tr>
                      <td>${f.concepto}</td>
                      <td><span class="badge ${categoriaColors[f.categoria] || 'badge-neutral'}">${f.categoria}</span></td>
                      <td class="text-right text-mono">${formatCurrency(f.monto)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<div style="padding:var(--space-lg);text-align:center;color:var(--text-tertiary);font-size:var(--text-sm)">Sin gastos registrados</div>'}
        </div>
      </div>

      <!-- Tareas pendientes -->
      <div class="dashboard-section">
        <div class="dashboard-section-header">
          <span class="dashboard-section-title">Tareas Pendientes</span>
          <a href="#/proyectos" class="btn btn-ghost btn-sm">Ver todo</a>
        </div>
        <div class="dashboard-section-body">
          ${tareasPendientesList.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:8px">
              ${tareasPendientesList.map(t => {
                const proyecto = proyectosData.find(p => p.tareas.some(ta => ta.id === t.id));
                return `
                  <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
                    <span style="flex:1;font-size:var(--text-sm)">${t.titulo}</span>
                    <span style="font-size:var(--text-xs);color:var(--text-tertiary)">${proyecto ? proyecto.nombre : ''}</span>
                    <span class="badge ${prioridadColors[t.prioridad]}">${t.prioridad}</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<div style="padding:var(--space-lg);text-align:center;color:var(--text-tertiary);font-size:var(--text-sm)">Sin tareas pendientes</div>'}
        </div>
      </div>
    </div>
  `;
  render(html);
}

Router.register('/', renderDashboard);
