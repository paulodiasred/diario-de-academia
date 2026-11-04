import { useEffect, useState } from "react";

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// O navegador dispara o evento uma vez, muitas vezes antes de a tela de ajustes existir.
let eventoGuardado: EventoInstalacao | null = null;
const ouvintes = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    eventoGuardado = evento as EventoInstalacao;
    ouvintes.forEach((avisar) => avisar());
  });
  window.addEventListener("appinstalled", () => {
    eventoGuardado = null;
    ouvintes.forEach((avisar) => avisar());
  });
}

const instalado = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const ehIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function useInstalarApp() {
  const [, atualizar] = useState(0);

  useEffect(() => {
    const avisar = () => atualizar((n) => n + 1);
    ouvintes.add(avisar);
    return () => {
      ouvintes.delete(avisar);
    };
  }, []);

  return {
    podeInstalar: !!eventoGuardado && !instalado(),
    /** O iPhone não oferece botão: a instalação é pelo menu de compartilhar do Safari. */
    mostrarDicaIos: ehIos() && !instalado(),
    instalar: async () => {
      if (!eventoGuardado) return;
      await eventoGuardado.prompt();
      await eventoGuardado.userChoice;
      eventoGuardado = null;
      ouvintes.forEach((avisar) => avisar());
    },
  };
}
