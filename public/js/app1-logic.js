import { db } from './database.js';

// --- VIEW CONFIG (Mantenemos la configuración de vistas) ---
const viewConfig = {
    dashboard: { title: 'Dashboard' },
    visualizer: { title: 'Visualizador Sinóptico' },
    arboles: { title: 'Árboles de Producto' },
    productos: {
        title: 'Productos', dataKey: 'productos',
        columns: [ { key: 'id', label: 'Código Interno' }, { key: 'material', label: 'Material' }, { key: 'clienteId', label: 'Cliente', format: (val) => db.clientes.find(c => c.id === val)?.descripcion || 'N/A' } ],
        fields: [
            { key: 'id', label: 'Código Interno', type: 'text', required: true },
            { key: 'codigo_cliente', label: 'Código de Cliente', type: 'text' },
            { key: 'clienteId', label: 'Cliente', type: 'search-select', searchKey: 'cliente', required: true },
            { key: 'material', label: 'Material (Nombre principal)', type: 'text', required: true },
            { key: 'descripcion', label: 'Descripción Breve', type: 'textarea'},
            { key: 'version', label: 'Versión', type: 'text' },
            { key: 'pzas_vh', label: 'Pzas/Vh', type: 'number' },
            { key: 'unidad', label: 'Unidad (PZA, M2, KG)', type: 'text' },
            { key: 'sourcing', label: 'Sourcing [LC/KD]', type: 'text' },
            { key: 'codigo_material', label: 'Código Material', type: 'text' },
            { key: 'proceso', label: 'Proceso', type: 'text' },
            { key: 'apariencia', label: 'Apariencia', type: 'text' },
            { key: 'superficie', label: 'Superficie [m²]', type: 'number' },
            { key: 'tamano', label: 'Tamaño [X*Y*Z]', type: 'text' },
            { key: 'peso_pz', label: 'Peso/Pz [gr]', type: 'number' },
        ]
    },
    subproductos: {
        title: 'Subproductos', dataKey: 'subproductos',
        columns: [ { key: 'id', label: 'Código' }, { key: 'descripcion', label: 'Descripción' }, { key: 'proceso', label: 'Proceso' } ],
        fields: [
            { key: 'id', label: 'Código', type: 'text', required: true },
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true },
            { key: 'proceso', label: 'Proceso de Fabricación', type: 'text' },
            { key: 'peso_gr', label: 'Peso (gr)', type: 'number' },
            { key: 'tolerancia_peso_gr', label: 'Tolerancia Peso (gr)', type: 'number' },
            { key: 'dimensiones_xyz', label: 'Dimensiones (X*Y*Z)', type: 'text' },
            { key: 'tiempo_ciclo_seg', label: 'Tiempo de Ciclo (seg)', type: 'number' },
            { key: 'materiales_componentes', label: 'Materiales que lo componen', type: 'textarea' },
        ]
    },
    insumos: {
        title: 'Insumos', dataKey: 'insumos',
        columns: [ { key: 'id', label: 'Código' }, { key: 'part_name', label: 'Descripción' }, { key: 'proveedor', label: 'Proveedor' } ],
        fields: [
            { key: 'id', label: 'Código', type: 'text', required: true },
            { key: 'part_name', label: 'Descripción', type: 'text', required: true },
            { key: 'proveedor', label: 'Proveedor', type: 'text' },
            { key: 'unidad', label: 'Unidad de Medida', type: 'text' },
            { key: 'costo', label: 'Costo por Unidad', type: 'number' },
            { key: 'stock_minimo', label: 'Stock Mínimo', type: 'number' },
            { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
        ]
    },
    clientes: {
        title: 'Clientes', dataKey: 'clientes',
        columns: [ { key: 'id', label: 'Código' }, { key: 'descripcion', label: 'Descripción' } ],
        fields: [ 
            { key: 'id', label: 'Código', type: 'text', required: true }, 
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true } 
        ]
    },
    sectores: {
        title: 'Sectores', dataKey: 'sectores',
        columns: [ { key: 'id', label: 'Código' }, { key: 'descripcion', label: 'Descripción' } ],
        fields: [ 
            { key: 'id', label: 'Código', type: 'text', required: true }, 
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true },
            { key: 'icon', label: 'Icono (Lucide)', type: 'text', required: true }
        ]
    },
    procesos: {
        title: 'Procesos', dataKey: 'procesos',
        columns: [ { key: 'id', label: 'Código' }, { key: 'descripcion', label: 'Descripción' }, { key: 'sectorId', label: 'Sector', format: (val) => db.sectores.find(s => s.id === val)?.descripcion || 'N/A' } ],
        fields: [ 
            { key: 'id', label: 'Código', type: 'text', required: true }, 
            { key: 'descripcion', label: 'Descripción', type: 'text', required: true },
            { key: 'sectorId', label: 'Sector Asociado', type: 'search-select', searchKey: 'sector', required: true }
        ]
    }
};

