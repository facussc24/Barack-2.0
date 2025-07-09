
document.addEventListener('DOMContentLoaded', () => {
    // Definir un mapeo claro de las vistas a sus elementos de menú correspondientes.
    const viewToNavMapping = {
        // Vistas de Gestión de Datos
        'productos': { navId: 'nav-gestion', collapseId: 'collapseGestion', linkSelector: 'a[href="app1.html?view=productos"]' },
        'subproductos': { navId: 'nav-gestion', collapseId: 'collapseGestion', linkSelector: 'a[href="app1.html?view=subproductos"]' },
        'insumos': { navId: 'nav-gestion', collapseId: 'collapseGestion', linkSelector: 'a[href="app1.html?view=insumos"]' },
        'clientes': { navId: 'nav-gestion', collapseId: 'collapseGestion', linkSelector: 'a[href="app1.html?view=clientes"]' },
        'sectores': { navId: 'nav-gestion', collapseId: 'collapseGestion', linkSelector: 'a[href="app1.html?view=sectores"]' },
        'procesos': { navId: 'nav-gestion', collapseId: 'collapseGestion', linkSelector: 'a[href="app1.html?view=procesos"]' },
        
        // Vistas de Módulos Principales
        'arboles': { navId: 'nav-arboles' },
        'visualizer': { navId: 'nav-visualizador' }, // Aunque es app2.html, mantenemos la lógica unificada
        
        // Vista por defecto
        'dashboard': { navId: 'nav-dashboard' } 
    };

    /**
     * Activa el elemento de navegación correcto basado en la página actual o en la vista especificada.
     * Esta función centraliza la lógica del menú para evitar duplicación y condiciones de carrera.
     */
    function activateMenuLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentView = urlParams.get('view');
        const pathname = window.location.pathname;

        let activeConfig;

        if (pathname.includes('app2.html')) {
            activeConfig = viewToNavMapping['visualizer'];
        } else if (currentView && viewToNavMapping[currentView]) {
            activeConfig = viewToNavMapping[currentView];
        } else {
            // Si no hay vista, podría ser el dashboard principal (index.html)
            activeConfig = viewToNavMapping['dashboard'];
        }

        if (!activeConfig) {
            console.warn("No se encontró configuración de navegación para la vista actual.");
            return;
        }

        // 1. Resetear todos los estados activos para limpiar el menú.
        document.querySelectorAll('#accordionSidebar .nav-item.active').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('#accordionSidebar .collapse.show').forEach(item => item.classList.remove('show'));
        document.querySelectorAll('#accordionSidebar .nav-link:not(.collapsed)').forEach(item => item.classList.add('collapsed'));
        document.querySelectorAll('#accordionSidebar .collapse-item.active').forEach(item => item.classList.remove('active'));


        // 2. Activar el elemento principal del menú.
        const mainNavItem = document.getElementById(activeConfig.navId);
        if (mainNavItem) {
            mainNavItem.classList.add('active');

            // 3. Si es un menú colapsable, expandirlo.
            if (activeConfig.collapseId) {
                const link = mainNavItem.querySelector('a[data-toggle="collapse"]');
                const collapse = document.getElementById(activeConfig.collapseId);

                if (link && collapse) {
                    link.classList.remove('collapsed');
                    link.setAttribute('aria-expanded', 'true');
                    collapse.classList.add('show');

                    // 4. Activar el sub-ítem específico.
                    if (activeConfig.linkSelector) {
                        const activeSubItem = collapse.querySelector(activeConfig.linkSelector);
                        if (activeSubItem) {
                            activeSubItem.classList.add('active');
                        }
                    }
                }
            }
        }
    }

    // Ejecutar la función para asegurar que el menú esté correcto al cargar la página.
    activateMenuLink();
});
