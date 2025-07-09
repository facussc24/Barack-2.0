import { db } from './database.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica del Visualizador Sinóptico ---
    
    // --- Elementos del DOM y Estado ---
    const treeContainer = document.getElementById('tree-container');
    const searchInput = document.getElementById('search-input');
    const activeFiltersBar = document.getElementById('active-filters-bar');
    const typeFilterBtn = document.getElementById('type-filter-btn');
    const typeFilterDropdown = document.getElementById('type-filter-dropdown');
    const typeFilterCheckboxes = document.querySelectorAll('.type-filter-cb');
    const addClientFilterBtn = document.getElementById('add-client-filter-btn');
    const addClientFilterDropdown = document.getElementById('add-client-filter-dropdown');
    const exportBtn = document.getElementById('export-btn');
    const exportDropdown = document.getElementById('export-dropdown');
    const exportXlsxBtn = document.getElementById('export-xlsx-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const toastContainer = document.getElementById('toast-container');
    
    let activeElementId = null;
    const activeFilters = { clients: new Set(), types: new Set(['cliente', 'producto', 'subproducto', 'insumo']) };
    const expandedNodes = new Set();
    
    // --- MAPEO DE DATOS ---
    // En un futuro, estos datos vendrán de Firestore. Por ahora, usamos el objeto 'db' importado.
    const allItemsMap = new Map();
    Object.values(db.clientes).forEach(c => { 
        c.type = 'cliente'; 
        c.products = db.productos.filter(p => p.clienteId === c.id).map(p => p.id);
        allItemsMap.set(c.id, c);
    });
    Object.values(db.productos).forEach(p => { 
        p.type = 'producto'; 
        p.subproducts = db.subproductos.filter(s => s.productoId === p.id).map(s => s.id); // Asumiendo relación
        allItemsMap.set(p.id, p);
    });
    Object.values(db.subproductos).forEach(s => {
        s.type = 'subproducto';
        s.insumos = db.insumos.filter(i => i.subproductoId === s.id).map(i => i.id); // Asumiendo relación
        allItemsMap.set(s.id, s);
    });
    Object.values(db.insumos).forEach(i => {
        i.type = 'insumo';
        allItemsMap.set(i.id, i);
    });
    Object.values(db.sectores).forEach(s => allItemsMap.set(s.id, s));
    Object.values(db.procesos).forEach(p => allItemsMap.set(p.id, p));


    // --- Sistema de Notificaciones Toast ---
    function showToast(message, type = 'success') {
        const iconMap = {
            success: { name: 'check-circle', color: 'text-green-500', border: 'border-green-500' },
            error: { name: 'x-circle', color: 'text-red-500', border: 'border-red-500' },
            info: { name: 'info', color: 'text-blue-500', border: 'border-blue-500' }
        };
        const toast = document.createElement('div');
        toast.className = `toast flex items-center w-full max-w-xs p-4 text-gray-700 bg-white rounded-lg shadow-lg border-l-4 ${iconMap[type].border}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-atomic', 'true');
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

    // --- Lógica de Renderizado y Filtro ---
    function refreshIcons() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    function renderFullUI() {
        renderTree();
        renderActiveFilters();
        populateAddClientFilterDropdown();
    }
    function renderTree() {
        const searchTerm = searchInput.value.toLowerCase();
        treeContainer.innerHTML = ''; 
        
        const clientIdsToRender = activeFilters.clients.size > 0 ? [...activeFilters.clients] : db.clientes.map(c => c.id);
        const rootClients = db.clientes.filter(c => clientIdsToRender.includes(c.id));
        let hasVisibleNodes = false;
        rootClients.forEach((client, index) => {
            const isLast = index === rootClients.length - 1;
            const node = buildAndFilterNode(client, searchTerm, isLast);
            if (node) {
                treeContainer.appendChild(node);
                hasVisibleNodes = true;
            }
        });
        if (!hasVisibleNodes) {
            treeContainer.innerHTML = `<div class="text-center text-slate-500 p-8">
                <i data-lucide="search-x" class="w-12 h-12 mx-auto text-slate-300"></i>
                <p class="mt-4 font-medium">Sin resultados</p>
                <p class="text-sm">No hay elementos que coincidan con los filtros aplicados.</p>
            </div>`;
        }
        
        refreshIcons();
    }
    function buildAndFilterNode(item, searchTerm, isLast) {
        if (!itemOrDescendantsMatch(item, searchTerm)) {
            return null; 
        }
        const isVisibleByType = activeFilters.types.has(item.type);
        let li = null;
        if (isVisibleByType) {
            li = createTreeItemElement(item, isLast);
        }
        const childrenIds = item.products || item.subproducts || item.insumos || [];
        if (childrenIds.length > 0 && expandedNodes.has(item.id)) {
            const childrenContainer = document.createElement('ul');
            
            const visibleChildren = childrenIds
                .map(id => allItemsMap.get(id))
                .filter(child => child && itemOrDescendantsMatch(child, searchTerm));
            visibleChildren.forEach((childItem, index) => {
                const isChildLast = index === visibleChildren.length - 1;
                const childNode = buildAndFilterNode(childItem, searchTerm, isChildLast);
                if (childNode) {
                    childrenContainer.appendChild(childNode);
                }
            });
            if (li && childrenContainer.hasChildNodes()) {
                li.appendChild(childrenContainer);
            }
        }
        return li;
    }
    function createTreeItemElement(item, isLast) {
        const li = document.createElement('li');
        li.className = 'tree-item';
        li.dataset.id = item.id;
        li.dataset.type = item.type;
        if (expandedNodes.has(item.id)) li.classList.add('expanded');
        if (isLast) li.classList.add('is-last');
        
        const hasChildren = item.products?.length > 0 || item.subproducts?.length > 0 || item.insumos?.length > 0;
        const iconMap = { cliente: 'building-2', producto: 'package', subproducto: 'package-check', insumo: 'beaker' };
        const div = document.createElement('div');
        div.className = 'tree-item-content flex items-center p-2 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors duration-200 min-h-[2.75rem]';
        if (item.id === activeElementId) div.classList.add('active');
        div.innerHTML = `
            <span class="flex items-center justify-center w-5 h-5 mr-1 flex-shrink-0">
                ${hasChildren ? '<i data-lucide="chevron-right" class="w-5 h-5 text-slate-400 toggle-expand"></i>' : ''}
            </span>
            <i data-lucide="${iconMap[item.type]}" class="w-5 h-5 mr-3 text-blue-600 flex-shrink-0"></i>
            <span class="flex-grow truncate select-none" title="${item.descripcion}">${item.descripcion}</span>
            <span class="text-xs text-slate-400 font-mono ml-2 select-none">${item.id}</span>
        `;
        
        li.appendChild(div);
        return li;
    }
    function itemOrDescendantsMatch(item, searchTerm) {
        if (!searchTerm) return true;
        const itemText = `${item.descripcion} ${item.id || ''}`.toLowerCase();
        if (itemText.includes(searchTerm)) return true;
        const childrenIds = item.products || item.subproducts || item.insumos;
        if (childrenIds) {
            return childrenIds.some(childId => {
                const childItem = allItemsMap.get(childId);
                return childItem && itemOrDescendantsMatch(childItem, searchTerm);
            });
        }
        return false;
    }
    
    function renderActiveFilters() {
        activeFiltersBar.innerHTML = '';
        if (activeFilters.clients.size === 0) {
            activeFiltersBar.innerHTML = `<span class="text-xs text-slate-500 italic">Mostrando todos los clientes</span>`;
        } else {
            activeFilters.clients.forEach(clientId => {
                const client = allItemsMap.get(clientId);
                if (client) {
                    const tag = document.createElement('div');
                    tag.className = 'flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full animate-fade-in';
                    tag.innerHTML = `<span>${client.descripcion}</span><button data-id="${clientId}" class="remove-filter-btn p-0.5 hover:bg-blue-200 rounded-full transition-colors"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>`;
                    activeFiltersBar.appendChild(tag);
                }
            });
        }
        refreshIcons();
    }
    
    function populateAddClientFilterDropdown() {
        addClientFilterDropdown.innerHTML = '';
        const availableClients = db.clientes.filter(client => !activeFilters.clients.has(client.id));
        
        if (availableClients.length === 0) {
             addClientFilterDropdown.innerHTML = `<span class="block px-4 py-2 text-sm text-slate-500">No hay más clientes para agregar.</span>`;
             return;
        }
        availableClients.forEach(client => {
            const item = document.createElement('a');
            item.href = '#';
            item.dataset.id = client.id;
            item.className = 'block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors duration-150';
            item.textContent = client.descripcion;
            addClientFilterDropdown.appendChild(item);
        });
    }
    // --- Manejadores de Eventos ---
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            expandedNodes.clear(); 
            const matchingItems = [...allItemsMap.values()].filter(item => 
                `${item.descripcion} ${item.id || ''}`.toLowerCase().includes(searchTerm)
            );
            
            matchingItems.forEach(item => {
                let current = item;
                while (current) {
                    expandedNodes.add(current.id);
                    current = findParent(current.id);
                }
            });
        }
        renderTree();
    });
    addClientFilterBtn.addEventListener('click', (e) => { e.stopPropagation(); populateAddClientFilterDropdown(); addClientFilterDropdown.classList.toggle('hidden'); });
    addClientFilterDropdown.addEventListener('click', (e) => { e.preventDefault(); if(e.target.tagName === 'A') { activeFilters.clients.add(e.target.dataset.id); addClientFilterDropdown.classList.add('hidden'); renderFullUI(); } });
    activeFiltersBar.addEventListener('click', (e) => { const removeBtn = e.target.closest('.remove-filter-btn'); if (removeBtn) { activeFilters.clients.delete(removeBtn.dataset.id); renderFullUI(); } });
    typeFilterBtn.addEventListener('click', (e) => { e.stopPropagation(); typeFilterDropdown.classList.toggle('hidden'); });
    typeFilterCheckboxes.forEach(cb => { cb.addEventListener('change', () => { if (cb.checked) activeFilters.types.add(cb.dataset.type); else activeFilters.types.delete(cb.dataset.type); renderTree(); }); });
    treeContainer.addEventListener('click', (e) => {
        const targetItem = e.target.closest('.tree-item');
        if (!targetItem) return;
        const itemId = targetItem.dataset.id;
        
        if (e.target.closest('.toggle-expand')) {
            if (expandedNodes.has(itemId)) expandedNodes.delete(itemId);
            else expandedNodes.add(itemId);
            renderTree();
        } 
        else if (e.target.closest('.tree-item-content')) {
            activeElementId = itemId;
            renderDetailView(itemId);
            renderTree();
        }
    });
    
    // --- LÓGICA DE EXPORTACIÓN ---
    exportXlsxBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dataToExport = [];
        const clientIdsToRender = activeFilters.clients.size > 0 ? [...activeFilters.clients] : db.clientes.map(c => c.id);
        const rootClients = db.clientes.filter(c => clientIdsToRender.includes(c.id)).sort((a,b) => a.descripcion.localeCompare(b.descripcion));
        function traverseForExcel(item, level) {
             if (!item || !itemOrDescendantsMatch(item, searchInput.value.toLowerCase()) || !activeFilters.types.has(item.type)) return;
             dataToExport.push({
                 'Jerarquía': '    '.repeat(level) + item.descripcion,
                 'Tipo': item.type.charAt(0).toUpperCase() + item.type.slice(1),
                 'Código': item.id,
                 'ID': item.id
             });
             if (expandedNodes.has(item.id)) {
                 const childrenIds = item.products || item.subproducts || item.insumos || [];
                 const children = childrenIds.map(id => allItemsMap.get(id)).filter(Boolean).sort((a,b) => a.descripcion.localeCompare(b.descripcion));
                 children.forEach(child => traverseForExcel(child, level + 1));
             }
        }
        rootClients.forEach(client => traverseForExcel(client, 0));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [ { wch: 60 }, { wch: 15 }, { wch: 20 }, { wch: 15 } ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sinóptico de Producto");
        XLSX.writeFile(workbook, "sinoptico_producto.xlsx");
        exportDropdown.classList.add('hidden');
    });

    exportPdfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportDropdown.classList.add('hidden');
        const originalButtonContent = exportPdfBtn.innerHTML;
        exportPdfBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin text-red-600"></i> Exportando...`;
        refreshIcons();
        setTimeout(() => { 
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'landscape' });
                
                const rows = [];
                const clientIdsToRender = activeFilters.clients.size > 0 ? [...activeFilters.clients] : db.clientes.map(c => c.id);
                const rootClients = db.clientes
                    .filter(c => clientIdsToRender.includes(c.id))
                    .sort((a, b) => a.descripcion.localeCompare(b.description));
                function traverseForPdf(item, prefix, isLastNode, level) {
                    if (!item || !itemOrDescendantsMatch(item, searchInput.value.toLowerCase()) || !activeFilters.types.has(item.type)) {
                        return;
                    }
                    
                    const linePrefix = prefix + (isLastNode ? '└── ' : '├── ');
                    rows.push({
                        content: [
                            linePrefix + item.descripcion,
                            item.type.charAt(0).toUpperCase() + item.type.slice(1),
                            item.id
                        ],
                        level: level 
                    });
                    if (expandedNodes.has(item.id)) {
                        const childrenIds = item.products || item.subproducts || item.insumos || [];
                        const visibleChildren = childrenIds
                            .map(id => allItemsMap.get(id))
                            .filter(child => child && itemOrDescendantsMatch(child, searchInput.value.toLowerCase()) && activeFilters.types.has(child.type))
                            .sort((a, b) => a.descripcion.localeCompare(b.description)); 
                        const newPrefix = prefix + (isLastNode ? '    ' : '│   ');
                        visibleChildren.forEach((child, index) => {
                            const isLastChild = index === visibleChildren.length - 1;
                            traverseForPdf(child, newPrefix, isLastChild, level + 1);
                        });
                    }
                }
                rootClients.forEach(client => {
                    if (itemOrDescendantsMatch(client, searchInput.value.toLowerCase()) && activeFilters.types.has(client.type)) {
                        rows.push({
                            content: [
                                client.descripcion,
                                client.type.charAt(0).toUpperCase() + client.type.slice(1),
                                client.id
                            ],
                            level: 0 
                        });
                        if (expandedNodes.has(client.id)) {
                            const childrenIds = client.products || [];
                            const visibleChildren = childrenIds
                                .map(id => allItemsMap.get(id))
                                .filter(child => child && itemOrDescendantsMatch(child, searchInput.value.toLowerCase()) && activeFilters.types.has(child.type))
                                .sort((a, b) => a.descripcion.localeCompare(b.description)); 
                            visibleChildren.forEach((child, index) => {
                                const isLastChild = index === visibleChildren.length - 1;
                                traverseForPdf(child, '', isLastChild, 1);
                            });
                        }
                    }
                });
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                doc.setFillColor(30, 64, 175);
                doc.rect(0, 0, pageWidth, 28, 'F');
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.text("Sinóptico de Producto", 14, 18);
                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(200, 220, 255);
                const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                doc.text(`Generado el: ${date}`, pageWidth - 14, 18, { align: 'right' });
                doc.autoTable({
                    head: [['Descripción Jerárquica', 'Tipo de Elemento', 'Código Interno']],
                    body: rows.map(r => r.content), 
                    startY: 35,
                    theme: 'grid',
                    headStyles: { 
                        fillColor: [45, 55, 72], textColor: 255, fontStyle: 'bold', halign: 'center'
                    },
                    styles: { 
                        fontSize: 9, cellPadding: 3, overflow: 'linebreak' 
                    },
                    columnStyles: { 
                        0: { font: 'Courier', fontStyle: 'normal', cellWidth: 150 }, 
                        1: { font: 'Helvetica', cellWidth: 40, halign: 'center' }, 
                        2: { font: 'Helvetica', cellWidth: 'auto', halign: 'left' } 
                    },
                    didDrawCell: (data) => {
                        if (data.section === 'body') {
                            const rowData = rows[data.row.index];
                            const level = rowData.level;
                            let fillColor = false;
                            
                            if (level === 0) { 
                                data.cell.styles.fontStyle = 'bold';
                            } else if (level === 1) { 
                                fillColor = [219, 234, 254]; 
                            } else if (level === 2) { 
                                fillColor = [239, 246, 255]; 
                            } else if (level >= 3) { 
                                fillColor = [248, 250, 252]; 
                            }
                            if(fillColor) {
                                doc.setFillColor(...fillColor);
                                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                                doc.setTextColor(data.cell.styles.textColor);
                                doc.setFont(data.cell.styles.font, data.cell.styles.fontStyle);
                                doc.text(data.cell.text, data.cell.textPos.x, data.cell.textPos.y);
                            }
                        }
                    },
                    didDrawPage: (data) => {
                        const pageCount = doc.internal.getNumberOfPages();
                        doc.setFontSize(8); 
                        doc.setTextColor(150);
                        doc.text('Página ' + doc.internal.getCurrentPageInfo().pageNumber + ' de ' + pageCount, data.settings.margin.left, pageHeight - 10);
                    }
                });
                doc.save('sinoptico_producto_ordenado.pdf');
            } catch (err) {
                console.error("Error al generar el PDF:", err);
                showToast('Hubo un error al generar el PDF.', 'error');
            } finally {
                exportPdfBtn.innerHTML = originalButtonContent;
                refreshIcons();
            }
        }, 250);
    });
    // --- Listeners y Helpers Generales ---
    document.addEventListener('click', (e) => { 
        if (!exportBtn.parentElement.contains(e.target)) exportDropdown.classList.add('hidden'); 
        if (!typeFilterBtn.parentElement.contains(e.target)) typeFilterDropdown.classList.add('hidden'); 
        if (!addClientFilterBtn.parentElement.contains(e.target)) addClientFilterDropdown.classList.add('hidden'); 
    });
    exportBtn.addEventListener('click', (e) => { e.stopPropagation(); exportDropdown.classList.toggle('hidden'); });
    
    function findParent(childId) {
        for (const item of allItemsMap.values()) {
            if (item.products?.includes(childId) || item.subproducts?.includes(childId) || item.insumos?.includes(childId)) {
                return item;
            }
        }
        return null;
    }
    // --- Lógica de la Vista de Detalle ---
    function renderDetailView(itemId) {
        const item = allItemsMap.get(itemId);
        if (!item) return;
        let content = `<div class="bg-white rounded-xl shadow-lg p-6 h-full overflow-y-auto custom-scrollbar animate-slide-in">`;
        content += createDetailHeader(item);
        switch (item.type) {
            case 'cliente':
                content += createSectionHeader('Información General');
                content += createDetailRow('hash', 'Código de Cliente', item.id);
                break;
            case 'producto':
                const client = allItemsMap.get(item.clienteId);
                const process = allItemsMap.get(item.procesoId);
                const sector = process ? allItemsMap.get(process.sectorId) : null;
                content += createSectionHeader('Información General');
                content += createDetailRow('building-2', 'Cliente', client?.descripcion);
                content += createDetailRow('fingerprint', 'Código de Cliente', item.codigoCliente);
                content += createDetailRow('cpu', 'Proceso', `${process?.descripcion || ''} (${sector?.descripcion || ''})`);
                content += createDetailRow('tag', 'Versión', item.version);
                content += createSectionHeader('Especificaciones Técnicas');
                content += createDetailRow('box', 'Piezas por Vehículo', item.pzasVh);
                content += createDetailRow('ruler', 'Unidad', item.unidad);
                content += createDetailRow('truck', 'Sourcing', item.sourcing);
                content += createDetailRow('paint-bucket', 'Apariencia', item.apariencia);
                content += createDetailRow('maximize', 'Superficie', `${item.superficie} m²`);
                content += createDetailRow('move-3d', 'Tamaño', item.tamano);
                content += createDetailRow('scale', 'Peso por Pieza', `${item.peso} gr`);
                break;
            case 'subproducto':
                content += createSectionHeader('Información de Fabricación');
                content += createDetailRow('cpu', 'Proceso de Fabricación', item.procesoFabricacion);
                content += createDetailRow('timer', 'Tiempo de Ciclo', `${item.tiempoCiclo} seg`);
                content += createDetailRow('binary', 'Materiales', item.materiales);
                content += createSectionHeader('Especificaciones Técnicas');
                content += createDetailRow('scale', 'Peso', `${item.peso} gr`);
                content += createDetailRow('plus-minus', 'Tolerancia de Peso', `± ${item.toleranciaPeso} gr`);
                content += createDetailRow('move-3d', 'Dimensiones', item.dimensiones);
                break;
            case 'insumo':
                content += createSectionHeader('Información de Abastecimiento');
                content += createDetailRow('truck', 'Proveedor', item.proveedor);
                content += createDetailRow('ruler', 'Unidad de Medida', item.unidadMedida);
                content += createDetailRow('dollar-sign', 'Costo por Unidad', `$${item.costoUnidad.toFixed(2)}`);
                content += createDetailRow('archive', 'Stock Mínimo', item.stockMinimo);
                content += createSectionHeader('Configuración de Consumo');
                content += createEditableDetailRow('calculator', 'Consumo por unidad de producto padre', item.consumo, item.id);
                content += createDetailRow('message-square', 'Observaciones', item.observaciones || 'Sin observaciones.');
                break;
        }
        content += `</div>`;
        const detailContainer = document.getElementById('detail-container');
        detailContainer.innerHTML = content;
        
        // Añadir listener para el botón de guardar
        const saveButton = detailContainer.querySelector('.save-consumo-btn');
        if(saveButton) {
            saveButton.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemid;
                const input = document.getElementById(`consumo-${itemId}`);
                if(input && itemId) {
                    const newValue = parseFloat(input.value);
                    const insumo = allItemsMap.get(itemId);
                    if(insumo && !isNaN(newValue)) {
                        insumo.consumo = newValue;
                        showToast('Consumo actualizado correctamente.', 'success');
                        renderDetailView(itemId); // Re-render para mostrar el valor actualizado y refrescar
                    } else {
                        showToast('Valor de consumo inválido.', 'error');
                    }
                }
            });
        }

        refreshIcons();
    }
    function createDetailHeader(item) { const iconMap = { cliente: 'building-2', producto: 'package', subproducto: 'package-check', insumo: 'beaker' }; return ` <div class="flex items-start mb-6 pb-4 border-b border-slate-200"> <div class="w-14 h-14 flex-shrink-0 mr-4 bg-blue-600 rounded-lg flex items-center justify-center shadow-md"> <i data-lucide="${iconMap[item.type]}" class="w-8 h-8 text-white"></i> </div> <div> <p class="text-sm font-bold uppercase text-blue-600 tracking-wider">${item.type}</p> <h2 class="text-2xl font-bold text-slate-800 leading-tight">${item.descripcion}</h2> <p class="text-sm font-semibold text-slate-500">${item.id}</p> </div> </div> `; }
    function createSectionHeader(title) { return `<h3 class="detail-section-header">${title}</h3>`; }
    function createDetailRow(icon, label, value) { 
        if (!value) return ''; 
        return `
            <div class="flex items-start py-3 border-b border-slate-100">
                <i data-lucide="${icon}" class="w-5 h-5 text-slate-400 mt-1 mr-4 flex-shrink-0"></i>
                <div class="flex-grow">
                    <p class="text-sm text-slate-500">${label}</p>
                    <p class="font-semibold text-slate-700">${value}</p>
                </div>
            </div>
        `; 
    }
    
    function createEditableDetailRow(icon, label, value, itemId) { 
        return `
            <div class="flex items-center py-2 my-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <i data-lucide="${icon}" class="w-5 h-5 text-blue-500 mr-4 flex-shrink-0"></i>
                <div class="flex-grow">
                    <label for="consumo-${itemId}" class="text-xs font-bold text-blue-700">${label}</label>
                    <input type="number" step="0.01" id="consumo-${itemId}" value="${value}" class="font-semibold text-lg text-blue-900 bg-transparent w-full focus:outline-none focus:ring-0 border-0 p-0 appearance-none">
                </div>
                <button data-itemid="${itemId}" title="Guardar" class="save-consumo-btn ml-2 p-2 rounded-md hover:bg-blue-200 transition-colors">
                    <i data-lucide="save" class="w-5 h-5 text-blue-600"></i>
                </button>
            </div>
        `; 
    }
    
    // --- RENDER INICIAL ---
    renderFullUI();
});