// --- ESTADO DE LA APLICACIÓN ---
let currentView = 'dashboard';
let currentData = [];
let arbolActivo = null;

// --- SELECTORES DEL DOM ---
const viewTitle = document.getElementById('view-title');
const headerActions = document.getElementById('header-actions');
const dashboardContainer = document.getElementById('dashboard-container');
const tableContainer = document.getElementById('table-container');
const arbolesContainer = document.getElementById('arboles-container');
const visualizerContainer = document.getElementById('visualizer-container');
const searchInput = document.getElementById('search-input');
const addNewButton = document.getElementById('add-new-button');
const addButtonText = document.getElementById('add-button-text');
const modalContainer = document.getElementById('modal-container');
const toastContainer = document.getElementById('toast-container');

// --- FUNCIONES DE UTILIDAD Y NOTIFICACIONES ---
function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function showToast(message, type = 'success') {
    const iconMap = {
        success: { name: 'check-circle', color: 'text-green-500' },
        error: { name: 'x-circle', color: 'text-red-500' },
        info: { name: 'info', color: 'text-blue-500' }
    };
    const toast = document.createElement('div');
    toast.className = `toast flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg`;
    toast.innerHTML = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${iconMap[type].color} bg-gray-100 rounded-lg">
            <i data-lucide="${iconMap[type].name}" class="w-5 h-5"></i>
        </div>
        <div class="ml-3 text-sm font-normal">${message}</div>
    `;
    toastContainer.appendChild(toast);
    refreshIcons();
    setTimeout(() => {
        toast.classList.add('closing');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

function showConfirmationModal(title, message, onConfirm) {
    const modalId = `confirm-modal-${Date.now()}`;
    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div class="p-6 text-center">
                    <i data-lucide="alert-triangle" class="h-12 w-12 mx-auto text-yellow-500 mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">${title}</h3>
                    <p class="text-gray-600">${message}</p>
                </div>
                <div class="flex justify-center items-center p-4 border-t bg-gray-50 rounded-b-lg space-x-4">
                    <button data-action="cancel" class="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
                    <button data-action="confirm" class="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-semibold">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    refreshIcons();
    
    const modalElement = document.getElementById(modalId);
    modalElement.addEventListener('click', e => {
        const action = e.target.closest('button')?.dataset.action;
        if (action === 'confirm') {
            onConfirm();
            modalElement.remove();
        } else if (action === 'cancel') {
            modalElement.remove();
        }
    });
}

// --- FUNCIONES DE RENDERIZADO ---
function renderDashboard() {
    let content = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-3 bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Resumen General</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">`;
    
    const stats = [
        { label: 'Productos', value: db.productos.length, icon: 'package' },
        { label: 'Insumos', value: db.insumos.length, icon: 'beaker' },
        { label: 'Clientes', value: db.clientes.length, icon: 'users' },
        { label: 'Sectores', value: db.sectores.length, icon: 'factory' }
    ];

    stats.forEach(stat => {
        content += `
            <div class="text-center p-4 rounded-lg hover:bg-gray-50 transition">
                <i data-lucide="${stat.icon}" class="h-10 w-10 mx-auto text-blue-500 mb-2"></i>
                <p class="text-3xl font-bold text-gray-900">${stat.value}</p>
                <p class="text-sm font-semibold text-gray-600">${stat.label}</p>
            </div>`;
    });
    content += `</div></div>`;

    content += `
        <div class="lg:col-span-3 bg-white p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold text-gray-800 mb-6">Explorar Sectores y Procesos</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">`;
    
    db.sectores.forEach(sector => {
        content += `
            <button data-action="open-sector-modal" data-sector-id="${sector.id}" class="bg-gray-50 p-5 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition-transform transform hover:-translate-y-1 hover:shadow-lg border">
                <i data-lucide="${sector.icon}" class="h-10 w-10 text-gray-600 mb-3 pointer-events-none"></i>
                <p class="font-semibold text-gray-700 pointer-events-none">${sector.descripcion}</p>
            </button>`;
    });
    content += `</div></div>`;
    
    dashboardContainer.innerHTML = content;
    refreshIcons();
}

