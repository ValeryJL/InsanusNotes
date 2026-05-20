/* MemoSpace Application Logic - SPA */

// --- DATOS POR DEFECTO ---
const DEFAULT_NOTEBOOKS = [
  {
    id: "nb-welcome",
    name: "Bienvenido 🚀",
    color: "#00f0ff",
    x: 40,
    y: 40,
    width: 280,
    height: 160,
    notes: [
      {
        id: "note-welcome-intro",
        title: "Empezar aquí 📝",
        content: `<h2>¡Te damos la bienvenida a MemoSpace!</h2>
<p>Este es tu espacio personal para organizar notas, tareas e ideas diarias. MemoSpace es un dashboard limpio y moderno estructurado de la siguiente forma:</p>
<ul>
  <li><b>Cuadernos (Carpetas)</b>: Sirven para agrupar tus notas por temas. Hacé clic en un cuaderno en la barra lateral para desplegar u ocultar su lista de notas.</li>
  <li><b>Notas</b>: Las notas reales donde escribís. Hacé clic en cualquier nota dentro de un cuaderno para abrirla en el editor.</li>
  <li><b>Aplicaciones</b>: Accesos rápidos en el dashboard a tus páginas favoritas. Se abren automáticamente en pestañas de tu navegador nativo.</li>
</ul>
<h3>Uso del Editor de Texto</h3>
<p>Podés dar formato a tus notas usando la barra superior estilo <b>Word</b>:</p>
<ul>
  <li>Escribí texto en <b>negrita</b> o <i>itálica</i>.</li>
  <li>Estructurá con listas numeradas o con viñetas.</li>
  <li>Cambiá el tamaño de la letra para destacar subtítulos.</li>
</ul>
<p>¡Esperamos que te sea muy útil! Empezá a editar esta nota directamente para probar.</p>`,
        updatedAt: new Date().toISOString()
      },
      {
        id: "note-welcome-tasks",
        title: "💡 Ideas & Checklists",
        content: `<h3>Mis Tareas Pendientes</h3>
<p>Utilizá la barra de herramientas (botón de la cajita con checkmark) para insertar TODOs interactivos. Podés hacerles clic directamente para completarlos:</p>
<div class="todo-item"><input type="checkbox" checked=""> <span>Probar el editor enriquecido de MemoSpace</span></div>
<div class="todo-item"><input type="checkbox"> <span>Crear mi primer cuaderno nuevo</span></div>
<div class="todo-item"><input type="checkbox"> <span>Agregar mis apps de uso diario (Gmail, GitHub, etc.)</span></div>
<p><i>Nota: El estado de los checkboxes se guarda automáticamente de manera local.</i></p>`,
        updatedAt: new Date().toISOString()
      }
    ]
  }
];

const DEFAULT_APPS = [
  {
    id: "app-google",
    name: "Google",
    url: "https://google.com",
    icon: "🔍",
    color: "rgba(0, 240, 255, 0.08)",
    x: 40,
    y: 240
  },
  {
    id: "app-github",
    name: "GitHub",
    url: "https://github.com",
    icon: "💻",
    color: "rgba(162, 162, 162, 0.08)",
    x: 160,
    y: 240
  },
  {
    id: "app-youtube",
    name: "YouTube",
    url: "https://youtube.com",
    icon: "📺",
    color: "rgba(255, 0, 85, 0.08)",
    x: 280,
    y: 240
  }
];

const DEFAULT_FREE_NOTES = [
  {
    id: "fnote-welcome",
    content: "📌 ¡Nota Libre! (Post-it)\n\nArrastrame desde aquí y cambiá de color abajo.\n\nEscribí lo que quieras directamente.",
    x: 420,
    y: 40,
    width: 220,
    height: 160,
    color: "yellow"
  }
];

// --- ESTADO GLOBAL ---
let state = {
  notebooks: [],
  apps: [],
  freeNotes: [], // Post-its libres
  expandedNotebooks: {}, // Registro de carpetas expandidas
  currentNotebookId: null,
  currentNoteId: null,
  theme: "dark",
  sidebarCollapsed: false, // Registro del estado colapsado de la barra lateral
  customAccent: null // Color de acento global personalizado
};

// --- ELEMENTOS DOM ---
const sidebar = document.getElementById("sidebar");
const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
const mobileToggleBtn = document.getElementById("mobileToggleBtn");
const mobileCloseBtn = document.getElementById("mobileCloseBtn");
const navHomeBtn = document.getElementById("navHomeBtn");
const navSettingsBtn = document.getElementById("navSettingsBtn");
const sidebarNotebookList = document.getElementById("sidebarNotebookList");
const sidebarAppList = document.getElementById("sidebarAppList");
const globalSearchInput = document.getElementById("globalSearchInput");
const currentDateTime = document.getElementById("currentDateTime");

// Botones de Sidebar
const sidebarAddNotebookBtn = document.getElementById("sidebarAddNotebookBtn");
const sidebarAddAppBtn = document.getElementById("sidebarAddAppBtn");

// FAB Flotante
const fabContainer = document.getElementById("fabContainer");
const fabTrigger = document.getElementById("fabTrigger");
const fabAddFreeNote = document.getElementById("fabAddFreeNote");
const fabAddNotebook = document.getElementById("fabAddNotebook");
const fabAddApp = document.getElementById("fabAddApp");

// Secciones
const sectionDashboard = document.getElementById("sectionDashboard");
const sectionSettings = document.getElementById("sectionSettings");
const sectionNotebook = document.getElementById("sectionNotebook");

// Lienzo interactivo
const desktopCanvas = document.getElementById("desktopCanvas");
const desktopViewport = document.querySelector(".desktop-viewport");

// Editor
const wysiwygEditor = document.getElementById("wysiwygEditor");
const noteTitleInput = document.getElementById("noteTitleInput");
const saveStatus = document.getElementById("saveStatus");
const deleteCurrentNoteBtn = document.getElementById("deleteCurrentNoteBtn");
const backToHomeBtn = document.getElementById("backToHomeBtn");

// Barra del editor
const tbBold = document.getElementById("tbBold");
const tbItalic = document.getElementById("tbItalic");
const tbFontSize = document.getElementById("tbFontSize");
const tbBulletList = document.getElementById("tbBulletList");
const tbOrderedList = document.getElementById("tbOrderedList");
const tbTodo = document.getElementById("tbTodo");

// Modales
const notebookModal = document.getElementById("notebookModal");
const notebookForm = document.getElementById("notebookForm");
const notebookModalTitle = document.getElementById("notebookModalTitle");
const notebookIdField = document.getElementById("notebookIdField");
const notebookNameField = document.getElementById("notebookNameField");
const notebookModalClose = document.getElementById("notebookModalClose");
const notebookFormCancel = document.getElementById("notebookFormCancel");
const colorPickerGrid = document.getElementById("colorPickerGrid");

const appModal = document.getElementById("appModal");
const appForm = document.getElementById("appForm");
const appModalTitle = document.getElementById("appModalTitle");
const appIdField = document.getElementById("appIdField");
const appNameField = document.getElementById("appNameField");
const appUrlField = document.getElementById("appUrlField");
const appIconField = document.getElementById("appIconField");
const appModalClose = document.getElementById("appModalClose");
const appFormCancel = document.getElementById("appFormCancel");
const appColorPickerGrid = document.getElementById("appColorPickerGrid");

// Tema Único
const themeToggleBtn = document.getElementById("themeToggleBtn");

// Debounce timer para autosalvar
let saveTimeout = null;

// --- APLICACIÓN DE COLORES Y RENDERIZADO ---
function renderAppIcon(iconRaw) {
  if (!iconRaw) return "🚀";
  const icon = iconRaw.trim();
  if (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("data:image")) {
    return `<img src="${escapeHTML(icon)}" style="width: 1em; height: 1em; object-fit: contain; border-radius: 4px; display: inline-block; vertical-align: text-bottom;">`;
  }
  return escapeHTML(icon);
}

