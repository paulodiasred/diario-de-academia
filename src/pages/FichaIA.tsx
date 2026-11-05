import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cabecalho } from "@/components/Cabecalho";
import { PreviaDoModelo } from "@/components/treino/PreviaDoModelo";
import { Button } from "@/components/ui/button";
import { lerUsoDeIA, pedirFicha } from "@/data/repositories/analiseRepository";
import {
  AVISO_RESTRICAO,
  COTA_MENSAL_DE_FICHAS,
  OPCOES_FICHA,
  type PreferenciasFicha,
} from "@/domain/fichaIA";
import { useAuth } from "@/hooks/useAuth";
import { usePlano } from "@/hooks/usePlano";
import { toast } from "@/lib/aviso";
import { mensagemDaFuncao } from "@/lib/funcoes";
import { relatarErro } from "@/lib/monitoramento";

type Respostas = Partial<PreferenciasFicha>;

interface Opcao<T> {
  valor: T;
  rotulo: string;
}

function Pergunta<T extends string | number | boolean>({
  titulo,
  opcoes,
  valor,
  aoEscolher,
  colunas = 1,
}: {
  titulo: string;
  opcoes: readonly Opcao<T>[];
  valor: T | undefined;
  aoEscolher: (valor: T) => void;
  colunas?: number;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold text-sm mb-2">{titulo}</legend>
      <div className={colunas > 1 ? "grid grid-cols-5 gap-1.5" : "grid gap-1.5"}>
        {opcoes.map((opcao) => (
          <button
            key={String(opcao.valor)}
            type="button"
            aria-pressed={valor === opcao.valor}
            onClick={() => aoEscolher(opcao.valor)}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium ${
              valor === opcao.valor ? "bg-primary text-primary-foreground" : "bg-secondary"
            } ${colunas > 1 ? "" : "text-left"}`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const DIAS: Opcao<number>[] = [2, 3, 4, 5, 6].map((n) => ({ valor: n, rotulo: String(n) }));
const SIM_NAO: Opcao<boolean>[] = [
  { valor: false, rotulo: "Não" },
  { valor: true, rotulo: "Sim" },
];

const completas = (r: Respostas): r is PreferenciasFicha =>
  r.objetivo !== undefined &&
  r.dias !== undefined &&
  r.local !== undefined &&
  r.experiencia !== undefined &&
  r.restricao !== undefined;

const FALHA = "Não foi possível montar a ficha. Verifique a internet e tente de novo.";

function Aviso({ children }: { children: ReactNode }) {
  return <p className="text-caption text-muted-foreground">{children}</p>;
}

/** Só no Premium. Plano, cota, respostas e restrição de saúde também são conferidos no servidor. */
const FichaIA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.uid as string;
  const { premium, carregando: carregandoPlano } = usePlano();
  const queryClient = useQueryClient();
  const [respostas, setRespostas] = useState<Respostas>({});

  const chaveUso = ["uso-ia", uid];
  const uso = useQuery({ queryKey: chaveUso, queryFn: () => lerUsoDeIA(uid), enabled: !!uid });
  const restantes = Math.max(0, COTA_MENSAL_DE_FICHAS - (uso.data?.fichas ?? 0));

  const montar = useMutation({
    mutationFn: pedirFicha,
    onSettled: () => queryClient.invalidateQueries({ queryKey: chaveUso }),
    onError: (erro) => {
      relatarErro(erro, { acao: "montar ficha" });
      toast.error(mensagemDaFuncao(erro, FALHA));
    },
  });

  const escolher = <K extends keyof PreferenciasFicha>(campo: K) => (valor: PreferenciasFicha[K]) =>
    setRespostas((atual) => ({ ...atual, [campo]: valor }));

  const ficha = montar.data;

  if (!carregandoPlano && !premium) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto space-y-5">
        <Cabecalho titulo="Montar com IA" onVoltar={() => navigate(-1)} />
        <p className="text-sm text-muted-foreground">A ficha montada por IA faz parte do Premium.</p>
        <Button className="w-full h-12" onClick={() => navigate("/planos")}>
          Ver planos
        </Button>
      </div>
    );
  }

  if (ficha) {
    return (
      <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
        <Cabecalho titulo={ficha.nome} subtitulo={ficha.frequencia} onVoltar={() => montar.reset()} />
        <section aria-label="Sobre esta ficha" className="glass-card rounded-xl p-4 space-y-2">
          {ficha.descricao && <p className="text-sm">{ficha.descricao}</p>}
          <Aviso>
            Sugestão gerada por IA a partir das suas respostas, sem avaliação individual. Revise antes de treinar,
            ajuste as cargas ao seu nível e, se puder, peça a um profissional de educação física para conferir. Pare
            se sentir dor.
          </Aviso>
        </section>
        <PreviaDoModelo modelo={ficha} rotuloUsar="Salvar estes treinos" />
        <Button variant="ghost" className="w-full h-11" onClick={() => montar.reset()}>
          Mudar as respostas
        </Button>
      </div>
    );
  }

  const comRestricao = respostas.restricao === true;
  const semCota = !uso.isLoading && restantes === 0;

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
      <Cabecalho
        titulo="Montar com IA"
        subtitulo="Uma sugestão para revisar, não uma prescrição."
        onVoltar={() => navigate(-1)}
      />

      <Pergunta
        titulo="Qual é o seu objetivo principal?"
        opcoes={OPCOES_FICHA.objetivo}
        valor={respostas.objetivo}
        aoEscolher={escolher("objetivo")}
      />
      <Pergunta
        titulo="Quantos dias por semana você vai treinar?"
        opcoes={DIAS}
        valor={respostas.dias}
        aoEscolher={escolher("dias")}
        colunas={5}
      />
      <Pergunta titulo="Onde você treina?" opcoes={OPCOES_FICHA.local} valor={respostas.local} aoEscolher={escolher("local")} />
      <Pergunta
        titulo="Há quanto tempo você treina musculação?"
        opcoes={OPCOES_FICHA.experiencia}
        valor={respostas.experiencia}
        aoEscolher={escolher("experiencia")}
      />
      <Pergunta
        titulo="Você tem alguma lesão, dor ou condição de saúde que limite exercícios?"
        opcoes={SIM_NAO}
        valor={respostas.restricao}
        aoEscolher={escolher("restricao")}
      />

      {comRestricao ? (
        <section role="status" className="glass-card rounded-xl p-4 space-y-3">
          <p className="text-sm">{AVISO_RESTRICAO}</p>
          <Button variant="outline" className="w-full h-11" onClick={() => navigate("/meus-treinos/modelos")}>
            Ver modelos prontos
          </Button>
        </section>
      ) : (
        <div className="space-y-2">
          <Button
            className="w-full h-12"
            disabled={!completas(respostas) || montar.isPending || semCota || uso.isLoading}
            onClick={() => completas(respostas) && montar.mutate(respostas)}
          >
            {montar.isPending ? "Montando..." : "Montar minha ficha"}
          </Button>
          <p role="status" className="text-caption text-muted-foreground text-center">
            {semCota
              ? "Você já montou todas as fichas deste mês."
              : `${restantes} de ${COTA_MENSAL_DE_FICHAS} fichas disponíveis este mês.`}
          </p>
          <Aviso>
            Suas respostas vão para a Anthropic, empresa que opera a IA, fora do Brasil. Nenhum dado da sua conta ou
            dos seus treinos é enviado. Nada é salvo antes de você revisar.
          </Aviso>
        </div>
      )}
    </div>
  );
};

export default FichaIA;