function renderTable(data, config) {
    let tableHTML = `<div class="flex justify-end mb-4">
        <button id="export-pdf" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 flex items-center transition mr-2 text-sm font-semibold"><i data-lucide="file-text" class="mr-2 h-5 w-5"></i>Exportar a PDF</button>
        <button id="export-excel" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center transition text-sm font-semibold"><i data-lucide="file-spreadsheet" class="mr-2 h-5 w-5"></i>Exportar a Excel</button>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-600">
            <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>`;
    config.columns.forEach(col => {
        tableHTML += `<th scope="col" class="px-6 py-3">${col.label}</th>`;
    });
    tableHTML += `<th scope="col" class="px-6 py-3 text-right">Acciones</th></tr></thead><tbody>`;

    if (data.length === 0) {
        tableHTML += `<tr><td colspan="${config.columns.length + 1}">
            <div class="text-center py-16 text-gray-500">
                <i data-lucide="search-x" class="mx-auto h-16 w-16 text-gray-300"></i>
                <h3 class="mt-4 text-lg font-semibold text-gray-800">Sin resultados</h3>
                <p class="mt-1 text-sm text-gray-500">No se encontraron registros. ¡Empieza agregando uno!</p>
            </div>
        </td></tr>`;
    } else {
        data.forEach(item => {
            tableHTML += `<tr class="bg-white border-b hover:bg-gray-50">`;
            config.columns.forEach(col => {
                const value = col.format ? col.format(item[col.key]) : (item[col.key] || 'N/A');
                tableHTML += `<td class="px-6 py-4 font-medium text-gray-900">${value}</td>`;
            });
            tableHTML += `
                <td class="px-6 py-4 flex items-center justify-end space-x-3">
                    <button data-action="details" data-id="${item.id}" class="text-gray-500 hover:text-blue-600 transition" title="Ver Información"><i data-lucide="info" class="h-5 w-5 pointer-events-none"></i></button>
                    <button data-action="edit" data-id="${item.id}" class="text-gray-500 hover:text-green-600 transition" title="Editar"><i data-lucide="edit" class="h-5 w-5 pointer-events-none"></i></button>
                    <button data-action="delete" data-id="${item.id}" class="text-gray-500 hover:text-red-600 transition" title="Eliminar"><i data-lucide="trash-2" class="h-5 w-5 pointer-events-none"></i></button>
                </td>`;
            tableHTML += `</tr>`;
        });
    }
    
    tableHTML += `</tbody></table></div>`;
    tableContainer.innerHTML = tableHTML;
    refreshIcons();
}

function switchView(viewName) {
    currentView = viewName;
    const config = viewConfig[viewName];
    if (!config) {
        console.error(`View "${viewName}" not found in config.`);
        return;
    }
    viewTitle.textContent = config.title;

    [dashboardContainer, tableContainer, arbolesContainer, visualizerContainer].forEach(c => c.classList.add('hidden'));
    headerActions.classList.add('hidden');

    if (viewName === 'dashboard') {
        dashboardContainer.classList.remove('hidden');
        renderDashboard();
    } else if (viewName === 'arboles') {
        arbolesContainer.classList.remove('hidden');
        renderArbolesInitialView();
    } else if (viewName === 'visualizer') {
        visualizerContainer.classList.remove('hidden');
        initVisualizer();
    } else if (config?.dataKey) {
        tableContainer.classList.remove('hidden');
        headerActions.classList.remove('hidden');
        addButtonText.textContent = `Agregar ${config.title.slice(0, -1)}`;
        currentData = [...db[config.dataKey]];
        renderTable(currentData, config);
    }
    searchInput.value = '';
}

