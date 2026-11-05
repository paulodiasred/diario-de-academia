import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/aviso";
import { Button } from "@/components/ui/button";
import { LIMITES_GRATUITO } from "@/domain/planos";
import { montarTreinosDoModelo, nomesDaFicha, type ModeloTreino } from "@/domain/modelosTreino";
import { catalogo } from "@/data/catalogo";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import { usePlano } from "@/hooks/usePlano";

export const plural = (n: number, singular: string, varios: string) => `${n} ${n === 1 ? singular : varios}`;

interface PreviaDoModeloProps {
  modelo: ModeloTreino;
  rotuloUsar?: string;
}

/**
 * As fichas de um modelo e o botão para virar treinos. Usado nos modelos prontos e na ficha da IA:
 * os dois salvam pelo mesmo caminho, que respeita o limite do plano.
 */
export function PreviaDoModelo({ modelo, rotuloUsar = "Usar este modelo" }: PreviaDoModeloProps) {
  const navigate = useNavigate();
  const { criarTreino } = useMeusTreinos();
  const plano = usePlano();
  const [criando, setCriando] = useState(false);

  const vagas = plano.premium ? Infinity : Math.max(0, LIMITES_GRATUITO.treinos - plano.uso.treinos);
  const fichas = modelo.fichas.length;
  const faltamVagas = !plano.carregando && fichas > vagas;

  const usar = async () => {
    setCriando(true);
    try {
      for (const treino of montarTreinosDoModelo(modelo, catalogo)) {
        await criarTreino(treino);
      }
      toast.success(fichas === 1 ? "Treino criado" : `${fichas} treinos criados`, {
        description: "Ajuste exercícios, séries e dias quando quiser.",
      });
      navigate("/meus-treinos", { replace: true });
    } catch (erro) {
      console.error("Erro ao usar o modelo:", erro);
      toast.error("Não foi possível criar os treinos. Tente de novo.");
      setCriando(false);
    }
  };

  return (
    <div className="space-y-4">
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
            Este modelo tem {plural(fichas, "ficha", "fichas")}, e seu plano tem {plural(vagas, "vaga", "vagas")}.
            Exclua um treino ou escolha um modelo menor.
          </p>
          <Button variant="outline" className="w-full h-11" onClick={() => navigate("/meus-treinos")}>
            Ver meus treinos
          </Button>
        </div>
      ) : (
        <Button className="w-full h-12" disabled={criando || plano.carregando} onClick={() => void usar()}>
          {criando ? "Criando..." : rotuloUsar}
        </Button>
      )}
    </div>
  );
}
