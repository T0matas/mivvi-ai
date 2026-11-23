import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

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
export const database = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();

export const appleProvider = new OAuthProvider('apple.com');

// Optional: Configure additional scopes for Apple
appleProvider.addScope('email');
appleProvider.addScope('name');