// --- MODAL & FORM LOGIC ---
function openModal(item = null) {
    const config = viewConfig[currentView];
    const isEditing = item !== null;
    const modalId = `form-modal-${Date.now()}`;
    
    let fieldsHTML = '';
    config.fields.forEach(field => {
        const isReadonly = isEditing && field.key === 'id';
        let inputHTML = '';
        const commonClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
        const readonlyClasses = isReadonly ? 'bg-gray-100 cursor-not-allowed' : '';
        const value = item ? (item[field.key] || '') : '';

        if (field.type === 'search-select') {
            let selectedItemName = 'Ninguno seleccionado';
            if (isEditing && value) {
                const sourceDB = field.searchKey === 'cliente' ? db.clientes : db.sectores;
                const foundItem = sourceDB.find(dbItem => dbItem.id === value);
                if(foundItem) selectedItemName = foundItem.descripcion;
            }
            inputHTML = `
                <div class="flex items-center gap-2">
                    <input type="text" id="${field.key}-display" value="${selectedItemName}" class="${commonClasses} bg-gray-100" readonly>
                    <input type="hidden" id="${field.key}" name="${field.key}" value="${value}">
                    <button type="button" data-action="open-search-modal" data-search-key="${field.searchKey}" class="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"><i data-lucide="search" class="h-5 w-5"></i></button>
                </div>
            `;
        } else if (field.type === 'textarea') {
            inputHTML = `<textarea id="${field.key}" name="${field.key}" rows="3" class="${commonClasses}" ${field.required ? 'required' : ''}>${value}</textarea>`;
        } else {
            inputHTML = `<input type="${field.type}" id="${field.key}" name="${field.key}" value="${value}" class="${commonClasses} ${readonlyClasses}" ${field.required ? 'required' : ''} ${isReadonly ? 'readonly' : ''}>`;
        }

        fieldsHTML += `<div class="${field.type === 'textarea' || field.type === 'search-select' || field.key === 'id' ? 'md:col-span-2' : ''}">
            <label for="${field.key}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
            ${inputHTML}
        </div>`;
    });

    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4">
                <div class="flex justify-between items-center p-5 border-b">
                    <h3 class="text-xl font-bold">${isEditing ? 'Editar' : 'Agregar'} ${config.title.slice(0, -1)}</h3>
                    <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
                </div>
                <form id="data-form" class="p-6 overflow-y-auto">
                    <input type="hidden" name="edit-id" value="${isEditing ? item.id : ''}">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">${fieldsHTML}</div>
                </form>
                <div class="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg space-x-3">
                    <button data-action="close" type="button" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancelar</button>
                    <button type="submit" form="data-form" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">Guardar Cambios</button>
                </div>
            </div>
        </div>`;
    
    modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    refreshIcons();
    
    const modalElement = document.getElementById(modalId);
    modalElement.querySelector('form').addEventListener('submit', handleFormSubmit);
    modalElement.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'close') {
            modalElement.remove();
        } else if (action === 'open-search-modal') {
            openAssociationSearchModal(button.dataset.searchKey);
        }
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const modalElement = form.closest('.fixed');
    const formData = new FormData(form);
    const id = formData.get('edit-id');
    const newItem = {};
    const config = viewConfig[currentView];

    for (const field of config.fields) {
        if (field.required && !formData.get(field.key)) {
            showToast(`El campo "${field.label}" es obligatorio.`, 'error');
            return;
        }
        newItem[field.key] = formData.get(field.key);
    }

    const dataKey = config.dataKey;
    if (id) { // Editing
        const index = db[dataKey].findIndex(item => item.id === id);
        if (index !== -1) {
            db[dataKey][index] = { ...db[dataKey][index], ...newItem };
            showToast('Registro actualizado con éxito.', 'success');
        }
    } else { // Creating
        const newId = newItem.id;
        if (db[dataKey].some(item => item.id === newId)) {
            showToast(`Error: El código "${newId}" ya existe.`, 'error');
            return;
        }
        db[dataKey].push(newItem);
        showToast('Registro creado con éxito.', 'success');
    }
    
    modalElement.remove();
    switchView(currentView);
}

function deleteItem(id) {
    showConfirmationModal('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.', () => {
        const dataKey = viewConfig[currentView].dataKey;
        const index = db[dataKey].findIndex(item => item.id === id);
        if (index !== -1) {
            db[dataKey].splice(index, 1);
            showToast('Registro eliminado.', 'info');
            switchView(currentView);
        } else {
            showToast('Error: No se pudo encontrar el registro.', 'error');
        }
    });
}

// --- DETAILS MODAL (READ-ONLY) ---
function openDetailsModal(item) {
    const config = viewConfig[currentView];
    const modalId = `details-modal-${Date.now()}`;
    
    let fieldsHTML = '';
    config.fields.forEach(field => {
        let value = item[field.key] || 'N/A';
        if (field.type === 'search-select') {
            const sourceDB = field.searchKey === 'cliente' ? db.clientes : db.sectores;
            const foundItem = sourceDB.find(dbItem => dbItem.id === value);
            value = foundItem ? foundItem.descripcion : 'N/A';
        }
        
        fieldsHTML += `
            <div class="${field.type === 'textarea' || field.key === 'id' || field.key === 'codigo_cliente' ? 'md:col-span-2' : ''}">
                <label class="block text-sm font-medium text-gray-500">${field.label}</label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-100 p-2 rounded-md border min-h-[38px]">${value}</div>
            </div>
        `;
    });

    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col m-4">
                <div class="flex justify-between items-center p-5 border-b">
                    <h3 class="text-xl font-bold">Información de ${config.title.slice(0, -1)}</h3>
                    <div class="flex items-center gap-4">
                        <button data-action="export-pdf" class="text-gray-500 hover:text-red-600" title="Exportar a PDF"><i data-lucide="file-text" class="h-6 w-6"></i></button>
                        <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
                    </div>
                </div>
                <div class="p-6 overflow-y-auto">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">${fieldsHTML}</div>
                </div>
                 <div class="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg">
                    <button data-action="close" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cerrar</button>
                </div>
            </div>
        </div>`;
    
    modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    refreshIcons();
    const modalElement = document.getElementById(modalId);

    modalElement.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'close') {
            modalElement.remove();
        } else if (action === 'export-pdf') {
            exportDetailsToPdf(item, config);
        }
    });
}

