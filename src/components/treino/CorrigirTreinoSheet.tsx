import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "@/lib/aviso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  atualizarSerie,
  removerSerieDoHistorico,
  validarCorrecao,
  type ErroCorrecao,
  type Sessao,
} from "@/domain/sessao";
import { paraNumeroOuNulo } from "@/domain/texto";

interface CampoCorrecaoProps {
  rotulo: string;
  valor: number | null;
  invalido?: boolean;
  onMudar: (valor: number | null) => void;
}

function CampoCorrecao({ rotulo, valor, invalido = false, onMudar }: CampoCorrecaoProps) {
  return (
    <label className="flex-1 min-w-0 text-caption text-muted-foreground">
      {rotulo}
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        aria-invalid={invalido}
        value={valor ?? ""}
        onChange={(e) => onMudar(paraNumeroOuNulo(e.target.value))}
        onFocus={(e) => e.target.select()}
        className={`mt-1 h-11 px-2 text-center text-base font-semibold tabular-nums ${invalido ? "border-destructive" : ""}`}
      />
    </label>
  );
}

const MENSAGEM_ERRO: Record<ErroCorrecao["erro"], string> = {
  peso: "Confira o peso desta série",
  reps: "Informe as repetições desta série",
};

interface CorrigirTreinoSheetProps {
  sessao: Sessao;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (corrigida: Sessao) => void;
}

/** Corrige um treino já finalizado: valores digitados errado e séries que não aconteceram. */
export function CorrigirTreinoSheet({ sessao, aberto, onFechar, onSalvar }: CorrigirTreinoSheetProps) {
  const [rascunho, setRascunho] = useState(sessao);
  const [erro, setErro] = useState<ErroCorrecao | null>(null);

  // Sempre parte do que está salvo: cancelar uma correção não deixa sobra na próxima.
  useEffect(() => {
    if (aberto) {
      setRascunho(sessao);
      setErro(null);
    }
  }, [aberto, sessao]);

  const salvar = () => {
    const problema = validarCorrecao(rascunho);
    setErro(problema);
    if (problema) {
      toast.error(MENSAGEM_ERRO[problema.erro]);
      return;
    }
    onSalvar(rascunho);
  };

  const mudar = (exercicio: number, serie: number, campos: Parameters<typeof atualizarSerie>[3]) => {
    setErro(null);
    setRascunho((atual) => atualizarSerie(atual, exercicio, serie, campos));
  };

  const semSeries = rascunho.exercicios.length === 0;

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">Corrigir treino</SheetTitle>
        </SheetHeader>

        <p className="pt-1 text-sm text-muted-foreground">
          Recordes, gráficos e metas são recalculados com os novos valores.
        </p>

        <div className="pt-4 space-y-5">
          {rascunho.exercicios.map((e, i) => {
            const comReps = e.medida === "carga_reps" || e.medida === "peso_corporal";
            return (
              <section key={`${e.exercicioId}-${i}`} aria-label={e.nome} className="space-y-2">
                <h3 className="font-semibold text-sm">{e.nome}</h3>
                {e.series.map((s, j) => {
                  const nome = `série ${j + 1} de ${e.nome}`;
                  const comErro = erro?.exercicio === i && erro.serie === j ? erro.erro : null;
                  return (
                    <div key={j} className="flex items-end gap-2">
                      <span className="w-5 pb-3 text-center text-sm font-bold text-muted-foreground shrink-0">
                        {j + 1}
                      </span>
                      {comReps && (
                        <CampoCorrecao
                          rotulo={e.medida === "peso_corporal" ? "Extra (kg)" : "Peso (kg)"}
                          valor={s.peso}
                          invalido={comErro === "peso"}
                          onMudar={(peso) => mudar(i, j, { peso })}
                        />
                      )}
                      {comReps && (
                        <CampoCorrecao
                          rotulo="Repetições"
                          valor={s.reps}
                          invalido={comErro === "reps"}
                          onMudar={(reps) => mudar(i, j, { reps })}
                        />
                      )}
                      {!comReps && (
                        <CampoCorrecao
                          rotulo="Segundos"
                          valor={s.duracaoSeg}
                          onMudar={(duracaoSeg) => mudar(i, j, { duracaoSeg })}
                        />
                      )}
                      {e.medida === "distancia" && (
                        <CampoCorrecao
                          rotulo="Metros"
                          valor={s.distanciaM}
                          onMudar={(distanciaM) => mudar(i, j, { distanciaM })}
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-destructive"
                        aria-label={`Remover ${nome}`}
                        onClick={() => {
                          setErro(null);
                          setRascunho((atual) => removerSerieDoHistorico(atual, i, j));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </section>
            );
          })}

          {semSeries && (
            <p role="status" className="text-sm text-muted-foreground">
              Nenhuma série restante. Para apagar o treino, feche e use "Excluir treino".
            </p>
          )}

          <Button className="w-full h-12" disabled={semSeries} onClick={salvar}>
            Salvar correção
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
