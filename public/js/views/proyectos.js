/* Aliester - Proyectos View (Etapas Globales + Drag & Drop) */

// Etapas globales del kanban
let etapasData = [
  { id: 1, nombre: 'Idea', orden: 0 },
  { id: 2, nombre: 'Inicio', orden: 1 },
  { id: 3, nombre: 'Planeacion', orden: 2 },
  { id: 4, nombre: 'En proceso', orden: 3 },
  { id: 5, nombre: 'Revision', orden: 4 },
  { id: 6, nombre: 'Terminado', orden: 5 },
];

const proyectosData = [
  { id: 1, nombre: 'App Aliester', descripcion: 'Desarrollar sistema de gestion personal', estado: 'activo', tareas: [
    { id: 101, titulo: 'Configurar proyecto', etapaId: 6, prioridad: 'media' },
    { id: 102, titulo: 'Disenar UI', etapaId: 6, prioridad: 'alta' },
    { id: 103, titulo: 'Desarrollar backend', etapaId: 4, prioridad: 'alta' },
    { id: 104, titulo: 'Integrar frontend', etapaId: 2, prioridad: 'media' },
  ]},
  { id: 2, nombre: 'Aprender Guitarra', descripcion: 'Practicar 30 min diarios', estado: 'activo', tareas: [
    { id: 201, titulo: 'Comprar cuerdas', etapaId: 6, prioridad: 'baja' },
    { id: 202, titulo: 'Aprender acordes basicos', etapaId: 4, prioridad: 'media' },
    { id: 203, titulo: 'Primer tema completo', etapaId: 1, prioridad: 'baja' },
  ]},
  { id: 3, nombre: 'Renovar licencia', descripcion: 'Tramites del carro', estado: 'activo', tareas: [
    { id: 301, titulo: 'Revisar documentos', etapaId: 1, prioridad: 'alta' },
    { id: 302, titulo: 'Pagar derecho de placas', etapaId: 1, prioridad: 'alta' },
    { id: 303, titulo: 'Ir al infraverm', etapaId: 3, prioridad: 'media' },
  ]},
];

let kanbanFilter = 'todos';
let draggedTareaId = null;

function renderProyectos() {
  let allTareas = proyectosData.flatMap(p => p.tareas);

  // Apply priority filter
  if (kanbanFilter !== 'todos') {
    allTareas = allTareas.filter(t => t.prioridad === kanbanFilter);
  }

  const html = `
    <div class="control-panel">
      <h2 class="control-panel-title">Proyectos y Tareas</h2>
      <div class="control-panel-spacer"></div>
      <div class="control-panel-filters">
        <button class="filter-pill ${kanbanFilter === 'todos' ? 'active' : ''}" onclick="kanbanFilter='todos';renderProyectos()">Todos</button>
        <button class="filter-pill ${kanbanFilter === 'alta' ? 'active' : ''}" onclick="kanbanFilter='alta';renderProyectos()">Alta</button>
        <button class="filter-pill ${kanbanFilter === 'media' ? 'active' : ''}" onclick="kanbanFilter='media';renderProyectos()">Media</button>
        <button class="filter-pill ${kanbanFilter === 'baja' ? 'active' : ''}" onclick="kanbanFilter='baja';renderProyectos()">Baja</button>
      </div>
      <div class="control-panel-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEtapasManager()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Administrar Etapas
        </button>
        <button class="btn btn-primary btn-sm" onclick="openTareaModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Tarea
        </button>
      </div>
    </div>

    <div class="kanban">
      ${etapasData.sort((a, b) => a.orden - b.orden).map(etapa => {
        const tareas = allTareas.filter(t => t.etapaId === etapa.id);
        return `
          <div class="kanban-column" data-etapa="${etapa.id}">
            <div class="kanban-column-header">
              <span class="kanban-column-title">
                ${etapa.nombre}
                <span class="kanban-column-count">${tareas.length}</span>
              </span>
            </div>
            <div class="kanban-column-body" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${etapa.id})">
              ${tareas.map(t => renderKanbanCard(t)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  render(html);
}

function renderKanbanCard(tarea) {
  const prioridadColors = {
    alta: 'badge-error',
    media: 'badge-warning',
    baja: 'badge-neutral'
  };

  const proyecto = proyectosData.find(p => p.tareas.some(t => t.id === tarea.id));

  return `
    <div class="kanban-card" draggable="true" ondragstart="handleDragStart(event, ${tarea.id})" ondragend="handleDragEnd(event)" onclick="openTareaDetail(${tarea.id})">
      <div class="kanban-card-title">${tarea.titulo}</div>
      <div class="kanban-card-meta">
        <div class="kanban-card-tags">
          <span class="badge ${prioridadColors[tarea.prioridad]}">${tarea.prioridad}</span>
        </div>
        <span class="kanban-card-date">${proyecto ? proyecto.nombre : ''}</span>
      </div>
    </div>
  `;
}

// Drag & Drop Handlers
function handleDragStart(event, tareaId) {
  draggedTareaId = tareaId;
  event.target.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', tareaId);
}

function handleDragEnd(event) {
  event.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-column-body').forEach(col => {
    col.classList.remove('drag-over');
  });
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event, etapaId) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');

  const tareaId = parseInt(event.dataTransfer.getData('text/plain'));
  if (!tareaId) return;

  for (const p of proyectosData) {
    const tarea = p.tareas.find(t => t.id === tareaId);
    if (tarea) {
      if (tarea.etapaId !== etapaId) {
        tarea.etapaId = etapaId;
        const etapa = etapasData.find(e => e.id === etapaId);
        renderProyectos();
        showToast(`Tarea movida a "${etapa ? etapa.nombre : 'etapa'}"`);
      }
      break;
    }
  }
}