function exportDetailsToPdf(item, config) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Información de ${config.title.slice(0, -1)}`, 14, 22);
    
    const bodyData = [];
    config.fields.forEach(field => {
        let value = item[field.key] || 'N/A';
        if (field.type === 'search-select') {
             const sourceDB = field.searchKey === 'cliente' ? db.clientes : db.sectores;
             const foundItem = sourceDB.find(dbItem => dbItem.id === value);
             value = foundItem ? foundItem.descripcion : 'N/A';
        }
        bodyData.push([field.label.replace(/<span.*<\/span>/, '').trim(), value]);
    });

    doc.autoTable({
        startY: 30,
        head: [['Campo', 'Valor']],
        body: bodyData,
        theme: 'grid'
    });

    doc.save(`Detalle_${config.dataKey}_${item.id}.pdf`);
}

// --- ARBOLES DE PRODUCTO LOGIC ---
function renderArbolesInitialView() {
    arbolesContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-md p-10 text-center">
            <i data-lucide="git-merge" class="h-24 w-24 text-gray-300 mb-6"></i>
            <h3 class="text-2xl font-bold text-gray-800">Gestor de Árboles de Producto</h3>
            <p class="text-gray-500 mt-2 mb-8 max-w-lg">Para comenzar, busque y seleccione el producto principal que servirá como base para su estructura. El sistema cargará el árbol si ya existe, o creará uno nuevo.</p>
            <button id="open-product-search-modal" class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105">
                <i data-lucide="search" class="inline-block mr-2 -mt-1"></i>
                Seleccionar Producto Principal
            </button>
        </div>
    `;
    refreshIcons();
    document.getElementById('open-product-search-modal').addEventListener('click', openProductSearchModal);
}

function renderArbolDetalle() {
    const cliente = db.clientes.find(c => c.id === arbolActivo.clienteId);
    arbolesContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex justify-between items-start mb-4 pb-4 border-b">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">${arbolActivo.nombre}</h3>
                    <p class="text-sm text-gray-500">Cliente Asociado: <span class="font-semibold">${cliente ? cliente.descripcion : 'N/A'}</span></p>
                </div>
                <div class="flex space-x-2">
                    <button id="volver-a-busqueda" class="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-600 transition">Buscar Otro</button>
                    <button id="guardar-arbol-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition">Guardar Estructura</button>
                </div>
            </div>
            <div id="tree-render-area" class="tree p-4 rounded-lg bg-gray-50"></div>
        </div>
    `;
    
    document.getElementById('guardar-arbol-btn').onclick = guardarEstructura;
    document.getElementById('volver-a-busqueda').onclick = renderArbolesInitialView;
    document.getElementById('tree-render-area').addEventListener('click', handleTreeActions);
    renderArbol();
}

function renderArbol() {
    const treeArea = document.getElementById('tree-render-area');
    if (!treeArea || !arbolActivo) return;
    treeArea.innerHTML = '<ul>' + arbolActivo.estructura.map(renderNodo).join('') + '</ul>';
    refreshIcons();
}

function renderNodo(nodo) {
    const addableChildren = {
        producto: ['subproducto', 'insumo'],
        subproducto: ['subproducto', 'insumo'],
        insumo: []
    };
    
    let addButtons = (addableChildren[nodo.tipo] || []).map(tipo => 
        `<button data-action="add" data-node-id="${nodo.id}" data-child-type="${tipo}" class="px-2 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-xs font-semibold" title="Agregar ${tipo}">
            + ${tipo}
        </button>`
    ).join(' ');

    return `
        <li>
            <div class="node-content">
                <div class="flex items-center gap-2">
                    <i data-lucide="${nodo.icon}" class="h-5 w-5 text-gray-600"></i>
                    <span class="font-semibold">${nodo.nombre}</span>
                    <span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">${nodo.tipo}</span>
                </div>
                <div class="flex items-center space-x-2">
                    ${addButtons}
                    ${nodo.tipo !== 'producto' ? `<button data-action="delete" data-node-id="${nodo.id}" class="text-red-500 hover:text-red-700" title="Eliminar"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>` : ''}
                </div>
            </div>
            ${(nodo.children && nodo.children.length > 0) ? `<ul>${nodo.children.map(renderNodo).join('')}</ul>` : ''}
        </li>`;
}

function openProductSearchModal() {
    const modalId = `product-search-modal-${Date.now()}`;
    let clientOptions = '<option value="">Todos los Clientes</option>';
    db.clientes.forEach(c => {
        clientOptions += `<option value="${c.id}">${c.descripcion}</option>`;
    });

    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col m-4">
                <div class="flex justify-between items-center p-5 border-b">
                     <h3 class="text-xl font-bold">Buscar Producto Principal</h3>
                     <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="search-product-term" class="block text-sm font-medium text-gray-700">Código o Material</label>
                            <input type="text" id="search-product-term" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        </div>
                        <div>
                            <label for="search-product-client" class="block text-sm font-medium text-gray-700">Filtrar por Cliente</label>
                            <select id="search-product-client" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">${clientOptions}</select>
                        </div>
                    </div>
                </div>
                <div id="search-product-results" class="p-6 border-t overflow-y-auto flex-1"></div>
            </div>
        </div>`;
    
    modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    refreshIcons();
    const modalElement = document.getElementById(modalId);

    const termInput = modalElement.querySelector('#search-product-term');
    const clientSelect = modalElement.querySelector('#search-product-client');
    const resultsContainer = modalElement.querySelector('#search-product-results');

    const searchHandler = () => handleProductSearch(termInput.value, clientSelect.value, resultsContainer);
    termInput.addEventListener('input', searchHandler);
    clientSelect.addEventListener('change', searchHandler);
    
    resultsContainer.addEventListener('click', e => {
        const button = e.target.closest('button[data-product-id]');
        if (button) {
            handleProductSelect(button.dataset.productId);
            modalElement.remove();
        }
    });

    modalElement.addEventListener('click', e => {
        if (e.target.closest('button')?.dataset.action === 'close') {
            modalElement.remove();
        }
    });

    searchHandler();
}

