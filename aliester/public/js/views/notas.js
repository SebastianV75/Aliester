/* Aliester - Notas View (with Datepicker & Calendar Sync) */

const notasData = [
  { id: 1, titulo: 'Ideas para el proyecto', contenido: '1. Dashboard con metricas\n2. Sistema de notificaciones\n3. Exportar datos a CSV\n4. Dark mode', fecha: '2026-06-10' },
  { id: 2, titulo: 'Recetas de cocina', contenido: 'Tacos de pollo:\n- 500g pechuga de pollo\n- Tortillas de maiz\n- Cilantro, cebolla, limon\n- Salsa verde', fecha: '2026-06-08' },
  { id: 3, titulo: 'Libros por leer', contenido: '1. Atomic Habits - James Clear\n2. Deep Work - Cal Newport\n3. The Pragmatic Programmer\n4. Clean Code - Robert Martin', fecha: '2026-06-05' },
  { id: 4, titulo: 'Contrasenas importantes', contenido: 'Banco: ****\nEmail principal: ****\nNetflix: ****', fecha: '2026-06-01' },
  { id: 5, titulo: 'Meta de ahorro 2026', contenido: 'Objetivo: $100,000 MXN\nActual: $45,230\nFalta: $54,770\n\nEstrategia:\n- Ahorrar 30% de cada quincena\n- Reducir gastos en entretenimiento\n- Vender cosas que no uso', fecha: '2026-06-03' },
  { id: 6, titulo: 'Plan de ejercicio', contenido: 'Lunes: Pecho y triceps\nMartes: Espalda y biceps\nMiercoles: Piernas\nJueves: Descanso\nViernes: Hombros y trapecios\nSabado: Cardio', fecha: '2026-06-02' },
];

let notasSearch = '';
let activeDatepicker = null;

// Datepicker Component
function createDatepicker(containerId, inputId, selectedDate) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const date = selectedDate ? new Date(selectedDate) : new Date();
  let currentMonth = date.getMonth();
  let currentYear = date.getFullYear();

  function renderDatepicker() {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    let days = '';

    // Previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      days += `<div class="datepicker-day other-month" data-date="${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}">${daysInPrevMonth - i}</div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = isCurrentMonth && today.getDate() === d;
      const isSelected = selectedDate === dateStr;
      days += `<div class="datepicker-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}" onclick="selectDate('${dateStr}', '${inputId}')">${d}</div>`;
    }

    // Next month
    const totalCells = firstDay + daysInMonth;
    const remaining = 42 - totalCells;
    for (let i = 1; i <= remaining; i++) {
      days += `<div class="datepicker-day other-month" data-date="${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}">${i}</div>`;
    }

    container.innerHTML = `
      <div class="datepicker-dropdown">
        <div class="datepicker-header">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="event.stopPropagation();changeDatepickerMonth('${containerId}', '${inputId}', -1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="datepicker-title">${monthNames[currentMonth]} ${currentYear}</span>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="event.stopPropagation();changeDatepickerMonth('${containerId}', '${inputId}', 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="datepicker-grid">
          ${dayNames.map(d => `<div class="datepicker-day-header">${d}</div>`).join('')}
          ${days}
        </div>
        <div class="datepicker-footer">
          <button class="btn btn-ghost btn-sm" onclick="selectToday('${inputId}')">Hoy</button>
          <button class="btn btn-ghost btn-sm" onclick="clearDate('${inputId}')">Limpiar</button>
        </div>
      </div>
    `;
  }

  renderDatepicker();

  // Store current state
  if (!window.datepickers) window.datepickers = {};
  window.datepickers[containerId] = {
    containerId,
    inputId,
    currentMonth,
    currentYear,
    render: renderDatepicker
  };
}