function hexToRgbStr(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function darkenColor(hex, percent) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

function applyAccentColor(hex) {
  state.customAccent = hex;
  saveStateToStorage();

  if (!hex) {
    document.documentElement.style.removeProperty("--accent-color");
    document.documentElement.style.removeProperty("--accent-hover");
    document.documentElement.style.removeProperty("--accent-rgb");
    return;
  }

  const rgb = hexToRgbStr(hex);
  const hover = darkenColor(hex, 0.15);

  document.documentElement.style.setProperty("--accent-color", hex);
  document.documentElement.style.setProperty("--accent-hover", hover);
  document.documentElement.style.setProperty("--accent-rgb", rgb);
}

function updateAccentPickerActive() {
  const pickerGrid = document.getElementById("accentColorPickerGrid");
  if (!pickerGrid) return;

  const currentAccent = state.customAccent || (state.theme === "light" ? "#ff0055" : "#00f0ff");

  pickerGrid.querySelectorAll(".color-option").forEach(el => {
    if (el.getAttribute("data-color").toLowerCase() === currentAccent.toLowerCase()) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}

// --- FUNCIONES DE PERSISTENCIA Y MIGRACIÓN ---
function loadState() {
  const localData = localStorage.getItem("memospace_state");
  if (localData) {
    try {
      state = JSON.parse(localData);
      
      if (!state.expandedNotebooks) {
        state.expandedNotebooks = {};
      }
      if (state.sidebarCollapsed === undefined) {
        state.sidebarCollapsed = false;
      }
      if (state.customAccent === undefined) {
        state.customAccent = null;
      }
      if (!state.freeNotes) {
        state.freeNotes = [];
      }
      
      // Asegurar que cuadernos tengan coordenadas
      state.notebooks.forEach((nb, index) => {
        if (nb.x === undefined || nb.y === undefined) {
          nb.x = 40 + (index % 3) * 320;
          nb.y = 40 + Math.floor(index / 3) * 280;
        }
        if (nb.width === undefined) {
          nb.width = 280;
        }
        if (nb.height === undefined) {
          nb.height = 160;
        }
      });

      // Asegurar que apps tengan coordenadas
      state.apps.forEach((app, index) => {
        if (app.x === undefined || app.y === undefined) {
          app.x = 40 + (index % 8) * 120;
          app.y = 520 + Math.floor(index / 8) * 120;
        }
      });

      // Migración del modelo viejo (mainNote -> notes)
      let migrated = false;
      state.notebooks = state.notebooks.map(nb => {
        if (nb.mainNote) {
          migrated = true;
          const notes = nb.notes || [];
          if (nb.mainNote.title || nb.mainNote.content) {
            notes.unshift({
              id: nb.mainNote.id || "note-main-" + nb.id,
              title: nb.mainNote.title || "Nota Principal",
              content: nb.mainNote.content || "",
              updatedAt: nb.mainNote.updatedAt || new Date().toISOString()
            });
          }
          delete nb.mainNote;
          nb.notes = notes;
        }
        return nb;
      });
      
      if (migrated) {
        saveStateToStorage();
      }
    } catch (e) {
      console.error("Error cargando estado, restaurando por defecto", e);
      restoreDefaultState();
    }
  } else {
    restoreDefaultState();
  }

  // Cargar Tema
  setTheme(state.theme);

  // Cargar Acento Personalizado
  applyAccentColor(state.customAccent);

  // Cargar Colapso de Sidebar
  setSidebarCollapsed(state.sidebarCollapsed);
}

function restoreDefaultState() {
  state.notebooks = JSON.parse(JSON.stringify(DEFAULT_NOTEBOOKS));
  state.apps = JSON.parse(JSON.stringify(DEFAULT_APPS));
  state.freeNotes = JSON.parse(JSON.stringify(DEFAULT_FREE_NOTES));
  state.expandedNotebooks = {};
  state.currentNotebookId = null;
  state.currentNoteId = null;
  state.theme = "dark";
  state.sidebarCollapsed = false;
  state.customAccent = null;
  saveStateToStorage();
}

function saveStateToStorage() {
  localStorage.setItem("memospace_state", JSON.stringify(state));
}

// --- RENDERIZADO ---
function initApp() {
  loadState();
  renderSidebar();
  renderDashboard();
  updateTime();
  setInterval(updateTime, 1000);
  setupEventListeners();
  navigateTo("dashboard");
}

function updateTime() {
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  currentDateTime.textContent = now.toLocaleDateString('es-ES', options);
}

function renderSidebar() {
  sidebarNotebookList.innerHTML = "";
  state.notebooks.forEach(nb => {
    const isExpanded = !!state.expandedNotebooks[nb.id];
    
    const folderDiv = document.createElement("div");
    folderDiv.className = `sidebar-folder ${isExpanded ? "expanded" : ""}`;
    folderDiv.setAttribute("data-notebook-id", nb.id);
    
    const folderHeader = document.createElement("div");
    folderHeader.className = "sidebar-folder-header";
    folderHeader.innerHTML = `
      <span class="folder-arrow">▶</span>
      <span class="dot" style="background-color: ${nb.color}"></span>
      <span class="folder-name" style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(nb.name)}</span>
      <div class="sidebar-actions">
        <button class="add-note-inline-btn" title="Nueva Nota"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>
        <button class="sidebar-action-btn edit-btn" title="Editar Cuaderno"><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
        <button class="sidebar-action-btn delete-btn" title="Eliminar Cuaderno"><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
      </div>
    `;
    
    folderHeader.addEventListener("click", (e) => {
      const btnAdd = e.target.closest(".add-note-inline-btn");
      const btnEdit = e.target.closest(".edit-btn");
      const btnDelete = e.target.closest(".delete-btn");

      if (btnAdd) {
        e.stopPropagation();
        createNoteInNotebook(nb.id);
        return;
      }
      if (btnEdit) {
        e.stopPropagation();
        showNotebookForm(nb.id);
        return;
      }
      if (btnDelete) {
        e.stopPropagation();
        deleteNotebook(nb.id);
        return;
      }
      
      if (state.sidebarCollapsed) {
        setSidebarCollapsed(false);
        state.expandedNotebooks[nb.id] = true;
        saveStateToStorage();
        renderSidebar();
      } else {
        toggleNotebookExpand(nb.id);
      }
    });
    
    const folderContent = document.createElement("div");
    folderContent.className = "sidebar-folder-content";
    
    const notes = nb.notes || [];
    if (notes.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.style.padding = "4px 12px";
      emptyMsg.style.fontSize = "0.75rem";
      emptyMsg.style.color = "var(--text-muted)";
      emptyMsg.style.fontStyle = "italic";
      emptyMsg.textContent = "Sin notas";
      folderContent.appendChild(emptyMsg);
    } else {
      notes.forEach(note => {
        const noteItem = document.createElement("div");
        noteItem.className = `sidebar-note-item ${state.currentNoteId === note.id ? "active" : ""}`;
        noteItem.setAttribute("data-note-id", note.id);
        noteItem.innerHTML = `
          <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(note.title || "Sin título")}</span>
          <button class="sidebar-action-btn delete-btn" title="Eliminar Nota"><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        `;
        
        noteItem.addEventListener("click", (e) => {
          if (e.target.closest(".delete-btn")) {
            e.stopPropagation();
            deleteNoteFromNotebook(nb.id, note.id);
            return;
          }
          e.stopPropagation();
          openNote(nb.id, note.id);
          closeSidebarMobile();
        });
        
        folderContent.appendChild(noteItem);
      });
    }
    
    folderDiv.appendChild(folderHeader);
    folderDiv.appendChild(folderContent);
    sidebarNotebookList.appendChild(folderDiv);
  });

  sidebarAppList.innerHTML = "";
  state.apps.forEach(app => {
    const item = document.createElement("div");
    item.className = "sidebar-list-item";
    item.innerHTML = `
      <div class="sidebar-list-item-content" style="flex:1; min-width:0;">
        <span style="margin-right: 10px; font-size: 1.1rem; flex-shrink:0;">${renderAppIcon(app.icon)}</span>
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0;">${escapeHTML(app.name)}</span>
      </div>
      <div class="sidebar-actions">
        <button class="sidebar-action-btn edit-btn" title="Editar App"><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
        <button class="sidebar-action-btn delete-btn" title="Eliminar App"><svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
      </div>
    `;
    item.addEventListener("click", (e) => {
      const btnEdit = e.target.closest(".edit-btn");
      const btnDelete = e.target.closest(".delete-btn");

      if (btnEdit) {
        e.stopPropagation();
        showAppForm(app.id);
        return;
      }
      if (btnDelete) {
        e.stopPropagation();
        deleteApp(app.id);
        return;
      }

      window.open(app.url, "_blank");
      closeSidebarMobile();
    });
    sidebarAppList.appendChild(item);
  });
}

function renderDashboard() {
  desktopCanvas.innerHTML = "";

  // Renderizar Cuadernos
  state.notebooks.forEach(nb => {
    let previewHTML = "";
    if (nb.notes && nb.notes.length > 0) {
      const firstNote = nb.notes[0];
      const cleanText = stripHTML(firstNote.content);
      previewHTML = `<div class="notebook-card-preview-blur">${escapeHTML(cleanText.substring(0, 180))}...</div>`;
    } else {
      previewHTML = `<div class="notebook-card-preview-blur" style="font-style: italic;">Cuaderno vacío</div>`;
    }

    const card = document.createElement("div");
    card.className = "notebook-card";
    card.setAttribute("data-id", nb.id);
    card.style.left = `${nb.x}px`;
    card.style.top = `${nb.y}px`;
    card.style.width = `${nb.width}px`;
    card.style.height = `${nb.height}px`;

    card.innerHTML = `
      <div class="notebook-card-color-bar" style="background-color: ${nb.color}"></div>
      <div class="notebook-card-header">
        <div class="notebook-card-title">${escapeHTML(nb.name)}</div>
        <div class="card-actions">
          <button class="card-action-btn btn-add-note" title="Agregar Nota" data-id="${nb.id}">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
          <button class="card-action-btn btn-edit" title="Editar Cuaderno" data-id="${nb.id}">
            <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="card-action-btn btn-delete" title="Eliminar Cuaderno" data-id="${nb.id}">
            <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
      <div class="notebook-card-preview">
        ${previewHTML}
      </div>
      <div class="notebook-card-footer">
        <span class="note-count-badge">
          <svg viewBox="0 0 24 24" width="10" height="10"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          ${(nb.notes ? nb.notes.length : 0)} notas
        </span>
      </div>
      <div class="resize-handle"></div>
    `;

    card.querySelector(".btn-add-note").addEventListener("click", (e) => {
      e.stopPropagation();
      createNoteInNotebook(nb.id);
    });

    card.querySelector(".btn-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      showNotebookForm(nb.id);
    });
    card.querySelector(".btn-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteNotebook(nb.id);
    });

    const header = card.querySelector(".notebook-card-header");
    setupDraggable(card, header, nb, "notebook");
    
    const resizeHandle = card.querySelector(".resize-handle");
    setupResizable(card, resizeHandle, nb, "notebook");

    desktopCanvas.appendChild(card);
  });

  // Renderizar Apps
  state.apps.forEach(app => {
    const card = document.createElement("div");
    card.className = "app-card";
    card.setAttribute("data-id", app.id);
    card.style.left = `${app.x}px`;
    card.style.top = `${app.y}px`;
    card.style.backgroundColor = app.color;
    card.style.borderColor = app.color.replace("0.08", "0.25").replace("0.15", "0.35");
    
    card.innerHTML = `
      <div class="card-actions">
        <button class="card-action-btn btn-edit" title="Editar App" data-id="${app.id}">
          <svg viewBox="0 0 24 24" width="10" height="10"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="card-action-btn btn-delete" title="Eliminar App" data-id="${app.id}">
          <svg viewBox="0 0 24 24" width="10" height="10"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
      <div class="app-card-icon">${renderAppIcon(app.icon)}</div>
      <div class="app-card-name">${escapeHTML(app.name)}</div>
    `;

    card.querySelector(".btn-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      showAppForm(app.id);
    });
    card.querySelector(".btn-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteApp(app.id);
    });

    setupDraggable(card, card, app, "app");

    desktopCanvas.appendChild(card);
  });

  // Renderizar Notas Libres (Post-its)
  state.freeNotes.forEach(fn => {
    const card = document.createElement("div");
    card.className = `free-note-card color-${fn.color || 'yellow'}`;
    card.setAttribute("data-id", fn.id);
    card.style.left = `${fn.x}px`;
    card.style.top = `${fn.y}px`;
    card.style.width = `${fn.width}px`;
    card.style.height = `${fn.height}px`;
    if (fn.zIndex) {
      card.style.zIndex = fn.zIndex;
    }

    card.innerHTML = `
      <div class="free-note-header">
        <span>Sticker</span>
        <div class="card-actions">
          <button class="card-action-btn btn-delete" title="Eliminar Nota" data-id="${fn.id}">
            <svg viewBox="0 0 24 24" width="10" height="10"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>
      <textarea class="free-note-body" placeholder="Escribe aquí...">${escapeHTML(fn.content)}</textarea>
      <div class="free-note-footer">
        <div class="free-note-colors">
          <div class="free-note-color-dot" style="background-color: #ffd60a;" data-color="yellow" title="Amarillo"></div>
          <div class="free-note-color-dot" style="background-color: #00f0ff;" data-color="cyan" title="Celeste"></div>
          <div class="free-note-color-dot" style="background-color: #ff0055;" data-color="pink" title="Rosa"></div>
          <div class="free-note-color-dot" style="background-color: #39ff14;" data-color="lime" title="Verde"></div>
        </div>
      </div>
      <div class="resize-handle"></div>
    `;

    // Sincronizar contenido en tiempo real
    const textarea = card.querySelector(".free-note-body");
    textarea.addEventListener("input", (e) => {
      fn.content = e.target.value;
      saveStateToStorage();
    });

    // Cambiar color de nota libre
    card.querySelectorAll(".free-note-color-dot").forEach(dot => {
      dot.addEventListener("click", () => {
        const color = dot.getAttribute("data-color");
        fn.color = color;
        saveStateToStorage();
        card.className = `free-note-card color-${color}`;
      });
    });

    // Eliminar nota libre
    card.querySelector(".btn-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFreeNote(fn.id);
    });

    const header = card.querySelector(".free-note-header");
    setupDraggable(card, header, fn, "freenote");

    const resizeHandle = card.querySelector(".resize-handle");
    setupResizable(card, resizeHandle, fn, "freenote");

    desktopCanvas.appendChild(card);
  });

  updateAllFreeNoteOverlaps();
}

