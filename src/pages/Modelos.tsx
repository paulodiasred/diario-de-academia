import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Sparkles } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RecursoPremium } from "@/components/RecursoPremium";
import { PreviaDoModelo, plural } from "@/components/treino/PreviaDoModelo";
import { Button } from "@/components/ui/button";
import { MODELOS_TREINO } from "@/domain/modelosTreino";
import { usePlano } from "@/hooks/usePlano";
import { fichasIaAtiva } from "@/lib/recursos";

const Modelos = () => {
  const navigate = useNavigate();
  const { premium } = usePlano();
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
      <Cabecalho
        titulo="Modelos de treino"
        subtitulo="Um ponto de partida. Depois, é só ajustar."
        onVoltar={() => navigate(-1)}
      />

      {fichasIaAtiva &&
        (premium ? (
          <button
            type="button"
            onClick={() => navigate("/meus-treinos/ficha-ia")}
            className="glass-card rounded-xl w-full p-4 flex items-start gap-3 text-left"
          >
            <Sparkles className="w-5 h-5 mt-0.5 text-primary shrink-0" aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block font-semibold">Montar com IA</span>
              <span className="block text-sm text-muted-foreground">
                Responda 5 perguntas e receba uma sugestão para revisar.
              </span>
            </span>
          </button>
        ) : (
          <RecursoPremium titulo="Ficha montada por IA" descricao="Responda 5 perguntas e receba uma sugestão para revisar." />
        ))}

      <ul className="space-y-3">
        {MODELOS_TREINO.map((modelo) => {
          const estaAberto = aberto === modelo.id;
          return (
            <li key={modelo.id} className="glass-card rounded-xl">
              <button
                type="button"
                aria-expanded={estaAberto}
                onClick={() => setAberto(estaAberto ? null : modelo.id)}
                className="w-full p-4 flex items-start gap-3 text-left"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold">{modelo.nome}</span>
                  <span className="block text-caption text-muted-foreground">
                    {modelo.frequencia} · {plural(modelo.fichas.length, "ficha", "fichas")}
                  </span>
                  <span className="block mt-1 text-sm text-muted-foreground">{modelo.descricao}</span>
                </span>
                <ChevronDown
                  aria-hidden
                  className={`w-4 h-4 mt-1 shrink-0 text-muted-foreground transition-transform ${estaAberto ? "rotate-180" : ""}`}
                />
              </button>

              {estaAberto && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3">
                  <PreviaDoModelo modelo={modelo} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Button variant="ghost" className="w-full h-11" onClick={() => navigate("/meus-treinos/criar", { replace: true })}>
        Prefiro montar do zero
      </Button>
    </div>
  );
};

export default Modelos;
