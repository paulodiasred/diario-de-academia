import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  waitForPendingWrites,
} from "firebase/firestore";
import { app, usarEmulador } from "./firebase";

// Separado do login: o Firestore é pesado e só carrega depois que a pessoa entra.
// Cache persistente: séries gravadas sem sinal ficam na fila e sobrevivem a recarregar a página.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});

if (usarEmulador) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
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
