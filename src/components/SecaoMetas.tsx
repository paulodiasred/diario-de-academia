import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampoSelect } from "@/components/ui/campo-select";
import { Input } from "@/components/ui/input";
import { exerciciosTreinados } from "@/domain/estatisticas";
import { progressoDaMeta, TIPO_META_LABEL, type TipoMeta } from "@/domain/metas";
import type { Sessao } from "@/domain/sessao";
import { useMetas } from "@/hooks/useMetas";
import { toast } from "@/lib/aviso";

const UNIDADE: Record<TipoMeta, string> = {
  carga: "kg",
  treinos_mes: "treinos",
  volume_mes: "kg",
};

export function SecaoMetas({ sessoes }: { sessoes: Sessao[] }) {
  const { metas, adicionar, remover } = useMetas();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoMeta>("carga");
  const [alvo, setAlvo] = useState("");
  const [exercicio, setExercicio] = useState("");

  const exercicios = useMemo(() => exerciciosTreinados(sessoes).filter((e) => e.melhorPeso !== null), [sessoes]);

  const salvar = () => {
    const valor = Number(alvo.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }
    if (tipo === "carga" && !exercicio) {
      toast.error("Escolha o exercício");
      return;
    }
    adicionar({ tipo, alvo: valor, exercicioNome: tipo === "carga" ? exercicio : null });
    setAberto(false);
    setAlvo("");
  };

  return (
    <section aria-label="Metas" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Metas</h2>
        <Button variant="outline" className="h-11 gap-1.5" onClick={() => setAberto(true)}>
          <Plus className="w-4 h-4" />
          Nova meta
        </Button>
      </div>

      {metas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Defina uma carga, um volume ou uma quantidade de treinos para acompanhar.</p>
      ) : (
        <ul className="glass-card rounded-xl divide-y divide-border/60">
          {metas.map((meta) => {
            const progresso = progressoDaMeta(meta, sessoes);
            return (
              <li key={meta.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="flex-1 min-w-0 text-sm font-medium">{progresso.descricao}</p>
                  <button
                    type="button"
                    aria-label={`Excluir meta: ${progresso.descricao}`}
                    onClick={() => remover(meta.id)}
                    className="h-11 w-11 -my-2 -mr-2 flex items-center justify-center text-muted-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div
                  role="progressbar"
                  aria-label={progresso.descricao}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progresso.percentual}
                  className="h-2 rounded-full bg-secondary overflow-hidden"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progresso.percentual}%` }} />
                </div>
                <p className="text-caption text-muted-foreground">
                  {progresso.concluida
                    ? "Meta alcançada"
                    : `${progresso.atual.toLocaleString("pt-BR")} de ${progresso.alvo.toLocaleString("pt-BR")} ${UNIDADE[meta.tipo]}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="meta-tipo" className="text-sm text-muted-foreground mb-1 block">
                Tipo
              </label>
              <CampoSelect
                id="meta-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoMeta)}
              >
                {Object.entries(TIPO_META_LABEL).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </CampoSelect>
            </div>
            {tipo === "carga" && (
              <div>
                <label htmlFor="meta-exercicio" className="text-sm text-muted-foreground mb-1 block">
                  Exercício
                </label>
                <CampoSelect
                  id="meta-exercicio"
                  value={exercicio}
                  onChange={(e) => setExercicio(e.target.value)}
                >
                  <option value="">Escolha</option>
                  {exercicios.map((e) => (
                    <option key={e.nome} value={e.nome}>
                      {e.nome}
                    </option>
                  ))}
                </CampoSelect>
              </div>
            )}
            <div>
              <label htmlFor="meta-alvo" className="text-sm text-muted-foreground mb-1 block">
                Alvo ({UNIDADE[tipo]})
              </label>
              <Input
                id="meta-alvo"
                type="number"
                inputMode="decimal"
                min={0}
                value={alvo}
                onChange={(e) => setAlvo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="h-11 w-full" onClick={salvar}>
              Salvar meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
