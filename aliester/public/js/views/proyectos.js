/* Aliester - Proyectos View (with Drag & Drop) */

const proyectosData = [
  { id: 1, nombre: 'App Aliester', descripcion: 'Desarrollar sistema de gestion personal', estado: 'activo', tareas: [
    { id: 101, titulo: 'Configurar proyecto', estado: 'completado', prioridad: 'media' },
    { id: 102, titulo: 'Disenar UI', estado: 'completado', prioridad: 'alta' },
    { id: 103, titulo: 'Desarrollar backend', estado: 'en-progreso', prioridad: 'alta' },
    { id: 104, titulo: 'Integrar frontend', estado: 'pendiente', prioridad: 'media' },
  ]},
  { id: 2, nombre: 'Aprender Guitarra', descripcion: 'Practicar 30 min diarios', estado: 'activo', tareas: [
    { id: 201, titulo: 'Comprar cuerdas', estado: 'completado', prioridad: 'baja' },
    { id: 202, titulo: 'Aprender acordes basicos', estado: 'en-progreso', prioridad: 'media' },
    { id: 203, titulo: 'Primer tema completo', estado: 'pendiente', prioridad: 'baja' },
  ]},
  { id: 3, nombre: 'Renovar licencia', descripcion: 'Tramites del carro', estado: 'activo', tareas: [
    { id: 301, titulo: 'Revisar documentos', estado: 'pendiente', prioridad: 'alta' },
    { id: 302, titulo: 'Pagar derecho de placas', estado: 'pendiente', prioridad: 'alta' },
    { id: 303, titulo: 'Ir al infraverm', estado: 'pendiente', prioridad: 'media' },
  ]},
];

let kanbanFilter = 'todos';
let draggedTareaId = null;

function renderProyectos() {
  const allTareas = proyectosData.flatMap(p => p.tareas);
  const pendientes = allTareas.filter(t => t.estado === 'pendiente');
  const enProgreso = allTareas.filter(t => t.estado === 'en-progreso');
  const completadas = allTareas.filter(t => t.estado === 'completado');

  const html = `
    <div class="control-panel">
      <h2 class="control-panel-title">Proyectos y Tareas</h2>
      <div class="control-panel-spacer"></div>
      <div class="control-panel-filters">
        <button class="filter-pill ${kanbanFilter === 'todos' ? 'active' : ''}" onclick="kanbanFilter='todos';renderProyectos()">Todos</button>
        <button class="filter-pill ${kanbanFilter === 'alta' ? 'active' : ''}" onclick="kanbanFilter='alta';renderProyectos()">Alta prioridad</button>
      </div>
      <div class="control-panel-actions">
        <button class="btn btn-primary btn-sm" onclick="openTareaModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Tarea
        </button>
      </div>
    </div>

    <div class="kanban">
      <div class="kanban-column" data-estado="pendiente">
        <div class="kanban-column-header">
          <span class="kanban-column-title">
            Pendiente
            <span class="kanban-column-count">${pendientes.length}</span>
          </span>
        </div>
        <div class="kanban-column-body" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'pendiente')">
          ${pendientes.map(t => renderKanbanCard(t)).join('')}
        </div>
      </div>

      <div class="kanban-column" data-estado="en-progreso">
        <div class="kanban-column-header">
          <span class="kanban-column-title">
            En Progreso
            <span class="kanban-column-count">${enProgreso.length}</span>
          </span>
        </div>
        <div class="kanban-column-body" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'en-progreso')">
          ${enProgreso.map(t => renderKanbanCard(t)).join('')}
        </div>
      </div>

      <div class="kanban-column" data-estado="completado">
        <div class="kanban-column-header">
          <span class="kanban-column-title">
            Completado
            <span class="kanban-column-count">${completadas.length}</span>
          </span>
        </div>
        <div class="kanban-column-body" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'completado')">
          ${completadas.map(t => renderKanbanCard(t)).join('')}
        </div>
      </div>
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

function handleDrop(event, nuevoEstado) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');

  const tareaId = parseInt(event.dataTransfer.getData('text/plain'));
  if (!tareaId) return;

  // Find and update the task
  for (const p of proyectosData) {
    const tarea = p.tareas.find(t => t.id === tareaId);
    if (tarea) {
      if (tarea.estado !== nuevoEstado) {
        tarea.estado = nuevoEstado;
        renderProyectos();
        showToast(`Tarea movida a "${nuevoEstado.replace('-', ' ')}"`);
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
    <div class="form-group full">
      <div class="form-field">
        <label>Descripcion</label>
        <textarea class="input" id="tarea-desc" placeholder="Descripcion opcional"></textarea>
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
    <div class="form-group">
      <div class="form-field">
        <label>Estado</label>
        <select class="input" id="tarea-estado">
          <option value="pendiente">Pendiente</option>
          <option value="en-progreso">En Progreso</option>
        </select>
      </div>
      <div class="form-field">
        <label>Fecha limite</label>
        <input type="date" class="input" id="tarea-fecha">
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
  const estado = document.getElementById('tarea-estado').value;
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
      estado,
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
        <label>Estado</label>
        <select class="input" id="detail-estado">
          <option value="pendiente" ${tarea.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="en-progreso" ${tarea.estado === 'en-progreso' ? 'selected' : ''}>En Progreso</option>
          <option value="completado" ${tarea.estado === 'completado' ? 'selected' : ''}>Completado</option>
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
      t.estado = document.getElementById('detail-estado').value;
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

Router.register('/proyectos', renderProyectos);