// --- ARRASTRE Y REDIMENSIONADO INTERACTIVOS ---
let activeDragEvent = null;
let activeResizeEvent = null;
let autoScrollInterval = null;

// Minimum logical size for notebooks (matches CSS min-width/min-height, in 20px grid steps)
const MIN_NOTEBOOK_W = 220; // 2 extra grid squares vs original 180
const MIN_NOTEBOOK_H = 140; // 1 extra grid square vs original 120

function getFirstCollidingObject(id, x, y, width, height) {
  const targetX = Number(x);
  const targetY = Number(y);
  const targetW = Number(width);
  const targetH = Number(height);

  // Check notebooks (standard AABB)
  for (let nb of state.notebooks) {
    if (nb.id === id) continue;
    const nbX = Number(nb.x);
    const nbY = Number(nb.y);
    const nbW = Number(nb.width || 280);
    const nbH = Number(nb.height || 160);
    if (targetX < nbX + nbW && targetX + targetW > nbX &&
        targetY < nbY + nbH && targetY + targetH > nbY) {
      return { x: nbX, y: nbY, width: nbW, height: nbH };
    }
  }
  // Check apps (standard AABB)
  for (let app of state.apps) {
    if (app.id === id) continue;
    const appX = Number(app.x);
    const appY = Number(app.y);
    const appW = Number(app.width || 90);
    const appH = Number(app.height || 90);
    if (targetX < appX + appW && targetX + targetW > appX &&
        targetY < appY + appH && targetY + targetH > appY) {
      return { x: appX, y: appY, width: appW, height: appH };
    }
  }
  return null;
}

