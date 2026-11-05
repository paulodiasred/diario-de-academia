import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  COTA_MENSAL_DE_ANALISES,
  DIAS_DA_ANALISE,
  MINIMO_DE_TREINOS,
  treinosDoPeriodo,
} from "@/domain/analiseTreinos";
import type { Sessao } from "@/domain/sessao";
import { useAnaliseIA } from "@/hooks/useAnaliseIA";

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{titulo}</h3>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** Só aparece no Premium. Quem garante plano, cota e mínimo de treinos é a Cloud Function. */
export function AnaliseTreinos({ sessoes }: { sessoes: Sessao[] }) {
  const { analise, carregando, restantes, gerando, gerar, apagando, apagar } = useAnaliseIA();
  const [confirmar, setConfirmar] = useState(false);

  const treinos = treinosDoPeriodo(sessoes);
  const faltamTreinos = treinos < MINIMO_DE_TREINOS;
  const semCota = restantes === 0;

  // Quem já tem uma análise guardada já viu e aceitou o aviso.
  const pedir = () => (analise ? gerar() : setConfirmar(true));

  return (
    <section aria-label="Análise com IA" className="glass-card rounded-xl p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" aria-hidden />
        Análise com IA
      </h2>

      {analise && (
        <div className="space-y-3">
          <p className="text-sm">{analise.resumo}</p>
          <Lista titulo="O que evoluiu" itens={analise.evolucao} />
          <Lista titulo="Pontos de atenção" itens={analise.atencao} />
          <Lista titulo="Para considerar" itens={analise.sugestoes} />
          <p className="text-caption text-muted-foreground">
            Gerada por IA em {new Date(analise.criadaEm).toLocaleDateString("pt-BR")}, a partir dos seus números.
            Pode errar, e não substitui a orientação de um profissional.
          </p>
        </div>
      )}

      {!analise && !carregando && (
        <p className="text-sm text-muted-foreground">
          Uma leitura do que mudou nos seus últimos {DIAS_DA_ANALISE} dias, com base nos seus números.
        </p>
      )}

      {faltamTreinos ? (
        <p className="text-sm text-muted-foreground">
          Faça pelo menos {MINIMO_DE_TREINOS} treinos em {DIAS_DA_ANALISE} dias para gerar uma análise. Você fez{" "}
          {treinos} até agora.
        </p>
      ) : (
        <div className="space-y-2">
          <Button className="w-full" disabled={carregando || gerando || semCota} onClick={pedir}>
            {gerando ? "Analisando..." : `Analisar meus últimos ${DIAS_DA_ANALISE} dias`}
          </Button>
          <p role="status" className="text-caption text-muted-foreground text-center">
            {semCota
              ? "Você usou todas as análises deste mês."
              : `${restantes} de ${COTA_MENSAL_DE_ANALISES} análises disponíveis este mês.`}
          </p>
        </div>
      )}

      {analise && (
        <Button variant="ghost" className="w-full" disabled={apagando || gerando} onClick={apagar}>
          Apagar análise
        </Button>
      )}

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar seus números para a IA?</AlertDialogTitle>
            <AlertDialogDescription>
              Enviamos à Anthropic, empresa que opera a IA, os totais do período e o nome, as cargas e as repetições
              dos seus exercícios. Seu nome, seu email, suas observações e os nomes dos seus treinos não são enviados.
              A empresa fica fora do Brasil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Agora não</AlertDialogCancel>
            <AlertDialogAction onClick={gerar}>Enviar e analisar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