function changeDatepickerMonth(containerId, inputId, delta) {
  const dp = window.datepickers?.[containerId];
  if (!dp) return;

  dp.currentMonth += delta;
  if (dp.currentMonth > 11) { dp.currentMonth = 0; dp.currentYear++; }
  if (dp.currentMonth < 0) { dp.currentMonth = 11; dp.currentYear--; }

  // Re-render with updated state
  const container = document.getElementById(containerId);
  if (!container) return;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const firstDay = new Date(dp.currentYear, dp.currentMonth, 1).getDay();
  const daysInMonth = new Date(dp.currentYear, dp.currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(dp.currentYear, dp.currentMonth, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getMonth() === dp.currentMonth && today.getFullYear() === dp.currentYear;
  const inputEl = document.getElementById(inputId);
  const selectedDate = inputEl ? inputEl.value : null;

  let days = '';

  for (let i = firstDay - 1; i >= 0; i--) {
    days += `<div class="datepicker-day other-month" data-date="${dp.currentYear}-${String(dp.currentMonth).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}">${daysInPrevMonth - i}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${dp.currentYear}-${String(dp.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = isCurrentMonth && today.getDate() === d;
    const isSelected = selectedDate === dateStr;
    days += `<div class="datepicker-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}" onclick="selectDate('${dateStr}', '${inputId}')">${d}</div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = 42 - totalCells;
  for (let i = 1; i <= remaining; i++) {
    days += `<div class="datepicker-day other-month" data-date="${dp.currentYear}-${String(dp.currentMonth + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}">${i}</div>`;
  }

  container.innerHTML = `
    <div class="datepicker-dropdown">
      <div class="datepicker-header">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="event.stopPropagation();changeDatepickerMonth('${containerId}', '${inputId}', -1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="datepicker-title">${monthNames[dp.currentMonth]} ${dp.currentYear}</span>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="event.stopPropagation();changeDatepickerMonth('${containerId}', '${inputId}', 1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div class="datepicker-grid">
        ${dayNames.map(d => `<div class="datepicker-day-header">${d}</div>`).join('')}
        ${days}
      </div>
      <div class="datepicker-footer">
        <button class="btn btn-ghost btn-sm" onclick="selectToday('${inputId}')">Hoy</button>
        <button class="btn btn-ghost btn-sm" onclick="clearDate('${inputId}')">Limpiar</button>
      </div>
    </div>
  `;
}

function selectDate(dateStr, inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = dateStr;
  }
  // Close datepicker
  const containerId = inputId.replace('-nota-fecha', '-datepicker');
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

function selectToday(inputId) {
  const today = new Date().toISOString().split('T')[0];
  selectDate(today, inputId);
}

function clearDate(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = '';
  }
  const containerId = inputId.replace('-nota-fecha', '-datepicker');
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

function toggleDatepicker(containerId, inputId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.innerHTML.trim()) {
    container.innerHTML = '';
  } else {
    const input = document.getElementById(inputId);
    const selectedDate = input ? input.value : null;
    createDatepicker(containerId, inputId, selectedDate);
  }
}

// Close datepicker on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.datepicker-wrapper') && !e.target.closest('.datepicker-dropdown')) {
    document.querySelectorAll('.datepicker-dropdown').forEach(dp => {
      const wrapper = dp.closest('.datepicker-wrapper');
      if (wrapper) {
        const container = wrapper.querySelector('.datepicker-container');
        if (container) container.innerHTML = '';
      }
    });
  }
});

function renderNotas() {
  const filtered = notasData.filter(n =>
    n.titulo.toLowerCase().includes(notasSearch.toLowerCase()) ||
    n.contenido.toLowerCase().includes(notasSearch.toLowerCase())
  );

  const html = `
    <div class="control-panel">
      <h2 class="control-panel-title">Notas</h2>
      <div class="control-panel-spacer"></div>
      <div class="control-panel-filters">
        <div class="navbar-search" style="width:200px">
          <svg class="navbar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Buscar notas..." value="${notasSearch}" oninput="notasSearch=this.value;renderNotas()">
        </div>
      </div>
      <div class="control-panel-actions">
        <button class="btn btn-primary btn-sm" onclick="openNuevaNotaModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Nota
        </button>
      </div>
    </div>

    <div class="notes-grid">
      ${filtered.map(n => `
        <div class="note-card" onclick="openNotaDetail(${n.id})">
          <div class="note-card-title">${n.titulo}</div>
          <div class="note-card-content">${n.contenido}</div>
          <div class="note-card-footer">
            ${formatDate(n.fecha)}
            ${n.fecha ? `<span class="badge badge-info" style="margin-left:8px">En calendario</span>` : ''}
          </div>
        </div>
      `).join('')}
      ${filtered.length === 0 ? `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="empty-state-title">No hay notas</div>
          <div class="empty-state-text">Crea tu primera nota</div>
        </div>
      ` : ''}
    </div>
  `;
  render(html);
}

