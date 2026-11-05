import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Flame, Plus, Settings, Trophy } from "lucide-react";
import { AjustesSheet } from "@/components/AjustesSheet";
import { Cabecalho } from "@/components/Cabecalho";
import { EstadoVazio, TelaCarregando } from "@/components/Estados";
import { ErrorState } from "@/components/ErrorState";
import { BotaoIniciarTreino } from "@/components/treino/BotaoIniciarTreino";
import { Button } from "@/components/ui/button";
import {
  diasDaSemanaAtual,
  recordesRecentes,
  resumoDoMes,
  sequenciaDeSemanas,
  sugerirTreino,
  treinosDaSemana,
} from "@/domain/estatisticas";
import { formatarDuracao, formatarVolume } from "@/domain/texto";
import { useAuth } from "@/hooks/useAuth";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import { usePerfil } from "@/hooks/usePerfil";
import { useSessoes } from "@/hooks/useSessoes";

const descreverDia = (feito: boolean, previsto: boolean) => {
  if (feito) return "treino feito";
  return previsto ? "treino previsto" : "sem treino";
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
      semana: diasDaSemanaAtual(treinos.treinos, sessoes, agora),
      mes: resumoDoMes(sessoes, agora),
      sugerido: sugerirTreino(treinos.treinos, sessoes, agora),
      recordes: recordesRecentes(sessoes).slice(0, 3),
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
  const dataExtensa = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hojeExtenso = dataExtensa.charAt(0).toUpperCase() + dataExtensa.slice(1);
  const ultimo = sessoes.find((s) => s.finalizadaEm);
  const treinoDoUltimo = ultimo && treinos.treinos.find((t) => t.id === ultimo.treinoId);
  const { naSemana, sequencia, semana, mes, sugerido, recordes } = painel;
  const progressoMeta = metaSemanal ? Math.min(100, (naSemana / metaSemanal) * 100) : 0;
  const partesDoMes = [
    `${mes.treinos} treino${mes.treinos !== 1 ? "s" : ""}`,
    ...(mes.volumeKg > 0 ? [formatarVolume(mes.volumeKg)] : []),
    ...(mes.tempoSeg > 0 ? [formatarDuracao(mes.tempoSeg)] : []),
  ];

  return (
    <div className="min-h-screen p-4 pb-28 max-w-md mx-auto space-y-4">
      <Cabecalho titulo={primeiroNome ? `${saudacao}, ${primeiroNome}!` : `${saudacao}!`} subtitulo={hojeExtenso}>
        <Button variant="ghost" size="icon" aria-label="Ajustes" onClick={() => setAjustesAbertos(true)}>
          <Settings />
        </Button>
      </Cabecalho>

      {treinos.treinos.length === 0 && (
        <EstadoVazio
          titulo="Monte seu primeiro treino"
          descricao="Comece com um modelo pronto ou passe a sua ficha para cá."
        >
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/meus-treinos/modelos")}>Escolher um modelo</Button>
            <Button variant="outline" className="gap-1.5" onClick={() => navigate("/meus-treinos/criar")}>
              <Plus className="w-4 h-4" />
              Criar treino
            </Button>
          </div>
        </EstadoVazio>
      )}

      {/* O próximo passo vem primeiro: é para isso que a pessoa abriu o app. */}
      {sugerido && (
        <section aria-label="Próximo treino" className="glass-card rounded-xl p-4 space-y-3">
          <div>
            <p className="text-caption text-muted-foreground">{sugerido.contexto}</p>
            <h2 className="text-lg font-semibold leading-tight">{sugerido.treino.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {sugerido.treino.exercicios.length} exercício
              {sugerido.treino.exercicios.length !== 1 ? "s" : ""}
            </p>
          </div>
          <BotaoIniciarTreino treino={sugerido.treino} destaque className="w-full h-12" />
          {treinos.treinos.length > 1 && (
            <Button variant="ghost" className="w-full" onClick={() => navigate("/meus-treinos")}>
              Escolher outro treino
            </Button>
          )}
        </section>
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

        <ul className="grid grid-cols-7 gap-1">
          {semana.map((dia) => (
            <li key={dia.chave} className="flex flex-col items-center gap-1">
              <span
                aria-hidden
                className={`text-caption ${dia.hoje ? "font-bold text-foreground" : "text-muted-foreground"}`}
              >
                {dia.inicial}
              </span>
              <span
                aria-hidden
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  dia.feito
                    ? "bg-primary text-primary-foreground"
                    : dia.previsto
                      ? "border-2 border-primary"
                      : "bg-surface-3"
                }`}
              >
                {dia.feito && <Check className="w-4 h-4" />}
              </span>
              <span className="sr-only">
                {dia.nome}: {descreverDia(dia.feito, dia.previsto)}
                {dia.hoje ? " (hoje)" : ""}
              </span>
            </li>
          ))}
        </ul>

        {metaSemanal ? (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold">
                {naSemana} de {metaSemanal}
              </span>{" "}
              <span className="text-muted-foreground">treino{metaSemanal !== 1 ? "s" : ""} da meta</span>
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
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold">{naSemana}</span>{" "}
              <span className="text-muted-foreground">treino{naSemana !== 1 ? "s" : ""}</span>
            </p>
            <Button variant="outline" onClick={() => setAjustesAbertos(true)}>
              Definir meta
            </Button>
          </div>
        )}
      </section>

      {recordes.length > 0 && (
        <section aria-label="Recordes recentes" className="glass-card rounded-xl p-4 space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" aria-hidden />
            Recordes recentes
          </h2>
          {recordes.map((r) => (
            <div key={`${r.nome}-${r.data}`} className="text-sm flex justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate">{r.nome}</span>
                <span className="block text-caption text-muted-foreground">
                  {new Date(r.data).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <span className="shrink-0 font-medium">{r.valor}</span>
            </div>
          ))}
        </section>
      )}

      {ultimo && (
        <section aria-label="Último treino" className="space-y-2">
          <h2 className="font-semibold">Último treino</h2>
          <div className="glass-card rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => navigate(`/treino/resumo/${ultimo.id}`, { state: { deHistorico: true } })}
              className="flex-1 min-w-0 p-4 flex items-center gap-3 text-left"
            >
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{ultimo.nome}</span>
                <span className="block text-sm text-muted-foreground">
                  {new Date(ultimo.iniciadaEm).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
            </button>
            {treinoDoUltimo && (
              <div className="pr-3 shrink-0">
                <BotaoIniciarTreino treino={treinoDoUltimo} rotulo="Repetir" />
              </div>
            )}
          </div>
        </section>
      )}

      {ultimo && (
        <section aria-label="Resumo do mês">
          <button
            type="button"
            onClick={() => navigate("/evolucao")}
            className="w-full glass-card rounded-xl p-4 flex items-center gap-3 text-left"
          >
            <span className="flex-1 min-w-0">
              <span className="block font-semibold">Neste mês</span>
              <span className="block text-sm text-muted-foreground">{partesDoMes.join(" · ")}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
          </button>
        </section>
      )}

      <AjustesSheet aberto={ajustesAbertos} onFechar={() => setAjustesAbertos(false)} />
    </div>
  );
};

export default Index;
