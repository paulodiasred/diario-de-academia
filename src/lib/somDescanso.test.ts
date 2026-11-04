import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { definirSom, esquecerContextoDeSom, prepararSom, somLigado, tocarSomDescanso } from "./somDescanso";

const criarOscilador = vi.fn(() => ({
  type: "sine",
  frequency: { value: 0 },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}));
const retomar = vi.fn().mockResolvedValue(undefined);
let estado: AudioContextState = "running";

class ContextoFalso {
  currentTime = 0;
  destination = {};
  get state() {
    return estado;
  }
  resume = retomar;
  createOscillator = criarOscilador;
  createGain = () => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  });
}

describe("som do fim do descanso", () => {
  beforeEach(() => {
    localStorage.clear();
    criarOscilador.mockClear();
    retomar.mockClear();
    estado = "running";
    esquecerContextoDeSom();
    vi.stubGlobal("AudioContext", ContextoFalso);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("começa ligado", () => {
    expect(somLigado()).toBe(true);
  });

  it("toca três bipes depois de preparado", () => {
    prepararSom();
    tocarSomDescanso();
    expect(criarOscilador).toHaveBeenCalledTimes(3);
  });

  it("sem um toque antes, não tenta tocar", () => {
    tocarSomDescanso();
    expect(criarOscilador).not.toHaveBeenCalled();
  });

  it("desligado, não toca nem prepara", () => {
    definirSom(false);
    expect(somLigado()).toBe(false);
    prepararSom();
    tocarSomDescanso();
    expect(criarOscilador).not.toHaveBeenCalled();
    definirSom(true);
    expect(somLigado()).toBe(true);
  });

  it("retoma o áudio suspenso a cada toque", () => {
    estado = "suspended";
    prepararSom();
    expect(retomar).toHaveBeenCalledTimes(1);
  });

  it("navegador sem áudio não quebra o treino", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(() => {
      prepararSom();
      tocarSomDescanso();
    }).not.toThrow();
  });
});
