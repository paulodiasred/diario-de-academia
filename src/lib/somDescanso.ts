const CHAVE = "diario:som-descanso";

let contexto: AudioContext | null = null;

/** Ligado por padrão: é o único aviso que funciona no iPhone com a tela à vista. */
export function somLigado(): boolean {
  try {
    return localStorage.getItem(CHAVE) !== "0";
  } catch {
    return true;
  }
}

export function definirSom(ligado: boolean): void {
  try {
    if (ligado) localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, "0");
  } catch {
    // Sem localStorage, vale o padrão.
  }
}

export const somSuportado = (): boolean => typeof AudioContext !== "undefined";

/**
 * O navegador só libera áudio depois de um toque da pessoa. Por isso o contexto é
 * preparado nos toques, e não na hora de tocar, que acontece sem nenhuma interação.
 */
export function prepararSom(): void {
  if (!somSuportado() || !somLigado()) return;
  try {
    contexto ??= new AudioContext();
    if (contexto.state === "suspended") void contexto.resume();
  } catch (erro) {
    console.warn("Não foi possível preparar o som do descanso:", erro);
  }
}

/** Três bipes curtos, audíveis com música de academia ao fundo. */
export function tocarSomDescanso(): void {
  if (!somLigado() || !contexto) return;
  try {
    const inicio = contexto.currentTime;
    for (let i = 0; i < 3; i++) {
      const oscilador = contexto.createOscillator();
      const volume = contexto.createGain();
      const momento = inicio + i * 0.28;
      oscilador.type = "sine";
      oscilador.frequency.value = i === 2 ? 1175 : 880;
      volume.gain.setValueAtTime(0.0001, momento);
      volume.gain.exponentialRampToValueAtTime(0.6, momento + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, momento + 0.2);
      oscilador.connect(volume);
      volume.connect(contexto.destination);
      oscilador.start(momento);
      oscilador.stop(momento + 0.22);
    }
  } catch (erro) {
    console.warn("Não foi possível tocar o som do descanso:", erro);
  }
}

/** Só para testes: cada teste começa sem contexto. */
export function esquecerContextoDeSom(): void {
  contexto = null;
}
