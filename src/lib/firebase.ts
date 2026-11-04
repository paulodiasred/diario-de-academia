import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

export const usarEmulador = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

// Esta configuração é pública por natureza: a proteção real está em firestore.rules.
// O fallback mantém o deploy atual funcionando até as variáveis existirem na hospedagem.
const firebaseConfig = usarEmulador
  ? { apiKey: "demo-key", authDomain: "localhost", projectId: "demo-diario", appId: "demo-app" }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyCiFfKj9MCKKsGStSZzzURew-tNpUssu-I",
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "diario-de-academia-78b61.firebaseapp.com",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "diario-de-academia-78b61",
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
        "diario-de-academia-78b61.firebasestorage.app",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "783479547403",
      appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:783479547403:web:edbcb3b4f33d6d9af3890e",
    };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

if (usarEmulador) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
