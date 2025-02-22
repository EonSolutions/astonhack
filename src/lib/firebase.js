// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_KEY,
  authDomain: "astonhack-3a04f.firebaseapp.com",
  projectId: "astonhack-3a04f",
  storageBucket: "astonhack-3a04f.firebasestorage.app",
  messagingSenderId: "43696730437",
  appId: "1:43696730437:web:cec2b2d5dd088237558e2c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, collection, addDoc, ref, uploadBytes, getDownloadURL };