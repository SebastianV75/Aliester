/* Aliester - Main App & Router */

// Simple Router
const Router = {
  routes: {},
  current: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    const path = window.location.hash.slice(1) || '/';
    const handler = this.routes[path];
    if (handler) {
      this.current = path;
      handler();
      this.updateSidebar(path);
      this.updateBreadcrumb(path);
    }
  },

  updateSidebar(path) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      const route = item.getAttribute('data-route');
      item.classList.toggle('active', route === path);
    });
  },

  updateBreadcrumb(path) {
    const names = {
      '/': 'Dashboard',
      '/cuentas': 'Cuentas',
      '/finanzas': 'Finanzas',
      '/proyectos': 'Proyectos',
      '/calendario': 'Calendario',
      '/notas': 'Notas',
      '/suscripciones': 'Suscripciones'
    };
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = `
      <span>Aliester</span>
      <span class="navbar-breadcrumb-sep">/</span>
      <span class="navbar-breadcrumb-current">${names[path] || 'Dashboard'}</span>
    `;
  }
};

// Render helper
function render(html) {
  document.getElementById('app-content').innerHTML = html;
}

// Modal
function openModal(title, bodyHtml, footerHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-footer').innerHTML = footerHtml || '';
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

// Toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Init app
document.addEventListener('DOMContentLoaded', () => {
  Router.init();
});