function findCollisionFreePosition(id, targetX, targetY, w, h, currentX, currentY) {
  const numW = Number(w);
  const numH = Number(h);
  const numCurX = Number(currentX);
  const numCurY = Number(currentY);
  const GAP = 2;

  // 1. No collision at target -> accept it
  if (!getFirstCollidingObject(id, targetX, targetY, numW, numH)) {
    return { x: targetX, y: targetY };
  }

  // 2. Try X-only movement: (targetX, currentY)
  let nextX = targetX;
  let nextY = numCurY;

  const xCollider = getFirstCollidingObject(id, targetX, numCurY, numW, numH);
  if (xCollider) {
    if (targetX > numCurX)      nextX = xCollider.x - numW - GAP;
    else if (targetX < numCurX) nextX = xCollider.x + xCollider.width + GAP;
    else                         nextX = numCurX;
    if (getFirstCollidingObject(id, nextX, numCurY, numW, numH)) nextX = numCurX;
  }

  // 3. Try Y-only movement: (currentX, targetY)
  const yCollider = getFirstCollidingObject(id, numCurX, targetY, numW, numH);
  let resolvedY = targetY;
  if (yCollider) {
    if (targetY > numCurY)      resolvedY = yCollider.y - numH - GAP;
    else if (targetY < numCurY) resolvedY = yCollider.y + yCollider.height + GAP;
    else                         resolvedY = numCurY;
    if (getFirstCollidingObject(id, numCurX, resolvedY, numW, numH)) resolvedY = numCurY;
  }
  nextY = resolvedY;

  // 4. Test combined (nextX, nextY)
  if (!getFirstCollidingObject(id, nextX, nextY, numW, numH)) {
    return { x: nextX, y: nextY };
  }

  // 5. Combined still collides (diagonal approach edge-case).
  //    Do a single minimum-penetration push-out from (nextX, nextY) — no directional bias.
  const combined = getFirstCollidingObject(id, nextX, nextY, numW, numH);
  if (combined) {
    const pushOpts = [
      { x: combined.x + combined.width + GAP, y: nextY,  cost: Math.abs(combined.x + combined.width + GAP - nextX) },
      { x: combined.x - numW - GAP,           y: nextY,  cost: Math.abs(combined.x - numW - GAP - nextX)           },
      { x: nextX, y: combined.y + combined.height + GAP, cost: Math.abs(combined.y + combined.height + GAP - nextY) },
      { x: nextX, y: combined.y - numH - GAP,            cost: Math.abs(combined.y - numH - GAP - nextY)           },
    ].sort((a, b) => a.cost - b.cost);

    for (const opt of pushOpts) {
      if (!getFirstCollidingObject(id, opt.x, opt.y, numW, numH)) {
        return { x: opt.x, y: opt.y };
      }
    }
  }

  // 6. Fallbacks to single-axis movement
  if (!getFirstCollidingObject(id, nextX, numCurY, numW, numH)) return { x: nextX, y: numCurY };
  if (!getFirstCollidingObject(id, numCurX, nextY, numW, numH)) return { x: numCurX, y: nextY };
  return { x: numCurX, y: numCurY };
}

function findCollisionFreeSize(id, x, y, targetW, targetH, currentW, currentH) {
  const numX = Number(x);
  const numY = Number(y);
  const numCurW = Number(currentW);
  const numCurH = Number(currentH);

  // 1. Try to resize to the target size directly
  let collider = getFirstCollidingObject(id, numX, numY, targetW, targetH);
  if (!collider) {
    return { width: targetW, height: targetH };
  }

  // 2. Try W-only resize: (x, y, targetW, currentH)
  let nextW = targetW;
  let nextH = targetH;

  let wCollider = getFirstCollidingObject(id, numX, numY, targetW, numCurH);
  if (wCollider) {
    if (targetW > numCurW) {
      nextW = Math.floor((wCollider.x - numX - GAP) / 20) * 20;
      if (nextW <= 0) nextW = numCurW;
    } else {
      nextW = numCurW;
    }
    // DO NOT snap nextW to grid when clamped
    if (getFirstCollidingObject(id, numX, numY, nextW, numCurH)) {
      nextW = numCurW;
    }
  }

  // 3. Try H-only resize: (x, y, currentW, targetH)
  let hCollider = getFirstCollidingObject(id, numX, numY, numCurW, targetH);
  if (hCollider) {
    if (targetH > numCurH) {
      nextH = Math.floor((hCollider.y - numY - GAP) / 20) * 20;
      if (nextH <= 0) nextH = numCurH;
    } else {
      nextH = numCurH;
    }
    // DO NOT snap nextH to grid when clamped
    if (getFirstCollidingObject(id, numX, numY, numCurW, nextH)) {
      nextH = numCurH;
    }
  }

  nextW = Math.max(MIN_NOTEBOOK_W, nextW);
  nextH = Math.max(MIN_NOTEBOOK_H, nextH);

  // 4. Test the combined next size: (x, y, nextW, nextH)
  if (!getFirstCollidingObject(id, numX, numY, nextW, nextH)) {
    return { width: nextW, height: nextH };
  }

  // 5. Fallbacks
  if (!getFirstCollidingObject(id, numX, numY, nextW, numCurH)) {
    return { width: nextW, height: numCurH };
  }
  if (!getFirstCollidingObject(id, numX, numY, numCurW, nextH)) {
    return { width: numCurW, height: nextH };
  }

  return { width: numCurW, height: numCurH };
}

function findFreePlacement(w, h) {
  const step = 20;
  for (let y = 20; y + h < 4000; y += step) {
    for (let x = 20; x + w < 4000; x += step) {
      if (!getFirstCollidingObject(null, x, y, w, h)) {
        return { x, y };
      }
    }
  }
  return { x: 20, y: 20 };
}


function setupDraggable(element, dragHandle, dataObj, type) {
  let downX, downY;
  let elementX, elementY;
  let lastValidX = dataObj.x;
  let lastValidY = dataObj.y;
  let isDragging = false;
  let hasMoved = false;
  let capturedPointerId = null;

  dragHandle.addEventListener("pointerdown", onPointerDown);

  if (type === "freenote") {
    element.addEventListener("pointerdown", () => {
      bringFreeNoteToFront(dataObj.id);
    });
  }

  function onPointerDown(e) {
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("select") || e.target.closest("textarea")) {
      return;
    }
    
    e.preventDefault();
    capturedPointerId = e.pointerId;
    dragHandle.setPointerCapture(e.pointerId);

    downX = e.clientX + desktopViewport.scrollLeft;
    downY = e.clientY + desktopViewport.scrollTop;
    elementX = dataObj.x;
    elementY = dataObj.y;
    lastValidX = dataObj.x;
    lastValidY = dataObj.y;
    isDragging = true;
    hasMoved = false;

    element.classList.add("dragging");

    dragHandle.addEventListener("pointermove", onPointerMove);
    dragHandle.addEventListener("pointerup", onPointerUp);
    dragHandle.addEventListener("pointercancel", onPointerCancel);
  }

  function updatePosition() {
    if (!activeDragEvent) return;
    const currentX = activeDragEvent.clientX + desktopViewport.scrollLeft;
    const currentY = activeDragEvent.clientY + desktopViewport.scrollTop;

    const dx = currentX - downX;
    const dy = currentY - downY;

    let targetX = elementX + dx;
    let targetY = elementY + dy;

    // Snapping a la grilla visual de 20px
    targetX = Math.round(targetX / 20) * 20;
    targetY = Math.round(targetY / 20) * 20;

    // Límites
    const elementW = type === "notebook" ? (dataObj.width || 280) : 90;
    const elementH = type === "notebook" ? (dataObj.height || 160) : 90;
    const maxW = 4000 - elementW;
    const maxH = 4000 - elementH;
    targetX = Math.max(0, Math.min(targetX, maxW));
    targetY = Math.max(0, Math.min(targetY, maxH));

    let newX = targetX;
    let newY = targetY;
    if (type === "notebook" || type === "app") {
      const freePos = findCollisionFreePosition(dataObj.id, targetX, targetY, elementW, elementH, lastValidX, lastValidY);
      newX = freePos.x;
      newY = freePos.y;
    }

    lastValidX = newX;
    lastValidY = newY;

    dataObj.x = newX;
    dataObj.y = newY;

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;

    updateAllFreeNoteOverlaps();
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    activeDragEvent = e;
    const currentX = e.clientX + desktopViewport.scrollLeft;
    const currentY = e.clientY + desktopViewport.scrollTop;
    const dx = currentX - downX;
    const dy = currentY - downY;

    if (!hasMoved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      hasMoved = true;
    }

    if (hasMoved) {
      updatePosition();
      startAutoScrollLoop(updatePosition);
    }
  }

  function onPointerUp(e) {
    cleanup();
    if (isDragging) {
      isDragging = false;
      element.classList.remove("dragging");

      if (hasMoved) {
        saveStateToStorage();
        updateAllFreeNoteOverlaps();
      } else {
        if (type === "notebook") {
          setSidebarCollapsed(false);
          expandNotebook(dataObj.id);
          const folderEl = document.querySelector(`.sidebar-folder[data-notebook-id="${dataObj.id}"]`);
          if (folderEl) {
            folderEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else if (type === "app") {
          window.open(dataObj.url, "_blank");
        }
      }
    }
  }

  function onPointerCancel(e) {
    cleanup();
    if (isDragging) {
      isDragging = false;
      element.classList.remove("dragging");
    }
  }

  function cleanup() {
    stopAutoScrollLoop();
    activeDragEvent = null;
    dragHandle.removeEventListener("pointermove", onPointerMove);
    dragHandle.removeEventListener("pointerup", onPointerUp);
    dragHandle.removeEventListener("pointercancel", onPointerCancel);
    if (capturedPointerId !== null) {
      try { dragHandle.releasePointerCapture(capturedPointerId); } catch(_) {}
      capturedPointerId = null;
    }
  }

  function startAutoScrollLoop(dragUpdateFn) {
    if (autoScrollInterval) return;

    autoScrollInterval = setInterval(() => {
      if (!isDragging || !activeDragEvent) {
        stopAutoScrollLoop();
        return;
      }

      const viewportRect = desktopViewport.getBoundingClientRect();
      const mouseX = activeDragEvent.clientX;
      const mouseY = activeDragEvent.clientY;

      let scrollX = 0;
      let scrollY = 0;
      const threshold = 60;
      const speed = 12;

      if (mouseX > viewportRect.right - threshold) {
        scrollX = speed;
      } else if (mouseX < viewportRect.left + threshold) {
        scrollX = -speed;
      }

      if (mouseY > viewportRect.bottom - threshold) {
        scrollY = speed;
      } else if (mouseY < viewportRect.top + threshold) {
        scrollY = -speed;
      }

      if (scrollX !== 0 || scrollY !== 0) {
        desktopViewport.scrollLeft += scrollX;
        desktopViewport.scrollTop += scrollY;
        dragUpdateFn();
      }
    }, 20);
  }

  function stopAutoScrollLoop() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }
}