function openTareaModal() {
  const body = `
    <div class="form-group full">
      <div class="form-field">
        <label>Titulo</label>
        <input type="text" class="input" id="tarea-titulo" placeholder="Nombre de la tarea">
      </div>
    </div>
    <div class="form-group">
      <div class="form-field">
        <label>Proyecto</label>
        <select class="input" id="tarea-proyecto">
          ${proyectosData.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Prioridad</label>
        <select class="input" id="tarea-prioridad">
          <option value="baja">Baja</option>
          <option value="media" selected>Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Etapas</label>
        <select class="input" id="tarea-etapa">
          ${etapasData.sort((a, b) => a.orden - b.orden).map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
        </select>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveTarea()">Crear</button>
  `;

  openModal('Nueva Tarea', body, footer);
}

function saveTarea() {
  const titulo = document.getElementById('tarea-titulo').value;
  const prioridad = document.getElementById('tarea-prioridad').value;
  const etapaId = parseInt(document.getElementById('tarea-etapa').value);
  const proyectoId = parseInt(document.getElementById('tarea-proyecto').value);

  if (!titulo) {
    showToast('Ingresa un titulo', 'error');
    return;
  }

  const proyecto = proyectosData.find(p => p.id === proyectoId);
  if (proyecto) {
    proyecto.tareas.push({
      id: Date.now(),
      titulo,
      etapaId,
      prioridad
    });
  }

  closeModal();
  renderProyectos();
  showToast('Tarea creada');
}

