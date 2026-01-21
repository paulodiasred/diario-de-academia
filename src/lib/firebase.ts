import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiFfKj9MCKKsGStSZzzURew-tNpUssu-I",
  authDomain: "diario-de-academia-78b61.firebaseapp.com",
  projectId: "diario-de-academia-78b61",
  storageBucket: "diario-de-academia-78b61.firebasestorage.app",
  messagingSenderId: "783479547403",
  appId: "1:783479547403:web:edbcb3b4f33d6d9af3890e",
  measurementId: "G-PQQJBMTEBH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);