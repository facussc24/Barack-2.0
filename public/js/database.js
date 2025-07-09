// Importar las funciones necesarias del SDK de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// El siguiente import es para la autenticación, si se necesita aquí.
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// La configuración de Firebase de tu proyecto (se obtiene de la consola de Firebase)
// **NOTA IMPORTANTE:** Esta configuración se cargará desde el script /__/firebase/init.js
// que Firebase hosting provee automáticamente. No es necesario pegarla aquí.
// El SDK la detectará automáticamente cuando se despliegue en Firebase.
const firebaseConfig = {}; 

// Inicializar la aplicación de Firebase
// Esta línea es crucial. initializeApp debe ser llamada una sola vez.
// Los scripts de Firebase que ya tienes en tus HTML (`/__/firebase/init.js`) 
// ya hacen esto, así que esta línea es para asegurar que el objeto `app` exista.
const app = initializeApp(firebaseConfig);


// Obtener una referencia a la base de datos de Firestore
// Esta es la referencia que el resto de tu aplicación usará para
// leer y escribir datos en las colecciones.
export const db = getFirestore(app);

// Opcional: exportar también la referencia de autenticación si se necesita
// export const auth = getAuth(app);

// --- Funciones de ayuda para CRUD en Firestore ---
export async function fetchCollectionData(collectionName) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createDocument(collectionName, data, id = null) {
    if (id) {
        await setDoc(doc(db, collectionName, id), data);
        return id;
    } else {
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef.id;
    }
}

export async function updateDocument(collectionName, id, data) {
    await updateDoc(doc(db, collectionName, id), data);
}

export async function deleteDocument(collectionName, id) {
    await deleteDoc(doc(db, collectionName, id));
}
