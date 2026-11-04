import { Suspense, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Cabecalho } from "@/components/Cabecalho";
import { EstadoVazio, TelaCarregando } from "@/components/Estados";
import { ErrorState } from "@/components/ErrorState";
import { GraficoLinha } from "@/components/graficos";
import { Indicador } from "@/components/Indicador";
import { exerciciosTreinados, recordesBatidos } from "@/domain/estatisticas";
import { descreverSerie, historicoDoExercicio, pontosEvolucao } from "@/domain/sessao";
import { formatarKg } from "@/domain/texto";
import { usePlano } from "@/hooks/usePlano";
import { useSessoes } from "@/hooks/useSessoes";

const EvolucaoExercicio = () => {
  const navigate = useNavigate();
  const { nome: nomeCodificado } = useParams<{ nome: string }>();
  const nome = decodeURIComponent(nomeCodificado ?? "");
  const { sessoes, loading, erro, recarregar } = useSessoes();
  const { premium } = usePlano();

  const dados = useMemo(() => {
    const resumo = exerciciosTreinados(sessoes).find((e) => e.nome === nome);
    if (!resumo) return null;
    const medida = sessoes
      .flatMap((s) => s.exercicios)
      .find((e) => e.nome === nome)?.medida;
    return {
      resumo,
      medida: medida ?? "carga_reps",
      pontos: pontosEvolucao(sessoes, resumo.exercicioId, nome, premium ? 30 : 10).map((p) => ({
        rotulo: p.data,
        valor: p.peso,
      })),
      historico: historicoDoExercicio(sessoes, resumo.exercicioId, nome, premium ? 500 : 5),
      recordes: recordesBatidos(sessoes).filter((r) => r.nome === nome).length,
    };
  }, [sessoes, nome, premium]);

  if (erro) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar este exercício"
        onTentarNovamente={() => void recarregar()}
      />
    );
  }

  if (loading) return <TelaCarregando />;

  const voltar = () => navigate("/evolucao");

  if (!dados) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto space-y-4">
        <Cabecalho titulo={nome} onVoltar={voltar} />
        <EstadoVazio
          titulo="Sem registros deste exercício"
          descricao="Ele aparece aqui depois do primeiro treino finalizado."
        />
      </div>
    );
  }

  const { resumo, medida, pontos, historico, recordes } = dados;

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
<Cabecalho titulo={nome} onVoltar={voltar} />

      <div className="grid grid-cols-2 gap-3">
        <Indicador
          rotulo="Recorde de carga"
          valor={resumo.melhorPeso !== null ? formatarKg(resumo.melhorPeso) : "Sem carga"}
          nota={
            resumo.melhorPesoData
              ? new Date(resumo.melhorPesoData).toLocaleDateString("pt-BR")
              : undefined
          }
        />
        <Indicador
          rotulo="Treinos"
          valor={String(resumo.vezes)}
          nota={recordes > 0 ? `${recordes} recorde${recordes !== 1 ? "s" : ""} batido${recordes !== 1 ? "s" : ""}` : undefined}
        />
      </div>

      {resumo.melhorPeso !== null && (
        <section aria-label="Evolução de carga" className="glass-card rounded-xl p-4">
          <h2 className="font-semibold mb-2">Maior carga por treino</h2>
          <Suspense fallback={<div className="h-52" />}>
            <GraficoLinha medida="Maior carga" unidade="kg" dados={pontos} />
          </Suspense>
        </section>
      )}

      <section aria-label="Histórico do exercício" className="space-y-2">
        <h2 className="font-semibold">Histórico</h2>
        {!premium && resumo.vezes > historico.length && (
          <p className="text-caption text-muted-foreground">
            Mostrando os últimos {historico.length} de {resumo.vezes} treinos. O histórico completo é do Premium.
          </p>
        )}
        <ul className="glass-card rounded-xl divide-y divide-border/60">
          {historico.map((item) => (
            <li key={item.sessaoId} className="p-3">
              <p className="text-sm font-medium">{new Date(item.data).toLocaleDateString("pt-BR")}</p>
              <p className="text-sm text-muted-foreground">
                {item.series.map((s) => descreverSerie(s, medida)).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default EvolucaoExercicio;
