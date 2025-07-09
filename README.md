# Proyecto de Panel de Control con SB Admin 2 y Firebase

Este proyecto integra una plantilla de panel de control (SB Admin 2) con los servicios de autenticación, Firestore y hosting de Firebase. La aplicación permite a los usuarios iniciar sesión con su cuenta de Google para acceder a dos aplicaciones personalizadas y ricas en funcionalidades: "Gestión de Datos" y un "Visualizador Sinóptico".

**NOTA IMPORTANTE SOBRE EL DESARROLLO:**
Debido a la complejidad y tamaño de los archivos HTML, la edición directa de los mismos por parte de la IA se ha vuelto ineficiente. El flujo de trabajo actual es:
1. La IA revisa los archivos y detecta problemas o áreas de mejora.
2. La IA proporciona instrucciones claras y fragmentos de código específicos para que el desarrollador humano los implemente.
3. El desarrollador confirma los cambios y la IA procede a la siguiente tarea.

## Tecnologías Utilizadas

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+ Módulos).
*   **Frameworks CSS:**
    *   **Bootstrap 4 (SB Admin 2):** Base para la estructura general del panel.
    *   **TailwindCSS (vía CDN):** Para el diseño rápido de las vistas internas.
*   **Backend y Hosting (Firebase):**
    *   **Firebase Authentication:** Para inicio de sesión con Google.
    *   **Firebase Hosting:** Para despliegue y servicio de la aplicación.
    *   **Firestore:** Como base de datos en tiempo real para toda la aplicación.

## Estado Actual y Funcionalidades

*   [X] Estructura del panel basada en SB Admin 2.
*   [X] Sistema de autenticación con Google funcional.
*   [X] Protección de rutas: solo usuarios autenticados acceden a las aplicaciones.
*   [X] Módulos de aplicación (`app1`, `app2`) integrados en la plantilla.
*   [X] **Arquitectura de JavaScript Refactorizada:**
    *   **Lógica Centralizada:** Un único script (`js/main-app.js`) es responsable de leer la URL y activar el menú correcto, eliminando duplicación y conflictos.
    *   **Módulos Independientes:** La lógica específica de cada aplicación reside en su propio archivo (`app1-logic.js`, `app2-logic.js`), mejorando la mantenibilidad.
    *   **Base de Datos Única:** Se ha creado un módulo `js/database.js` que centraliza la conexión a Firestore, asegurando que ambas aplicaciones compartan la misma fuente de datos.
*   [X] Logo de la aplicación actualizado.

## El Camino a la Solución: Del Conflicto a la Arquitectura

El bug más persistente fue el del menú desplegable que se abría y cerraba instantáneamente. El diagnóstico inicial fue incorrecto; el problema no era un simple conflicto de clases, sino una **condición de carrera (race condition)** entre el script de la plantilla (`sb-admin-2.min.js`) y los scripts de la aplicación.

*   **La Causa Raíz:** El script de la plantilla se ejecutaba después de que nuestro código intentara forzar la apertura del menú, revirtiendo los cambios.
*   **La Solución Definitiva:** La estrategia correcta fue dejar que el script de la plantilla hiciera su trabajo sin interferencias y, solo después, aplicar nuestros cambios de forma centralizada.
    1.  **HTML Estático y Cerrado:** Cada página (`app1.html`, `app2.html`) contiene su barra lateral con los menús cerrados por defecto.
    2.  **Activación Centralizada y Post-Carga:** El script `js/main-app.js` se ejecuta en todas las páginas. Lee la URL actual y, **después de que todo lo demás se ha cargado**, aplica las clases `active` y `show` al elemento de menú correcto.

*   **Beneficios de esta Arquitectura:**
    *   **Elimina la Condición de Carrera:** El flujo de ejecución es ahora predecible.
    *   **Estabilidad Garantizada:** El comportamiento del menú es el nativo de la plantilla.
    *   **Claridad del Código (Principio de Responsabilidad Única):**
        *   `app1.html` y `app2.html`: Son solo la estructura.
        *   `app1-logic.js` y `app2-logic.js`: Contienen la lógica de su respectiva aplicación.
        *   `main-app.js`: Se encarga solo del menú.
        *   `database.js`: Se encarga solo de la conexión a la base de datos.
