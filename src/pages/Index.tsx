import { Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Flame, Plus, Settings, Trophy } from "lucide-react";
import { AjustesSheet } from "@/components/AjustesSheet";
import { Cabecalho } from "@/components/Cabecalho";
import { EstadoVazio, TelaCarregando } from "@/components/Estados";
import { ErrorState } from "@/components/ErrorState";
import { GraficoColunas } from "@/components/graficos";
import { Indicador } from "@/components/Indicador";
import { BannerSessaoAtiva } from "@/components/treino/BannerSessaoAtiva";
import { BotaoIniciarTreino } from "@/components/treino/BotaoIniciarTreino";
import { Button } from "@/components/ui/button";
import {
  proximoTreino,
  recordesBatidos,
  resumoDoMes,
  semanasRecentes,
  sequenciaDeSemanas,
  treinosDaSemana,
} from "@/domain/estatisticas";
import { formatarDuracao, formatarKg } from "@/domain/texto";
import { useAuth } from "@/hooks/useAuth";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import { usePerfil } from "@/hooks/usePerfil";
import { useSessoes } from "@/hooks/useSessoes";

const quandoEm = (emDias: number, dia: string) => {
  if (emDias === 0) return "Hoje";
  if (emDias === 1) return "Amanhã";
  return dia;
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const treinos = useMeusTreinos();
  const { sessoes, loading, erro, recarregar } = useSessoes();
  const { metaSemanal } = usePerfil();
  const [ajustesAbertos, setAjustesAbertos] = useState(false);

  const painel = useMemo(() => {
    const agora = new Date();
    return {
      naSemana: treinosDaSemana(sessoes, agora),
      sequencia: sequenciaDeSemanas(sessoes, agora),
      mes: resumoDoMes(sessoes, agora),
      proximo: proximoTreino(treinos.treinos, sessoes, agora),
      recordes: recordesBatidos(sessoes).slice(0, 3),
      volume: semanasRecentes(sessoes, agora).map((s) => ({ rotulo: s.rotulo, valor: s.volumeKg })),
    };
  }, [sessoes, treinos.treinos]);

  if (treinos.erro || erro) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar seus treinos"
        onTentarNovamente={() => {
          void treinos.recarregar();
          void recarregar();
        }}
      />
    );
  }

  if (treinos.loading || loading) return <TelaCarregando />;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  // Sem nome no cadastro, cumprimenta sem nome: o email não é um nome.
  const primeiroNome = user?.displayName?.split(" ")[0];
  const hojeExtenso = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const ultimo = sessoes.find((s) => s.finalizadaEm);
  const { naSemana, sequencia, mes, proximo, recordes, volume } = painel;
  const progressoMeta = metaSemanal ? Math.min(100, (naSemana / metaSemanal) * 100) : 0;

  return (
    <div className="min-h-screen p-4 pb-28 max-w-md mx-auto space-y-5">
      <Cabecalho titulo={primeiroNome ? `${saudacao}, ${primeiroNome}!` : `${saudacao}!`} subtitulo={hojeExtenso}>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Ajustes"
          onClick={() => setAjustesAbertos(true)}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </Cabecalho>

      <BannerSessaoAtiva />

      {treinos.treinos.length === 0 && (
        <EstadoVazio
          titulo="Monte seu primeiro treino"
          descricao="Comece com um modelo pronto ou passe a sua ficha para cá."
        >
          <div className="flex flex-col gap-2">
            <Button className="h-11" onClick={() => navigate("/meus-treinos/modelos")}>
              Escolher um modelo
            </Button>
            <Button variant="outline" className="h-11 gap-1.5" onClick={() => navigate("/meus-treinos/criar")}>
              <Plus className="w-4 h-4" />
              Criar treino
            </Button>
          </div>
        </EstadoVazio>
      )}

      {proximo && (
        <section aria-label="Próximo treino" className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-muted-foreground">
              Próximo treino · {quandoEm(proximo.emDias, proximo.dia)}
            </p>
            <h2 className="font-semibold truncate">{proximo.treino.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {proximo.treino.exercicios.length} exercício
              {proximo.treino.exercicios.length !== 1 ? "s" : ""}
            </p>
          </div>
          <BotaoIniciarTreino treino={proximo.treino} destaque className="h-11" />
        </section>
      )}

      {treinos.treinos.length > 0 && !proximo && (
        <p className="text-sm text-muted-foreground">
          Nenhum treino tem dia definido. Escolha os dias ao editar um treino para vê-lo aqui.
        </p>
      )}

      {/* Semana */}
      <section aria-label="Esta semana" className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Esta semana</h2>
          {sequencia > 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Flame className="w-4 h-4 text-warning" aria-hidden />
              {sequencia} semana{sequencia !== 1 ? "s" : ""} seguida{sequencia !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {metaSemanal ? (
          <>
            <p className="text-2xl font-semibold">
              {naSemana} de {metaSemanal}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                treino{metaSemanal !== 1 ? "s" : ""}
              </span>
            </p>
            <div
              role="progressbar"
              aria-label="Meta semanal"
              aria-valuemin={0}
              aria-valuemax={metaSemanal}
              aria-valuenow={Math.min(naSemana, metaSemanal)}
              className="h-2 rounded-full bg-secondary overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressoMeta}%` }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-2xl font-semibold">
              {naSemana}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                treino{naSemana !== 1 ? "s" : ""}
              </span>
            </p>
            <Button variant="outline" className="h-11" onClick={() => setAjustesAbertos(true)}>
              Definir meta
            </Button>
          </div>
        )}
      </section>

      {ultimo && (
        <>
          {/* Mês */}
          <section aria-label="Resumo do mês" className="space-y-2">
            <h2 className="font-semibold">Neste mês</h2>
            <div className="grid grid-cols-2 gap-3">
              <Indicador rotulo="Treinos" valor={String(mes.treinos)} />
              <Indicador rotulo="Volume" valor={formatarKg(mes.volumeKg)} />
              <Indicador rotulo="Séries" valor={String(mes.series)} />
              <Indicador rotulo="Tempo" valor={formatarDuracao(mes.tempoSeg)} />
            </div>
          </section>

          {/* Volume */}
          <section aria-label="Volume por semana" className="glass-card rounded-xl p-4">
            <h2 className="font-semibold mb-2">Volume por semana</h2>
            <Suspense fallback={<div className="h-44" />}>
              <GraficoColunas
                medida="Volume"
                unidade="kg"
                dados={volume}
                vazio="O volume aparece quando você registra carga e repetições."
              />
            </Suspense>
          </section>

          {recordes.length > 0 && (
            <section aria-label="Recordes recentes" className="glass-card rounded-xl p-4 space-y-2">
              <h2 className="font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-warning" aria-hidden />
                Recordes recentes
              </h2>
              {recordes.map((r) => (
                <p key={`${r.nome}-${r.data}`} className="text-sm flex justify-between gap-3">
                  <span className="truncate">{r.nome}</span>
                  <span className="shrink-0 font-medium">{formatarKg(r.peso)}</span>
                </p>
              ))}
            </section>
          )}

          <section aria-label="Último treino" className="space-y-2">
            <h2 className="font-semibold">Último treino</h2>
            <button
              type="button"
              onClick={() => navigate(`/treino/resumo/${ultimo.id}`, { state: { deHistorico: true } })}
              className="w-full glass-card rounded-xl p-4 flex items-center gap-3 text-left"
            >
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{ultimo.nome}</span>
                <span className="block text-sm text-muted-foreground">
                  {new Date(ultimo.iniciadaEm).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden />
            </button>
          </section>
        </>
      )}

      <AjustesSheet aberto={ajustesAbertos} onFechar={() => setAjustesAbertos(false)} />
    </div>
  );
};

export default Index;