function handleProductSearch(term, clientId, resultsContainer) {
    term = term.toLowerCase();
    let results = db.productos.filter(p => {
        const termMatch = term === '' || p.id.toLowerCase().includes(term) || p.material.toLowerCase().includes(term);
        const clientMatch = !clientId || p.clienteId === clientId;
        return termMatch && clientMatch;
    }).sort((a, b) => a.material.localeCompare(b.material));

    if (results.length === 0) {
        resultsContainer.innerHTML = `<p class="text-gray-500 text-center py-8">No se encontraron productos.</p>`;
        return;
    }
    
    resultsContainer.innerHTML = `<div class="space-y-1">` + results.map(p => {
        const cliente = db.clientes.find(c => c.id === p.clienteId);
        return `
        <button data-product-id="${p.id}" class="w-full text-left p-2.5 bg-gray-50 hover:bg-blue-100 rounded-md border flex justify-between items-center transition">
            <div>
                <p class="font-semibold text-blue-800">${p.material} (${p.id})</p>
            </div>
            <div class="text-right">
                 <p class="text-xs text-gray-500">${cliente ? cliente.descripcion : 'Sin cliente'}</p>
            </div>
        </button>`;
    }).join('') + `</div>`;
}

function handleProductSelect(productId) {
    const producto = db.productos.find(p => p.id === productId);
    if (!producto) return;

    arbolActivo = db.arboles.find(a => a.productoPrincipalId === productId);

    if (arbolActivo) {
        showToast(`Árbol existente para "${producto.material}" cargado.`, 'info');
    } else {
        arbolActivo = {
            id: `ARB_${Date.now()}`,
            nombre: `Árbol de ${producto.material}`,
            productoPrincipalId: producto.id,
            clienteId: producto.clienteId,
            lastUpdated: new Date(),
            estructura: [crearComponente('producto', producto)]
        };
        db.arboles.push(arbolActivo);
        showToast(`Nuevo árbol creado para "${producto.material}".`, 'success');
    }
    renderArbolDetalle();
}
        
function crearComponente(tipo, datosOriginales = {}) {
    const icons = { producto: 'package', subproducto: 'box', insumo: 'beaker' };
    return {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        refId: datosOriginales.id,
        nombre: datosOriginales.descripcion || datosOriginales.part_name || datosOriginales.material,
        tipo: tipo,
        icon: icons[tipo] || 'box',
        children: [],
        data: datosOriginales
    };
}

function findNode(id, arbol = arbolActivo.estructura) {
    for (const nodo of arbol) {
        if (nodo.id === id) return nodo;
        if (nodo.children) {
            const found = findNode(id, nodo.children);
            if (found) return found;
        }
    }
    return null;
}

function findNodeByRefId(refId, arbol) {
    for (const nodo of arbol) {
        if (nodo.refId === refId) return nodo;
        if (nodo.children && nodo.children.length > 0) {
            const found = findNodeByRefId(refId, nodo.children);
            if (found) return found;
        }
    }
    return null;
}