function setupResizable(element, resizeHandle, dataObj, type) {
  let downX, downY;
  let startWidth, startHeight;
  let lastValidW = dataObj.width;
  let lastValidH = dataObj.height;
  let isResizing = false;
  let capturedPointerId = null;

  resizeHandle.addEventListener("pointerdown", onPointerDown);

  function onPointerDown(e) {
    e.preventDefault();
    e.stopPropagation();
    capturedPointerId = e.pointerId;
    resizeHandle.setPointerCapture(e.pointerId);

    downX = e.clientX + desktopViewport.scrollLeft;
    downY = e.clientY + desktopViewport.scrollTop;
    startWidth = dataObj.width;
    startHeight = dataObj.height;
    lastValidW = dataObj.width;
    lastValidH = dataObj.height;
    isResizing = true;

    element.classList.add("resizing");

    resizeHandle.addEventListener("pointermove", onPointerMove);
    resizeHandle.addEventListener("pointerup", onPointerUp);
    resizeHandle.addEventListener("pointercancel", onPointerCancel);
  }

  function updateSize() {
    if (!activeResizeEvent) return;
    const currentX = activeResizeEvent.clientX + desktopViewport.scrollLeft;
    const currentY = activeResizeEvent.clientY + desktopViewport.scrollTop;

    const dx = currentX - downX;
    const dy = currentY - downY;

    // Snapping a la grilla visual de 20px
    let targetW = startWidth + dx;
    let targetH = startHeight + dy;

    targetW = Math.round(targetW / 20) * 20;
    targetH = Math.round(targetH / 20) * 20;

    // Mínimos (en sync con CSS min-width/min-height)
    targetW = Math.max(MIN_NOTEBOOK_W, targetW);
    targetH = Math.max(MIN_NOTEBOOK_H, targetH);

    // Límites
    const maxW = 4000 - dataObj.x;
    const maxH = 4000 - dataObj.y;
    targetW = Math.min(targetW, maxW);
    targetH = Math.min(targetH, maxH);

    let newW = targetW;
    let newH = targetH;
    if (type === "notebook") {
      const freeSize = findCollisionFreeSize(dataObj.id, dataObj.x, dataObj.y, targetW, targetH, lastValidW, lastValidH);
      newW = freeSize.width;
      newH = freeSize.height;
    }

    lastValidW = newW;
    lastValidH = newH;

    dataObj.width = newW;
    dataObj.height = newH;

    element.style.width = `${newW}px`;
    element.style.height = `${newH}px`;

    updateAllFreeNoteOverlaps();
  }

  function onPointerMove(e) {
    if (!isResizing) return;

    activeResizeEvent = e;
    updateSize();
    startResizeAutoScrollLoop(updateSize);
  }

  function onPointerUp(e) {
    cleanup();
    if (isResizing) {
      isResizing = false;
      element.classList.remove("resizing");
      saveStateToStorage();
      updateAllFreeNoteOverlaps();
    }
  }

  function onPointerCancel(e) {
    cleanup();
    if (isResizing) {
      isResizing = false;
      element.classList.remove("resizing");
    }
  }

  function cleanup() {
    stopResizeAutoScrollLoop();
    activeResizeEvent = null;
    resizeHandle.removeEventListener("pointermove", onPointerMove);
    resizeHandle.removeEventListener("pointerup", onPointerUp);
    resizeHandle.removeEventListener("pointercancel", onPointerCancel);
    if (capturedPointerId !== null) {
      try { resizeHandle.releasePointerCapture(capturedPointerId); } catch(_) {}
      capturedPointerId = null;
    }
  }

  function startResizeAutoScrollLoop(resizeUpdateFn) {
    if (autoScrollInterval) return;

    autoScrollInterval = setInterval(() => {
      if (!isResizing || !activeResizeEvent) {
        stopResizeAutoScrollLoop();
        return;
      }

      const viewportRect = desktopViewport.getBoundingClientRect();
      const mouseX = activeResizeEvent.clientX;
      const mouseY = activeResizeEvent.clientY;

      let scrollX = 0;
      let scrollY = 0;
      const threshold = 60;
      const speed = 12;

      if (mouseX > viewportRect.right - threshold) {
        scrollX = speed;
      } else if (mouseX < viewportRect.left + threshold) {
        scrollX = -speed;
      }

      if (mouseY > viewportRect.bottom - threshold) {
        scrollY = speed;
      } else if (mouseY < viewportRect.top + threshold) {
        scrollY = -speed;
      }

      if (scrollX !== 0 || scrollY !== 0) {
        desktopViewport.scrollLeft += scrollX;
        desktopViewport.scrollTop += scrollY;
        resizeUpdateFn();
      }
    }, 20);
  }

  function stopResizeAutoScrollLoop() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }
}

// --- NAVEGACIÓN Y VISTAS ---
function navigateTo(target) {
  if (target === "dashboard") {
    sectionDashboard.style.display = "flex";
    sectionNotebook.style.display = "none";
    sectionSettings.style.display = "none";
    fabContainer.style.display = "flex";
    navHomeBtn.classList.add("active");
    navSettingsBtn.classList.remove("active");
    state.currentNotebookId = null;
    state.currentNoteId = null;
    renderSidebar();
    renderDashboard();
  } else if (target === "settings") {
    sectionDashboard.style.display = "none";
    sectionNotebook.style.display = "none";
    sectionSettings.style.display = "block";
    fabContainer.style.display = "none";
    fabContainer.classList.remove("open");
    fabTrigger.classList.remove("active");
    navHomeBtn.classList.remove("active");
    navSettingsBtn.classList.add("active");
    state.currentNotebookId = null;
    state.currentNoteId = null;
    updateAccentPickerActive();
    renderSidebar();
  } else if (target === "notebook") {
    sectionDashboard.style.display = "none";
    sectionNotebook.style.display = "flex";
    sectionSettings.style.display = "none";
    fabContainer.style.display = "none";
    fabContainer.classList.remove("open");
    fabTrigger.classList.remove("active");
    navHomeBtn.classList.remove("active");
    navSettingsBtn.classList.remove("active");
  }
}

function setSidebarCollapsed(collapsed) {
  if (window.innerWidth <= 992) {
    collapsed = false; // Never allow desktop-collapsed mode on mobile screens
  }
  
  state.sidebarCollapsed = collapsed;
  saveStateToStorage();

  if (collapsed) {
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
  }
}

function toggleNotebookExpand(notebookId) {
  state.expandedNotebooks[notebookId] = !state.expandedNotebooks[notebookId];
  saveStateToStorage();
  renderSidebar();
}

function expandNotebook(notebookId) {
  state.expandedNotebooks[notebookId] = true;
  saveStateToStorage();
  renderSidebar();
}

function openNote(notebookId, noteId) {
  state.currentNotebookId = notebookId;
  state.currentNoteId = noteId;
  
  state.expandedNotebooks[notebookId] = true;
  saveStateToStorage();

  navigateTo("notebook");
  loadNoteContent();
  renderSidebar();
}

// --- LÓGICA DEL EDITOR ---
function loadNoteContent() {
  const nb = state.notebooks.find(n => n.id === state.currentNotebookId);
  if (!nb) return;

  const note = nb.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;

  noteTitleInput.value = note.title || "";
  wysiwygEditor.innerHTML = note.content || "";
  
  saveStatus.textContent = "Cambios guardados";
}