function openNuevaNotaModal() {
  const body = `
    <div class="form-group full">
      <div class="form-field">
        <label>Titulo</label>
        <input type="text" class="input" id="nota-titulo" placeholder="Titulo de la nota">
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Contenido</label>
        <textarea class="input" id="nota-contenido" placeholder="Escribe tu nota aqui..." style="min-height:200px;font-family:var(--font-mono);font-size:var(--text-sm)"></textarea>
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Fecha (opcional - agrega al calendario)</label>
        <div class="datepicker-wrapper">
          <input type="text" class="input datepicker-trigger" id="nota-nota-fecha" placeholder="Seleccionar fecha..." readonly onclick="toggleDatepicker('nota-datepicker', 'nota-nota-fecha')">
          <div class="datepicker-container" id="nota-datepicker"></div>
        </div>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveNota()">Crear</button>
  `;

  openModal('Nueva Nota', body, footer);
}

function saveNota() {
  const titulo = document.getElementById('nota-titulo').value;
  const contenido = document.getElementById('nota-contenido').value;
  const fecha = document.getElementById('nota-nota-fecha').value;

  if (!titulo) {
    showToast('Ingresa un titulo', 'error');
    return;
  }

  const newNota = {
    id: Date.now(),
    titulo,
    contenido,
    fecha: fecha || new Date().toISOString().split('T')[0]
  };

  notasData.unshift(newNota);

  // Sync with calendar
  if (fecha) {
    eventosData.push({
      id: Date.now() + 1,
      titulo: `[Nota] ${titulo}`,
      fecha: fecha,
      hora: '00:00',
      color: 'blue'
    });
  }

  closeModal();
  renderNotas();
  showToast(fecha ? 'Nota creada y agregada al calendario' : 'Nota creada');
}

function openNotaDetail(id) {
  const nota = notasData.find(n => n.id === id);
  if (!nota) return;

  const body = `
    <div class="form-group full">
      <div class="form-field">
        <label>Titulo</label>
        <input type="text" class="input" id="detail-titulo" value="${nota.titulo}">
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Contenido</label>
        <textarea class="input" id="detail-contenido" style="min-height:250px;font-family:var(--font-mono);font-size:var(--text-sm)">${nota.contenido}</textarea>
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Fecha (sincroniza con calendario)</label>
        <div class="datepicker-wrapper">
          <input type="text" class="input datepicker-trigger" id="detail-nota-fecha" value="${nota.fecha || ''}" placeholder="Seleccionar fecha..." readonly onclick="toggleDatepicker('detail-datepicker', 'detail-nota-fecha')">
          <div class="datepicker-container" id="detail-datepicker"></div>
        </div>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-danger btn-sm" onclick="deleteNota(${id})">Eliminar</button>
    <div style="flex:1"></div>
    <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="updateNota(${id})">Guardar</button>
  `;

  openModal('Nota', body, footer);
}

function updateNota(id) {
  const nota = notasData.find(n => n.id === id);
  if (!nota) return;

  const oldFecha = nota.fecha;
  const newFecha = document.getElementById('detail-nota-fecha').value;

  nota.titulo = document.getElementById('detail-titulo').value;
  nota.contenido = document.getElementById('detail-contenido').value;
  nota.fecha = newFecha;

  // Update calendar event
  const existingEventIdx = eventosData.findIndex(e => e.titulo === `[Nota] ${nota.titulo}` || e.titulo.startsWith(`[Nota] ${nota.titulo}`));
  if (existingEventIdx !== -1) {
    eventosData.splice(existingEventIdx, 1);
  }

  if (newFecha) {
    eventosData.push({
      id: Date.now(),
      titulo: `[Nota] ${nota.titulo}`,
      fecha: newFecha,
      hora: '00:00',
      color: 'blue'
    });
  }

  closeModal();
  renderNotas();
  showToast('Nota actualizada');
}

function deleteNota(id) {
  const nota = notasData.find(n => n.id === id);
  if (nota) {
    // Remove calendar event
    const eventIdx = eventosData.findIndex(e => e.titulo === `[Nota] ${nota.titulo}` || e.titulo.startsWith(`[Nota] ${nota.titulo}`));
    if (eventIdx !== -1) {
      eventosData.splice(eventIdx, 1);
    }
  }

  const idx = notasData.findIndex(n => n.id === id);
  if (idx !== -1) {
    notasData.splice(idx, 1);
    closeModal();
    renderNotas();
    showToast('Nota eliminada');
  }
}

Router.register('/notas', renderNotas);