function handleTreeActions(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const nodeId = button.dataset.nodeId;

    if (action === 'add') {
        openComponentSearchModal(nodeId, button.dataset.childType);
    } else if (action === 'delete') {
        eliminarNodo(nodeId);
    }
}

function eliminarNodo(id) {
    showConfirmationModal('Eliminar Nodo', '¿Estás seguro? Se eliminará este nodo y todos sus hijos.', () => {
        function findAndRemove(currentId, nodes) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === currentId) {
                    nodes.splice(i, 1);
                    return true;
                }
                if (nodes[i].children) {
                   if (findAndRemove(currentId, nodes[i].children)) return true;
                }
            }
            return false;
        }
        findAndRemove(id, arbolActivo.estructura);
        renderArbol();
        showToast('Nodo eliminado.', 'info');
    });
}

function guardarEstructura() {
    if (!arbolActivo) return;
    console.log("Guardando estructura (simulación):", arbolActivo.id, JSON.parse(JSON.stringify(arbolActivo)));
    showToast(`Estructura para '${arbolActivo.nombre}' guardada.`, 'success');
}

// --- ASSOCIATION SEARCH MODAL (CLIENTE, SECTOR, ETC.) ---
function openAssociationSearchModal(searchKey) {
    const config = {
        cliente: {
            title: 'Buscar Cliente',
            data: db.clientes,
            placeholder: 'Buscar por código o descripción...'
        },
        sector: {
            title: 'Buscar Sector',
            data: db.sectores,
            placeholder: 'Buscar por código o descripción...'
        }
    };
    const searchConfig = config[searchKey];
    if (!searchConfig) return;

    const modalId = `association-search-modal-${Date.now()}`;
    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col m-4">
                <div class="flex justify-between items-center p-5 border-b">
                    <h3 class="text-xl font-bold">${searchConfig.title}</h3>
                    <button data-action="close" class="text-gray-500 hover:text-gray-800"><i data-lucide="x" class="h-6 w-6"></i></button>
                </div>
                <div class="p-6">
                    <input type="text" id="association-search-term" placeholder="${searchConfig.placeholder}" class="w-full border-gray-300 rounded-md shadow-sm">
                </div>
                <div id="association-search-results" class="p-6 border-t overflow-y-auto flex-1"></div>
            </div>
        </div>`;
    
    modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    refreshIcons();
    const modalElement = document.getElementById(modalId);
    const searchInput = modalElement.querySelector('#association-search-term');
    const resultsContainer = modalElement.querySelector('#association-search-results');

    const renderResults = (term = '') => {
        term = term.toLowerCase();
        const filteredData = searchConfig.data.filter(item => 
            item.id.toLowerCase().includes(term) || item.descripcion.toLowerCase().includes(term)
        );
        if (filteredData.length === 0) {
            resultsContainer.innerHTML = `<p class="text-gray-500 text-center py-8">No se encontraron resultados.</p>`;
            return;
        }
        resultsContainer.innerHTML = `<div class="space-y-2">` + filteredData.map(item => `
            <button data-item-id="${item.id}" data-item-name="${item.descripcion}" class="w-full text-left p-3 bg-gray-50 hover:bg-blue-100 rounded-md border transition">
                <p class="font-semibold text-gray-800">${item.descripcion}</p>
                <p class="text-sm text-gray-500">${item.id}</p>
            </button>
        `).join('') + `</div>`;
    };

    searchInput.addEventListener('input', () => renderResults(searchInput.value));
    resultsContainer.addEventListener('click', e => {
        const button = e.target.closest('button[data-item-id]');
        if (button) {
            const { itemId, itemName } = button.dataset;
            document.getElementById(`${searchKey}Id`).value = itemId;
            document.getElementById(`${searchKey}Id-display`).value = itemName;
            modalElement.remove();
        }
    });
    modalElement.addEventListener('click', e => {
        if (e.target.closest('button')?.dataset.action === 'close') {
            modalElement.remove();
        }
    });

    renderResults();
}

// --- DASHBOARD SECTOR MODAL ---
function openSectorProcessesModal(sectorId) {
    const sector = db.sectores.find(s => s.id === sectorId);
    if (!sector) return;

    const processes = db.procesos.filter(p => p.sectorId === sectorId);
    const modalId = `sector-processes-modal-${Date.now()}`;
    
    let processesHTML = '';
    if (processes.length > 0) {
        processesHTML = '<ul class="space-y-3">' + processes.map(p => `
            <li class="bg-gray-100 p-4 rounded-lg flex items-center border">
                <i data-lucide="cpu" class="h-6 w-6 text-blue-500 mr-4"></i>
                <div>
                    <p class="font-semibold text-gray-800">${p.descripcion}</p>
                    <p class="text-xs text-gray-500">Código: ${p.id}</p>
                </div>
            </li>
        `).join('') + '</ul>';
    } else {
        processesHTML = `
            <div class="text-center py-10 text-gray-500">
                <i data-lucide="folder-search" class="mx-auto h-12 w-12 text-gray-400"></i>
                <h3 class="mt-2 text-sm font-semibold text-gray-900">Sin Procesos</h3>
                <p class="mt-1 text-sm text-gray-500">Este sector no tiene procesos asignados.</p>
            </div>`;
    }

    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
                <div class="flex items-center p-5 border-b">
                    <i data-lucide="${sector.icon}" class="h-8 w-8 text-blue-500 mr-4"></i>
                    <h3 class="text-xl font-bold">Procesos de: ${sector.descripcion}</h3>
                </div>
                <div class="p-6 overflow-y-auto">${processesHTML}</div>
                <div class="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg">
                    <button data-action="close" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cerrar</button>
                </div>
            </div>
        </div>`;

    modalContainer.insertAdjacentHTML('beforeend', modalHTML);
    refreshIcons();
    const modalElement = document.getElementById(modalId);
    modalElement.addEventListener('click', e => {
        if (e.target.closest('button')?.dataset.action === 'close') {
            modalElement.remove();
        }
    });
}