function triggerAutosave() {
  saveStatus.textContent = "Guardando...";
  
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
    saveCurrentNoteContent();
  }, 500);
}

function saveCurrentNoteContent() {
  const nb = state.notebooks.find(n => n.id === state.currentNotebookId);
  if (!nb) return;

  const note = nb.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;

  note.title = noteTitleInput.value.trim() || "Sin título";
  note.content = wysiwygEditor.innerHTML;
  note.updatedAt = new Date().toISOString();

  saveStateToStorage();
  saveStatus.textContent = "Cambios guardados";

  const activeNoteEl = document.querySelector(`.sidebar-note-item[data-note-id="${state.currentNoteId}"]`);
  if (activeNoteEl) {
    const titleSpan = activeNoteEl.querySelector("span");
    if (titleSpan) {
      titleSpan.textContent = note.title || "Sin título";
    }
  }
}

// --- COMANDOS DEL EDITOR ---
function execEditorCommand(command, value = null) {
  wysiwygEditor.focus();
  document.execCommand(command, false, value);
  triggerAutosave();
  updateToolbarState();
}

function updateToolbarState() {
  tbBold.classList.toggle("active", document.queryCommandState("bold"));
  tbItalic.classList.toggle("active", document.queryCommandState("italic"));
  tbBulletList.classList.toggle("active", document.queryCommandState("insertUnorderedList"));
  tbOrderedList.classList.toggle("active", document.queryCommandState("insertOrderedList"));
}

function insertTodoItem() {
  wysiwygEditor.focus();
  const todoHTML = `<div class="todo-item" contenteditable="false"><input type="checkbox"> <span contenteditable="true">Nueva tarea...</span></div><p><br></p>`;
  document.execCommand("insertHTML", false, todoHTML);
  triggerAutosave();
}

// --- GESTIÓN DE NOTAS ---
function createNoteInNotebook(notebookId) {
  const nb = state.notebooks.find(n => n.id === notebookId);
  if (!nb) return;

  const newNote = {
    id: "note-" + Date.now(),
    title: "Nueva Nota",
    content: "<p>Comienza a escribir aquí...</p>",
    updatedAt: new Date().toISOString()
  };

  if (!nb.notes) nb.notes = [];
  nb.notes.push(newNote);
  
  state.expandedNotebooks[notebookId] = true;
  saveStateToStorage();

  openNote(notebookId, newNote.id);
  
  noteTitleInput.focus();
  noteTitleInput.select();
}

function deleteNoteFromNotebook(notebookId, noteId) {
  const nb = state.notebooks.find(n => n.id === notebookId);
  if (!nb) return;

  if (confirm("¿Estás seguro de que querés eliminar esta nota?")) {
    nb.notes = nb.notes.filter(n => n.id !== noteId);
    if (state.currentNoteId === noteId) {
      navigateTo("dashboard");
    } else {
      saveStateToStorage();
      renderSidebar();
      renderDashboard(); // to update preview
    }
  }
}

function deleteCurrentNote() {
  const nb = state.notebooks.find(n => n.id === state.currentNotebookId);
  if (!nb) return;

  if (confirm("¿Estás seguro de que querés eliminar esta nota?")) {
    nb.notes = nb.notes.filter(n => n.id !== state.currentNoteId);
    saveStateToStorage();
    navigateTo("dashboard");
  }
}

// --- GESTIÓN DE CUADERNOS ---
function saveNotebook(e) {
  e.preventDefault();
  const id = notebookIdField.value;
  const name = notebookNameField.value.trim();
  
  const selectedColorEl = colorPickerGrid.querySelector(".color-option.active");
  const color = selectedColorEl ? selectedColorEl.getAttribute("data-color") : "#00f0ff";

  if (!name) return;

  if (id) {
    const nb = state.notebooks.find(n => n.id === id);
    if (nb) {
      nb.name = name;
      nb.color = color;
    }
  } else {
    const pos = findFreePlacement(280, 160);
    const newNotebook = {
      id: "nb-" + Date.now(),
      name: name,
      color: color,
      notes: [],
      x: pos.x,
      y: pos.y,
      width: 280,
      height: 160
    };
    state.notebooks.push(newNotebook);
  }

  saveStateToStorage();
  closeModal(notebookModal);
  renderSidebar();
  renderDashboard();
}

function deleteNotebook(id) {
  const nb = state.notebooks.find(n => n.id === id);
  if (!nb) return;

  if (confirm(`¿Estás seguro de que querés eliminar el cuaderno "${nb.name}" y todas sus notas?`)) {
    state.notebooks = state.notebooks.filter(n => n.id !== id);
    saveStateToStorage();
    renderSidebar();
    renderDashboard();
  }
}

function showNotebookForm(id = null) {
  const colorOpts = colorPickerGrid.querySelectorAll(".color-option");
  colorOpts.forEach(el => el.classList.remove("active"));
  
  if (id) {
    const nb = state.notebooks.find(n => n.id === id);
    if (!nb) return;
    notebookModalTitle.textContent = "Editar Cuaderno";
    notebookIdField.value = nb.id;
    notebookNameField.value = nb.name;
    
    const match = Array.from(colorOpts).find(el => el.getAttribute("data-color") === nb.color);
    if (match) match.classList.add("active");
    else colorOpts[0].classList.add("active");
  } else {
    notebookModalTitle.textContent = "Nuevo Cuaderno";
    notebookIdField.value = "";
    notebookNameField.value = "";
    colorOpts[0].classList.add("active");
  }
  
  openModal(notebookModal);
  notebookNameField.focus();
}

// --- GESTIÓN DE APPS ---
function saveApp(e) {
  e.preventDefault();
  const id = appIdField.value;
  const name = appNameField.value.trim();
  let url = appUrlField.value.trim();
  const icon = appIconField.value.trim() || "🚀";

  const selectedColorEl = appColorPickerGrid.querySelector(".color-option.active");
  const color = selectedColorEl ? selectedColorEl.getAttribute("data-color") : "rgba(0, 240, 255, 0.08)";

  if (!name || !url) return;

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  if (id) {
    const app = state.apps.find(a => a.id === id);
    if (app) {
      app.name = name;
      app.url = url;
      app.icon = icon;
      app.color = color;
    }
  } else {
    const pos = findFreePlacement(90, 90);
    const newApp = {
      id: "app-" + Date.now(),
      name: name,
      url: url,
      icon: icon,
      color: color,
      x: pos.x,
      y: pos.y
    };
    state.apps.push(newApp);
  }

  saveStateToStorage();
  closeModal(appModal);
  renderSidebar();
  renderDashboard();
}

// --- GESTIÓN DE NOTAS LIBRES ---
function createFreeNote() {
  const newNote = {
    id: "fnote-" + Date.now(),
    content: "",
    x: 200 + (state.freeNotes.length % 5) * 40,
    y: 200 + (state.freeNotes.length % 5) * 40,
    width: 220,
    height: 140,
    color: "yellow"
  };
  state.freeNotes.push(newNote);
  saveStateToStorage();
  renderDashboard();

  // Enfocar directamente la nueva nota libre
  const card = desktopCanvas.querySelector(`.free-note-card[data-id="${newNote.id}"]`);
  if (card) {
    const textarea = card.querySelector(".free-note-body");
    if (textarea) textarea.focus();
  }
}

function deleteFreeNote(id) {
  state.freeNotes = state.freeNotes.filter(n => n.id !== id);
  saveStateToStorage();
  renderDashboard();
}

function deleteApp(id) {
  const app = state.apps.find(a => a.id === id);
  if (!app) return;

  if (confirm(`¿Eliminar el acceso directo a "${app.name}"?`)) {
    state.apps = state.apps.filter(a => a.id !== id);
    saveStateToStorage();
    renderSidebar();
    renderDashboard();
  }
}

// --- EMOJI PICKER & FAVICON FETCH ---
const appIconButton = document.getElementById("appIconButton");
const emojiDropdown = document.getElementById("emojiDropdown");
const emojiSearch = document.getElementById("emojiSearch");
const emojiList = document.getElementById("emojiList");

