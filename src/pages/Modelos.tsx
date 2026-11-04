import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { toast } from "@/lib/aviso";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { LIMITES_GRATUITO } from "@/domain/planos";
import { MODELOS_TREINO, montarTreinosDoModelo, nomesDaFicha, type ModeloTreino } from "@/domain/modelosTreino";
import { catalogo } from "@/hooks/useCatalogoExercicios";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import { usePlano } from "@/hooks/usePlano";

const plural = (n: number, singular: string, varios: string) => `${n} ${n === 1 ? singular : varios}`;

const Modelos = () => {
  const navigate = useNavigate();
  const { criarTreino } = useMeusTreinos();
  const plano = usePlano();
  const [aberto, setAberto] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const vagas = plano.premium ? Infinity : Math.max(0, LIMITES_GRATUITO.treinos - plano.uso.treinos);

  const usar = async (modelo: ModeloTreino) => {
    setCriando(true);
    try {
      for (const treino of montarTreinosDoModelo(modelo, catalogo)) {
        await criarTreino(treino);
      }
      toast.success(
        modelo.fichas.length === 1 ? "Treino criado" : `${modelo.fichas.length} treinos criados`,
        { description: "Ajuste exercícios, séries e dias quando quiser." },
      );
      navigate("/meus-treinos", { replace: true });
    } catch (erro) {
      console.error("Erro ao usar o modelo:", erro);
      toast.error("Não foi possível criar os treinos. Tente de novo.");
      setCriando(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
      <Cabecalho
        titulo="Modelos de treino"
        subtitulo="Um ponto de partida. Depois, é só ajustar."
        onVoltar={() => navigate(-1)}
      />

      <ul className="space-y-3">
        {MODELOS_TREINO.map((modelo) => {
          const estaAberto = aberto === modelo.id;
          const fichas = modelo.fichas.length;
          const faltamVagas = !plano.carregando && fichas > vagas;
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
                    {modelo.frequencia} · {plural(fichas, "ficha", "fichas")}
                  </span>
                  <span className="block mt-1 text-sm text-muted-foreground">{modelo.descricao}</span>
                </span>
                <ChevronDown
                  aria-hidden
                  className={`w-4 h-4 mt-1 shrink-0 text-muted-foreground transition-transform ${estaAberto ? "rotate-180" : ""}`}
                />
              </button>

              {estaAberto && (
                <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3">
                  {modelo.fichas.map((ficha) => (
                    <section key={ficha.nome} aria-label={ficha.nome}>
                      <h2 className="font-semibold text-sm">{ficha.nome}</h2>
                      <p className="text-caption text-muted-foreground mb-1">{ficha.dias.join(", ")}</p>
                      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                        {nomesDaFicha(ficha, catalogo).map((nome) => (
                          <li key={nome}>{nome}</li>
                        ))}
                      </ul>
                    </section>
                  ))}

                  {faltamVagas ? (
                    <div className="space-y-2">
                      <p role="status" className="text-sm text-muted-foreground">
                        Este modelo tem {plural(fichas, "ficha", "fichas")}, e seu plano tem{" "}
                        {plural(vagas, "vaga", "vagas")}. Exclua um treino ou escolha um modelo menor.
                      </p>
                      <Button variant="outline" className="w-full h-11" onClick={() => navigate("/meus-treinos")}>
                        Ver meus treinos
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-12"
                      disabled={criando || plano.carregando}
                      onClick={() => void usar(modelo)}
                    >
                      {criando ? "Criando..." : "Usar este modelo"}
                    </Button>
                  )}
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