function openTareaDetail(id) {
  let tarea = null;
  let proyecto = null;
  for (const p of proyectosData) {
    const t = p.tareas.find(t => t.id === id);
    if (t) { tarea = t; proyecto = p; break; }
  }
  if (!tarea) return;

  const etapaActual = etapasData.find(e => e.id === tarea.etapaId);

  const body = `
    <div class="form-group full">
      <div class="form-field">
        <label>Proyecto</label>
        <div style="padding:var(--space-sm) 0;font-size:var(--text-sm)">${proyecto.nombre}</div>
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Descripcion</label>
        <div style="padding:var(--space-sm) 0;font-size:var(--text-sm);color:var(--text-secondary)">${proyecto.descripcion}</div>
      </div>
    </div>
    <div class="form-separator"></div>
    <div class="form-group">
      <div class="form-field">
        <label>Prioridad</label>
        <select class="input" id="detail-prioridad">
          <option value="baja" ${tarea.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
          <option value="media" ${tarea.prioridad === 'media' ? 'selected' : ''}>Media</option>
          <option value="alta" ${tarea.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
        </select>
      </div>
      <div class="form-field">
        <label>Etapa</label>
        <select class="input" id="detail-etapa">
          ${etapasData.sort((a, b) => a.orden - b.orden).map(e =>
            `<option value="${e.id}" ${tarea.etapaId === e.id ? 'selected' : ''}>${e.nombre}</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <!-- Gastos del proyecto -->
    <div class="form-separator"></div>
    <div class="form-section-title">Finanzas del Proyecto</div>
    <div id="proyecto-finanzas">
      ${renderProyectoFinanzas(id)}
    </div>
    <button class="btn btn-secondary btn-sm" style="margin-top:var(--space-sm)" onclick="openAgregarFinanzaProyecto(${id})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Agregar transaccion
    </button>
  `;

  const footer = `
    <button class="btn btn-danger btn-sm" onclick="deleteTarea(${id})">Eliminar</button>
    <div style="flex:1"></div>
    <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="updateTarea(${id})">Guardar</button>
  `;

  openModal(tarea.titulo, body, footer);
}

function renderProyectoFinanzas(tareaId) {
  const transacciones = finanzasData.filter(f => f.tareaId === tareaId);
  if (transacciones.length === 0) {
    return '<div style="font-size:var(--text-xs);color:var(--text-tertiary);padding:var(--space-sm) 0">Sin transacciones asociadas</div>';
  }

  return `
    <div style="display:flex;flex-direction:column;gap:4px">
      ${transacciones.map(f => `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:var(--text-xs);padding:4px 0;border-bottom:1px solid var(--border-subtle)">
          <span>${f.concepto}</span>
          <span style="color:${f.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)'}; font-family:var(--font-mono)">${f.tipo === 'ingreso' ? '+' : '-'}${formatCurrency(f.monto)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function openAgregarFinanzaProyecto(tareaId) {
  const body = `
    <div class="form-group">
      <div class="form-field">
        <label>Tipo</label>
        <select class="input" id="fin-proy-tipo">
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
      </div>
      <div class="form-field">
        <label>Monto</label>
        <input type="number" class="input" id="fin-proy-monto" placeholder="0.00">
      </div>
    </div>
    <div class="form-group full">
      <div class="form-field">
        <label>Concepto</label>
        <input type="text" class="input" id="fin-proy-concepto" placeholder="Descripcion">
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="saveFinanzaProyecto(${tareaId})">Guardar</button>
  `;

  openModal('Agregar Transaccion', body, footer);
}

function saveFinanzaProyecto(tareaId) {
  const tipo = document.getElementById('fin-proy-tipo').value;
  const monto = parseFloat(document.getElementById('fin-proy-monto').value) || 0;
  const concepto = document.getElementById('fin-proy-concepto').value;

  if (!concepto || !monto) {
    showToast('Completa todos los campos', 'error');
    return;
  }

  finanzasData.unshift({
    id: Date.now(),
    tipo,
    concepto,
    categoria: 'Proyecto',
    monto,
    fecha: new Date().toISOString().split('T')[0],
    tareaId
  });

  closeModal();
  showToast('Transaccion guardada');
}

function updateTarea(id) {
  for (const p of proyectosData) {
    const t = p.tareas.find(t => t.id === id);
    if (t) {
      t.prioridad = document.getElementById('detail-prioridad').value;
      t.etapaId = parseInt(document.getElementById('detail-etapa').value);
      break;
    }
  }
  closeModal();
  renderProyectos();
  showToast('Tarea actualizada');
}

function deleteTarea(id) {
  for (const p of proyectosData) {
    const idx = p.tareas.findIndex(t => t.id === id);
    if (idx !== -1) {
      p.tareas.splice(idx, 1);
      break;
    }
  }
  closeModal();
  renderProyectos();
  showToast('Tarea eliminada');
}

// --- Etapas Manager (Global) ---

let etapasTemp = [];
let draggedEtapaId = null;

function openEtapasManager() {
  // Create a temp copy for editing
  etapasTemp = etapasData.map(e => ({ ...e }));
  renderEtapasManagerModal();
}

function renderEtapasManagerModal() {
  const sorted = etapasTemp.sort((a, b) => a.orden - b.orden);

  const body = `
    <div class="etapas-manager">
      <div class="etapas-manager-list" id="etapas-manager-list">
        ${sorted.map((e, i) => `
          <div class="etapa-manager-item" data-id="${e.id}" draggable="true"
               ondragstart="handleEtapaDragStart(event, ${e.id})"
               ondragend="handleEtapaDragEnd(event)"
               ondragover="handleEtapaDragOver(event)"
               ondragleave="handleEtapaDragLeave(event)"
               ondrop="handleEtapaDrop(event, ${e.id})">
            <span class="etapa-manager-handle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </span>
            <input type="text" class="input input-sm etapa-manager-input" value="${e.nombre}" data-id="${e.id}" onchange="updateTempEtapaNombre(${e.id}, this.value)">
            <div class="etapa-manager-actions">
              <button class="btn-icon btn-icon-xs btn-icon-danger" onclick="deleteTempEtapa(${e.id})" title="Eliminar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" style="margin-top:var(--space-md)" onclick="addTempEtapa()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Agregar Etapa
      </button>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="cancelEtapasManager()">Cancelar</button>
    <button class="btn btn-primary" onclick="acceptEtapasManager()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      Aceptar
    </button>
  `;

  openModal('Administrar Etapas', body, footer);
}

// --- Drag handlers for etapas ---

function handleEtapaDragStart(event, etapaId) {
  draggedEtapaId = etapaId;
  event.target.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', etapaId);
}

function handleEtapaDragEnd(event) {
  event.target.classList.remove('dragging');
  document.querySelectorAll('.etapa-manager-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

function handleEtapaDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('drag-over');
}

function handleEtapaDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handleEtapaDrop(event, targetId) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');

  const draggedId = parseInt(event.dataTransfer.getData('text/plain'));
  if (!draggedId || draggedId === targetId) return;

  const draggedIdx = etapasTemp.findIndex(e => e.id === draggedId);
  const targetIdx = etapasTemp.findIndex(e => e.id === targetId);
  if (draggedIdx === -1 || targetIdx === -1) return;

  // Remove dragged etapa from array
  const [etapaMovida] = etapasTemp.splice(draggedIdx, 1);

  // Find new target position (after splice, index may have shifted)
  const nuevoTargetIdx = etapasTemp.findIndex(e => e.id === targetId);

  // Insert at target position
  etapasTemp.splice(nuevoTargetIdx, 0, etapaMovida);

  // Recalculate all orden values
  etapasTemp.forEach((e, i) => e.orden = i);

  renderEtapasManagerModal();
}

// --- Temp etapa operations ---

function updateTempEtapaNombre(etapaId, nombre) {
  const etapa = etapasTemp.find(e => e.id === etapaId);
  if (etapa) {
    etapa.nombre = nombre;
  }
}

function addTempEtapa() {
  const newId = Date.now();
  const maxOrden = etapasTemp.length > 0 ? Math.max(...etapasTemp.map(e => e.orden)) : -1;
  etapasTemp.push({
    id: newId,
    nombre: 'Nueva Etapa',
    orden: maxOrden + 1
  });

  renderEtapasManagerModal();
  showToast('Etapa agregada');
}

function deleteTempEtapa(etapaId) {
  if (etapasTemp.length <= 1) {
    showToast('Debe haber al menos una etapa', 'error');
    return;
  }

  if (!confirm('Eliminar esta etapa? Las tareas en ella quedaran sin etapa.')) return;

  etapasTemp = etapasTemp.filter(e => e.id !== etapaId);
  renderEtapasManagerModal();
}

// --- Accept / Cancel ---

function acceptEtapasManager() {
  // Apply temp changes to real data
  etapasData = etapasTemp.map(e => ({ ...e }));

  // Reassign tasks with deleted etapas to first etapa
  const sortedEtapas = etapasData.sort((a, b) => a.orden - b.orden);
  const firstEtapa = sortedEtapas[0];
  if (firstEtapa) {
    for (const p of proyectosData) {
      for (const t of p.tareas) {
        if (!etapasData.find(e => e.id === t.etapaId)) {
          t.etapaId = firstEtapa.id;
        }
      }
    }
  }

  closeModal();
  renderProyectos();
  showToast('Etapas actualizadas');
}

function cancelEtapasManager() {
  etapasTemp = [];
  closeModal();
}

Router.register('/proyectos', renderProyectos);
