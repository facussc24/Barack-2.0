document.addEventListener('DOMContentLoaded', function() {
  // Espera a que el SDK de Firebase esté disponible
  const auth = firebase.auth();

  // Redirigir si el usuario ya ha iniciado sesión
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("Usuario ya logueado, redirigiendo...");
      window.location.href = 'index.html'; 
    }
  });

  const googleLoginBtn = document.getElementById('google-login-btn');

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Evitar que el enlace navegue
      
      const provider = new firebase.auth.GoogleAuthProvider();
      
      auth.signInWithPopup(provider)
        .then((result) => {
          // Inicio de sesión exitoso.
          const user = result.user;
          console.log("¡Inicio de sesión con Google exitoso!", user);
          // La redirección se maneja con el onAuthStateChanged de arriba
        })
        .catch((error) => {
          // Manejar errores aquí.
          console.error("Error en el inicio de sesión con Google:", error);
          const errorCode = error.code;
          const errorMessage = error.message;
          const email = error.email;
          const credential = error.credential;
          alert(`Error: ${errorMessage}`);
        });
    });
  }
});
