import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstalarApp } from "@/hooks/useInstalarApp";

const CHAVE = "diario:convite-instalar";

const jaRespondido = () => {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
};

const lembrarResposta = () => {
  try {
    localStorage.setItem(CHAVE, "1");
  } catch {
    // Sem localStorage, o convite pode voltar no próximo treino.
  }
};

/** Depois do primeiro treino a pessoa já viu o valor: é a hora de convidar, e só uma vez. */
export function ConviteInstalar() {
  const { podeInstalar, mostrarDicaIos, instalar } = useInstalarApp();
  const [dispensado, setDispensado] = useState(jaRespondido);

  if (dispensado || (!podeInstalar && !mostrarDicaIos)) return null;

  const dispensar = () => {
    lembrarResposta();
    setDispensado(true);
  };

  return (
    <section aria-label="Instalar o app" className="glass-card rounded-xl p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Tenha o app na tela inicial</h2>
        <p className="text-sm text-muted-foreground">
          {podeInstalar
            ? "Abre mais rápido e funciona sem sinal na academia."
            : "No Safari, toque em Compartilhar e em Adicionar à Tela de Início. Abre mais rápido e funciona sem sinal."}
        </p>
      </div>
      <div className="flex gap-2">
        {podeInstalar && (
          <Button
            className="flex-1"
            onClick={() => {
              dispensar();
              void instalar();
            }}
          >
            Instalar o app
          </Button>
        )}
        <Button variant="outline" className="flex-1" onClick={dispensar}>
          {podeInstalar ? "Agora não" : "Entendi"}
        </Button>
      </div>
    </section>
  );
}
