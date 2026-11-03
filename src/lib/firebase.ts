import { initializeApp } from "firebase/app";
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  waitForPendingWrites,
} from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const usarEmulador = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

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

const app = initializeApp(firebaseConfig);

// Cache persistente: séries gravadas sem sinal ficam na fila e sobrevivem a recarregar a página.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});
export const auth = getAuth(app);

if (usarEmulador) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

/** true se tudo já chegou ao servidor dentro do prazo. */
export async function gravacoesSincronizadas(prazoMs = 5000): Promise<boolean> {
  const prazo = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), prazoMs));
  return Promise.race([waitForPendingWrites(db).then(() => true), prazo]);
}

/**
 * Apaga do aparelho os dados da conta (aparelhos compartilhados).
 * Encerra o Firestore: a página precisa ser recarregada depois.
 */
export async function limparDadosLocais(): Promise<void> {
  await terminate(db);
  await clearIndexedDbPersistence(db);
}
