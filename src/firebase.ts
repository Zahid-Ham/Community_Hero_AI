import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration loaded from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAsLYdX-a2CcKqfCuXAkS1Zs-KLsfnTGIc",
  authDomain: "bank-a1d2a.firebaseapp.com",
  projectId: "bank-a1d2a",
  storageBucket: "bank-a1d2a.firebasestorage.app",
  messagingSenderId: "72481582913",
  appId: "1:72481582913:web:7fe76a4d19f15eab46bbc0"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db = initializeFirestore(app, {}, "ai-studio-ad98d0cd-8b97-4899-9d56-56e3eef6e3c3");

// Initialize Firebase Authentication
export const auth = getAuth(app);