// --- VISUALIZER LOGIC (STUB) ---
function initVisualizer() {
     visualizerContainer.innerHTML = `<div class="text-center py-16 text-gray-500">
            <i data-lucide="construct" class="mx-auto h-16 w-16 text-gray-300"></i>
            <h3 class="mt-4 text-lg font-semibold text-gray-800">Módulo en Construcción</h3>
            <p class="mt-1 text-sm text-gray-500">El visualizador sinóptico se conectará aquí en una futura actualización.</p>
        </div>`;
    refreshIcons();
}

// --- EVENT HANDLERS ---
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const config = viewConfig[currentView];
    if (!config.dataKey) return;
    
    const filteredData = db[config.dataKey].filter(item => 
        Object.values(item).some(value => String(value).toLowerCase().includes(searchTerm))
    );
    renderTable(filteredData, config);
}

function handleTableActions(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const item = currentData.find(d => d.id === id);

    if (action === 'details'){ openDetailsModal(item); } 
    else if (action === 'edit') { openModal(item); }
    else if (action === 'delete') { deleteItem(id); }
}

function handleExport(type) {
    const config = viewConfig[currentView];
    if (!config || !currentData) return;

    if (type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableData = currentData.map(item => config.columns.map(col => col.format ? col.format(item[col.key]) : (item[col.key] || '')));
        doc.autoTable({
            head: [config.columns.map(col => col.label)],
            body: tableData,
            didDrawPage: data => doc.text(config.title, data.settings.margin.left, 15),
        });
        doc.save(`${currentView}_export.pdf`);
    } else if (type === 'excel') {
        const dataToExport = currentData.map(item => {
            let row = {};
            config.columns.forEach(col => {
                row[col.label] = col.format ? col.format(item[col.key]) : item[col.key];
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, currentView);
        XLSX.writeFile(wb, `${currentView}_export.xlsx`);
    }
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Handle view based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    if (view && viewConfig[view]) {
        switchView(view);
    } else {
        switchView('dashboard'); // Default view
    }
    refreshIcons();

    // Handle navigation clicks within the sidebar
    document.getElementById('accordionSidebar').addEventListener('click', (e) => {
        const link = e.target.closest('a.collapse-item');
        if (link && link.href.includes('app1.html?view=')) {
            e.preventDefault();
            const url = new URL(link.href);
            const viewToLoad = url.searchParams.get('view');
            if (viewToLoad) {
                switchView(viewToLoad);
                // Update URL without reloading for better UX
                history.pushState({view: viewToLoad}, '', `app1.html?view=${viewToLoad}`);
            }
        }
    });

    // Global Event Listeners
    searchInput.addEventListener('input', handleSearch);
    addNewButton.addEventListener('click', () => openModal());
    tableContainer.addEventListener('click', e => {
        handleTableActions(e);
        const button = e.target.closest('button');
        if (!button) return;
        if (button.id === 'export-pdf') handleExport('pdf');
        if (button.id === 'export-excel') handleExport('excel');
    });
    dashboardContainer.addEventListener('click', e => {
        const button = e.target.closest('button[data-action="open-sector-modal"]');
        if(button) {
            openSectorProcessesModal(button.dataset.sectorId);
        }
    });
    visualizerContainer.addEventListener('click', e => {
        const button = e.target.closest('button[data-action="view-visualizer-tree"]');
        if(button) {
            renderVisualizerDetails(button.dataset.arbolId);
        }
    });
});
