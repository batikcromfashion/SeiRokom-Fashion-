import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// SeiRokom Fashion - Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5bDIPONAtmSQ5a81-DEY8G4ArApdZ_-M",
  authDomain: "seirokom-fashion.firebaseapp.com",
  projectId: "seirokom-fashion",
  storageBucket: "seirokom-fashion.firebasestorage.app",
  messagingSenderId: "105130000338",
  appId: "1:105130000338:web:30bac8b1926eac61fc658b",
  measurementId: "G-TB2Y5T78JD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Make 'db' and Firestore helper functions globally accessible (Window Object)
window.SRF_db = db;
window.SRF_Firestore = {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
};

// ES Module Export
export {
  db,
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
};

// Load Messenger Float Button
const _srf_float = document.createElement('script');
_srf_float.src = './messenger-float.js';
document.head.appendChild(_srf_float);
