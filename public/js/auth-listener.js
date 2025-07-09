// Unified authentication listener for all protected pages
// Redirects unauthenticated users to login.html and updates
// user info when logged in. Additionally, if this script is
// executed on index.html, it will send authenticated users to
// app1.html?view=dashboard.
document.addEventListener('DOMContentLoaded', () => {
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            clearInterval(checkFirebase);
            const auth = firebase.auth();
            const userNameEl = document.getElementById('user-name');
            const userPhotoEl = document.getElementById('user-photo');
            const currentFile = window.location.pathname.split('/').pop() || 'index.html';

            auth.onAuthStateChanged(user => {
                if (user) {
                    console.log('Acceso autorizado para:', user.displayName);
                    if (userNameEl) userNameEl.textContent = user.displayName;
                    if (userPhotoEl) userPhotoEl.src = user.photoURL;
                    if (currentFile === 'index.html') {
                        window.location.href = 'app1.html?view=dashboard';
                    }
                } else {
                    console.log('Acceso denegado. Redirigiendo a login.html');
                    if (currentFile !== 'login.html') {
                        window.location.href = 'login.html';
                    }
                }
            });
        }
    }, 100);
});
