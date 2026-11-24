import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAC-_nAhI3643RtY8aaN6FniWUfEl0YDNU",
  authDomain: "mivvi-app.firebaseapp.com",
  projectId: "mivvi-app",
  storageBucket: "mivvi-app.firebasestorage.app",
  messagingSenderId: "758653534324",
  appId: "1:758653534324:web:0cb44af44afa5820c7d121",
  measurementId: "G-FJLEWGHZG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Keep the session after closing the tab/app (IndexedDB, then localStorage).
setPersistence(auth, indexedDBLocalPersistence).catch(() => setPersistence(auth, browserLocalPersistence).catch(() => { /* private mode */ }));
export const database = getDatabase(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');

// Optional: Configure additional scopes for Apple
appleProvider.addScope('email');
appleProvider.addScope('name');
