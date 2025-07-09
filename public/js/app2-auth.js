document.addEventListener('DOMContentLoaded', function() {
    // Espera a que el SDK de Firebase esté cargado y listo
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            clearInterval(checkFirebase); // Detiene la comprobación
            
            const auth = firebase.auth();
            const userNameEl = document.getElementById('user-name');
            const userPhotoEl = document.getElementById('user-photo');

            auth.onAuthStateChanged((user) => {
                if (user) {
                    // Si el usuario está conectado...
                    console.log("Acceso autorizado para:", user.displayName);
                    // Actualizamos la barra de navegación con su info
                    if (userNameEl) userNameEl.textContent = user.displayName;
                    if (userPhotoEl) userPhotoEl.src = user.photoURL;
                } else {
                    // Si el usuario NO está conectado...
                    console.log("Acceso denegado. Redirigiendo a login.html");
                    // Lo redirigimos a la página de inicio de sesión
                    window.location.href = 'login.html';
                }
            });
        }
    }, 100); // Comprueba cada 100ms
});