const emojiData = [
  { char: '🚀', name: 'cohete rocket' },
  { char: '🌐', name: 'web internet globo globe' },
  { char: '💻', name: 'computadora pc laptop' },
  { char: '📱', name: 'celular telefono mobile phone' },
  { char: '🎮', name: 'juego game consola console' },
  { char: '🎵', name: 'musica nota music note' },
  { char: '📝', name: 'nota escribir note edit' },
  { char: '✨', name: 'brillo estrellas sparkles' },
  { char: '🔥', name: 'fuego fire' },
  { char: '⚙️', name: 'configuracion engranaje settings gear' },
  { char: '📊', name: 'grafico estadisticas chart stats' },
  { char: '🖼️', name: 'imagen foto image picture' },
  { char: '📁', name: 'carpeta folder' },
  { char: '💬', name: 'chat mensaje message' },
  { char: '📧', name: 'email correo envelope' },
  { char: '📅', name: 'calendario calendar' },
  { char: '🛒', name: 'compras carrito cart shopping' },
  { char: '💰', name: 'dinero plata money' },
  { char: '💡', name: 'idea luz bulb' },
  { char: '🔒', name: 'seguridad candado lock security' }
];

function renderEmojiList(filter = "") {
  if (!emojiList) return;
  emojiList.innerHTML = "";
  const filtered = emojiData.filter(e => e.name.includes(filter.toLowerCase()));
  filtered.forEach(e => {
    const el = document.createElement("div");
    el.innerHTML = e.char;
    el.style.cssText = "font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 4px; padding: 4px;";
    el.onmouseenter = () => el.style.background = "var(--card-hover-bg)";
    el.onmouseleave = () => el.style.background = "transparent";
    el.onclick = () => {
      appIconField.value = e.char;
      appIconButton.innerHTML = renderAppIcon(e.char);
      emojiDropdown.style.display = "none";
    };
    emojiList.appendChild(el);
  });
}

if (appIconButton) {
  appIconButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = emojiDropdown.style.display === "flex";
    emojiDropdown.style.display = isVisible ? "none" : "flex";
    if (!isVisible) {
      renderEmojiList(emojiSearch.value);
      emojiSearch.focus();
    }
  });

  emojiSearch.addEventListener("input", (e) => {
    renderEmojiList(e.target.value);
  });

  // Close dropdown if click outside
  document.addEventListener("click", (e) => {
    if (emojiDropdown.style.display === "flex" && !emojiDropdown.contains(e.target) && e.target !== appIconButton) {
      emojiDropdown.style.display = "none";
    }
  });
}

function showAppForm(id = null) {
  const colorOpts = appColorPickerGrid.querySelectorAll(".color-option");
  colorOpts.forEach(el => el.classList.remove("active"));

  if (id) {
    const app = state.apps.find(a => a.id === id);
    if (!app) return;
    appModalTitle.textContent = "Editar App / Enlace";
    appIdField.value = app.id;
    appNameField.value = app.name;
    appUrlField.value = app.url;
    appIconField.value = app.icon;

    const match = Array.from(colorOpts).find(el => el.getAttribute("data-color") === app.color);
    if (match) match.classList.add("active");
    else colorOpts[0].classList.add("active");
    appIconButton.innerHTML = renderAppIcon(app.icon);
  } else {
    appModalTitle.textContent = "Agregar App / Enlace";
    appIdField.value = "";
    appNameField.value = "";
    appUrlField.value = "";
    appIconField.value = "🚀";
    appIconButton.innerHTML = renderAppIcon("🚀");
    colorOpts[0].classList.add("active");
  }

  openModal(appModal);
  appNameField.focus();
}

// --- BUSQUEDA GLOBAL ESPACIAL ---
function handleGlobalSearch() {
  const query = globalSearchInput.value.toLowerCase().trim();
  
  if (!query) {
    renderDashboard();
    return;
  }

  const filteredNotebooks = state.notebooks.filter(nb => {
    const matchName = nb.name.toLowerCase().includes(query);
    const matchInternals = nb.notes && nb.notes.some(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
    return matchName || matchInternals;
  });

  const filteredApps = state.apps.filter(app => {
    return app.name.toLowerCase().includes(query) || app.url.toLowerCase().includes(query);
  });

  const filteredFreeNotes = state.freeNotes.filter(fn => {
    return fn.content.toLowerCase().includes(query);
  });

  renderFilteredGrids(filteredNotebooks, filteredApps, filteredFreeNotes, query);
}

function renderFilteredGrids(notebooks, apps, freeNotes, query) {
  renderDashboard(); // Render todo primero para mantener posiciones espaciales

  const notebookIds = new Set(notebooks.map(n => n.id));
  const appIds = new Set(apps.map(a => a.id));
  const freeNoteIds = new Set(freeNotes.map(fn => fn.id));

  const cards = desktopCanvas.querySelectorAll(".notebook-card, .app-card, .free-note-card");
  cards.forEach(card => {
    const id = card.getAttribute("data-id");
    const isNotebook = card.classList.contains("notebook-card");
    const isApp = card.classList.contains("app-card");
    const isFreeNote = card.classList.contains("free-note-card");

    let isMatch = false;
    if (isNotebook) isMatch = notebookIds.has(id);
    else if (isApp) isMatch = appIds.has(id);
    else if (isFreeNote) isMatch = freeNoteIds.has(id);

    if (!isMatch) {
      card.style.opacity = "0.12";
      card.style.pointerEvents = "none";
    } else {
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
      card.style.boxShadow = "0 0 15px rgba(var(--accent-rgb), 0.3)";
      
      if (isNotebook) {
        const titleEl = card.querySelector(".notebook-card-title");
        const originalName = state.notebooks.find(n => n.id === id).name;
        titleEl.innerHTML = highlightText(originalName, query);
      } else if (isApp) {
        const nameEl = card.querySelector(".app-card-name");
        const originalName = state.apps.find(a => a.id === id).name;
        nameEl.innerHTML = highlightText(originalName, query);
      }
    }
  });
}

function highlightText(text, query) {
  if (!text) return "";
  if (!query) return escapeHTML(text);
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return escapeHTML(text).replace(regex, `<mark style="background: rgba(234,179,8,0.4); color: inherit; padding: 0 2px; border-radius: 2px;">$1</mark>`);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- UTILERÍA DE MODALES ---
function openModal(modal) {
  modal.classList.add("active");
}
function closeModal(modal) {
  modal.classList.remove("active");
}

// --- EVENTOS Y CONTROLADORES ---
function setupEventListeners() {
  navHomeBtn.addEventListener("click", () => navigateTo("dashboard"));
  navSettingsBtn.addEventListener("click", () => navigateTo("settings"));
  backToHomeBtn.addEventListener("click", () => navigateTo("dashboard"));

  sidebarCollapseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setSidebarCollapsed(true);
  });

  sidebar.addEventListener("click", (e) => {
    if (state.sidebarCollapsed) {
      const isDashboardBtn = e.target.closest("#navHomeBtn");
      const isSettingsBtn = e.target.closest("#navSettingsBtn");
      const isAppBtn = e.target.closest(".sidebar-list-item");
      const isThemeBtn = e.target.closest("#themeToggleBtn");
      const isFolderHeader = e.target.closest(".sidebar-folder-header");

      if (!isDashboardBtn && !isSettingsBtn && !isAppBtn && !isThemeBtn && !isFolderHeader) {
        setSidebarCollapsed(false);
      }
    }
  });

  mobileToggleBtn.addEventListener("click", () => sidebar.classList.add("active"));
  mobileCloseBtn.addEventListener("click", () => sidebar.classList.remove("active"));

  sidebarAddNotebookBtn.addEventListener("click", () => showNotebookForm());
  sidebarAddAppBtn.addEventListener("click", () => showAppForm());

  notebookForm.addEventListener("submit", saveNotebook);
  notebookFormCancel.addEventListener("click", () => closeModal(notebookModal));
  notebookModalClose.addEventListener("click", () => closeModal(notebookModal));

  appForm.addEventListener("submit", saveApp);
  appFormCancel.addEventListener("click", () => closeModal(appModal));
  appModalClose.addEventListener("click", () => closeModal(appModal));

  // -- App Icon Picker & Favicon Fetcher --
  renderEmojiList("");

  appUrlField.addEventListener("blur", async () => {
    try {
      const urlStr = appUrlField.value.trim();
      if (!urlStr) return;
      const urlObj = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr);
      const origin = urlObj.origin;
      
      const response = await fetch(origin);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      let favicon = null;
      const links = doc.querySelectorAll("link[rel*='icon']");
      if (links.length > 0) {
        let href = links[0].getAttribute("href");
        favicon = new URL(href, origin).href;
      } else {
        favicon = origin + "/favicon.ico";
      }
      
      // Add favicon as an option to the dropdown list
      if (!emojiData.some(e => e.char === favicon)) {
        emojiData.unshift({ char: favicon, name: 'favicon icono web página pagina ' + domain });
        renderEmojiList(emojiSearch.value);
      }
      
      if (!appIconField.value || emojiData.some(e => e.char === appIconField.value && e.char !== favicon)) {
        appIconField.value = favicon;
        appIconButton.innerHTML = renderAppIcon(favicon);
      }
    } catch(e) {
      // Ignore URL or fetch errors
    }
  });

  colorPickerGrid.addEventListener("click", (e) => {
    if (e.target.classList.contains("color-option")) {
      colorPickerGrid.querySelectorAll(".color-option").forEach(el => el.classList.remove("active"));
      e.target.classList.add("active");
    }
  });
  appColorPickerGrid.addEventListener("click", (e) => {
    if (e.target.classList.contains("color-option")) {
      appColorPickerGrid.querySelectorAll(".color-option").forEach(el => el.classList.remove("active"));
      e.target.classList.add("active");
    }
  });

  // FAB Trigger Lógica
  fabTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    fabContainer.classList.toggle("open");
    fabTrigger.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    if (fabContainer.classList.contains("open")) {
      fabContainer.classList.remove("open");
      fabTrigger.classList.remove("active");
    }
  });

  fabAddNotebook.addEventListener("click", (e) => {
    e.stopPropagation();
    fabContainer.classList.remove("open");
    fabTrigger.classList.remove("active");
    showNotebookForm();
  });

  fabAddApp.addEventListener("click", (e) => {
    e.stopPropagation();
    fabContainer.classList.remove("open");
    fabTrigger.classList.remove("active");
    showAppForm();
  });

  fabAddFreeNote.addEventListener("click", (e) => {
    e.stopPropagation();
    fabContainer.classList.remove("open");
    fabTrigger.classList.remove("active");
    createFreeNote();
  });

  const accentColorPickerGrid = document.getElementById("accentColorPickerGrid");
  const resetAccentBtn = document.getElementById("resetAccentBtn");

  accentColorPickerGrid.addEventListener("click", (e) => {
    const opt = e.target.closest(".color-option");
    if (opt) {
      const color = opt.getAttribute("data-color");
      applyAccentColor(color);
      updateAccentPickerActive();
    }
  });

  resetAccentBtn.addEventListener("click", () => {
    applyAccentColor(null);
    updateAccentPickerActive();
  });

  noteTitleInput.addEventListener("input", triggerAutosave);
  wysiwygEditor.addEventListener("input", triggerAutosave);
  wysiwygEditor.addEventListener("keyup", updateToolbarState);
  wysiwygEditor.addEventListener("mouseup", updateToolbarState);

  wysiwygEditor.addEventListener("click", (e) => {
    if (e.target && e.target.type === "checkbox") {
      if (e.target.checked) {
        e.target.setAttribute("checked", "");
      } else {
        e.target.removeAttribute("checked");
      }
      saveCurrentNoteContent();
    }
  });

  deleteCurrentNoteBtn.addEventListener("click", deleteCurrentNote);

  tbBold.addEventListener("click", () => execEditorCommand("bold"));
  tbItalic.addEventListener("click", () => execEditorCommand("italic"));
  tbBulletList.addEventListener("click", () => execEditorCommand("insertUnorderedList"));
  tbOrderedList.addEventListener("click", () => execEditorCommand("insertOrderedList"));
  tbTodo.addEventListener("click", insertTodoItem);

  tbFontSize.addEventListener("change", (e) => {
    execEditorCommand("fontSize", e.target.value);
  });

  globalSearchInput.addEventListener("input", handleGlobalSearch);

  themeToggleBtn.addEventListener("click", () => {
    const newTheme = state.theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  });

  // Safety net: if Electron loses focus mid-drag, release pointer capture on all elements
  window.addEventListener("blur", () => {
    document.querySelectorAll(".notebook-card, .app-card, .free-note-card, .resize-handle").forEach(el => {
      try {
        // Force-cancel any active pointer capture
        const hasCap = el.hasPointerCapture && el.hasPointerCapture(1);
        el.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, cancelable: true, pointerId: 1 }));
      } catch(_) {}
    });
  });

  // Automatically exit desktop-collapsed mode if window resizes to mobile layout
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 992 && state.sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  });
}

function setTheme(theme) {
  state.theme = theme;
  saveStateToStorage();

  if (theme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }

  applyAccentColor(state.customAccent);
}

function closeSidebarMobile() {
  sidebar.classList.remove("active");
}

// --- COLLISION AND OVERLAP DETECTION ---
function checkDesktopCollision(id, x, y, width, height) {
  // Check collision with other notebooks
  for (let nb of state.notebooks) {
    if (nb.id === id) continue;
    const nbW = nb.width || 280;
    const nbH = nb.height || 160;
    if (x < nb.x + nbW && x + width > nb.x && y < nb.y + nbH && y + height > nb.y) {
      return true;
    }
  }
  // Check collision with other apps
  for (let app of state.apps) {
    if (app.id === id) continue;
    const appW = 90;
    const appH = 90;
    if (x < app.x + appW && x + width > app.x && y < app.y + appH && y + height > app.y) {
      return true;
    }
  }
  return false;
}

function bringFreeNoteToFront(fnId) {
  let maxZ = 10;
  state.freeNotes.forEach(fn => {
    if (fn.zIndex && fn.zIndex > maxZ) {
      maxZ = fn.zIndex;
    }
  });

  const clickedNote = state.freeNotes.find(fn => fn.id === fnId);
  if (clickedNote) {
    clickedNote.zIndex = maxZ + 1;
    saveStateToStorage();
    const card = document.querySelector(`.free-note-card[data-id="${fnId}"]`);
    if (card) {
      card.style.zIndex = clickedNote.zIndex;
    }
    updateAllFreeNoteOverlaps();
  }
}

function getIntersection(x1, y1, w1, h1, x2, y2, w2, h2) {
  const interX = Math.max(x1, x2);
  const interY = Math.max(y1, y2);
  const interW = Math.min(x1 + w1, x2 + w2) - interX;
  const interH = Math.min(y1 + h1, y2 + h2) - interY;

  if (interW > 0 && interH > 0) {
    return { x: interX, y: interY, w: interW, h: interH };
  }
  return null;
}

function updateFreeNoteOverlaps(fn, card) {
  // Remove existing indicators
  const existing = card.querySelectorAll(".free-note-overlap-bg");
  existing.forEach(el => el.remove());

  const fnW = fn.width || 200;
  const fnH = fn.height || 200;
  const overlaps = [];

  // Check against notebooks
  state.notebooks.forEach(nb => {
    const nbW = nb.width || 280;
    const nbH = nb.height || 160;
    const inter = getIntersection(fn.x, fn.y, fnW, fnH, nb.x, nb.y, nbW, nbH);
    if (inter) overlaps.push(inter);
  });

  // Check against apps
  state.apps.forEach(app => {
    const appW = 90;
    const appH = 90;
    const inter = getIntersection(fn.x, fn.y, fnW, fnH, app.x, app.y, appW, appH);
    if (inter) overlaps.push(inter);
  });

  // Check against other free notes with lower z-index
  state.freeNotes.forEach(otherFn => {
    if (otherFn.id === fn.id) return;
    const fnZ = fn.zIndex || 10;
    const otherZ = otherFn.zIndex || 10;
    if (otherZ < fnZ || (otherZ === fnZ && state.freeNotes.indexOf(otherFn) < state.freeNotes.indexOf(fn))) {
      const otherW = otherFn.width || 200;
      const otherH = otherFn.height || 200;
      const inter = getIntersection(fn.x, fn.y, fnW, fnH, otherFn.x, otherFn.y, otherW, otherH);
      if (inter) overlaps.push(inter);
    }
  });

  // Render indicators
  overlaps.forEach(inter => {
    const indicator = document.createElement("div");
    indicator.className = "free-note-overlap-bg";
    indicator.style.left = `${inter.x - fn.x}px`;
    indicator.style.top = `${inter.y - fn.y}px`;
    indicator.style.width = `${inter.w}px`;
    indicator.style.height = `${inter.h}px`;
    card.appendChild(indicator);
  });
}

function updateAllFreeNoteOverlaps() {
  state.freeNotes.forEach(fn => {
    const card = document.querySelector(`.free-note-card[data-id="${fn.id}"]`);
    if (card) {
      updateFreeNoteOverlaps(fn, card);
    }
  });
}


// --- HELPERS ---
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function stripHTML(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

// Inicializar la aplicación al cargar el script
window.addEventListener("DOMContentLoaded", initApp);
