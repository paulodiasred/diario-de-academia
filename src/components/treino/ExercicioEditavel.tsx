import { Reorder, useDragControls } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { ImagemExercicio } from "@/components/ImagemExercicio";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { medidaDoExercicio } from "@/domain/sessao";
import { formatarKg, formatarTempo } from "@/domain/texto";
import type { ExercicioNoTreino, TipoMedida } from "@/types/catalogo";
import { CATEGORIA_LABEL, MEDIDA_LABEL, MUSCULO_LABEL } from "@/types/catalogo";

interface ContadorProps {
  rotulo: string;
  valor: number;
  sufixo?: string;
  onMudar: (valor: number) => void;
  passo?: number;
  minimo?: number;
  maximo: number;
}

function Contador({ rotulo, valor, sufixo = "", onMudar, passo = 1, minimo = 0, maximo }: ContadorProps) {
  return (
    <div>
      <span className="text-[13px] text-muted-foreground block mb-1">{rotulo}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          className="w-9 h-9 rounded-full bg-secondary/70 text-sm font-bold hover:bg-secondary"
          onClick={() => onMudar(Math.max(minimo, valor - passo))}
        >
          −
        </button>
        <span className="min-w-9 text-center text-sm font-semibold">
          {valor}
          {sufixo}
        </span>
        <button
          type="button"
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          className="w-9 h-9 rounded-full bg-secondary/70 text-sm font-bold hover:bg-secondary"
          onClick={() => onMudar(Math.min(maximo, valor + passo))}
        >
          +
        </button>
      </div>
    </div>
  );
}

const paraNumeroOpcional = (texto: string): number | undefined => {
  if (texto.trim() === "") return undefined;
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) && valor >= 0 ? valor : undefined;
};

/** A configuração em uma linha: é o que permite ler a ficha sem abrir cada exercício. */
function resumirConfiguracao(ex: ExercicioNoTreino): string {
  const medida = medidaDoExercicio(ex);
  const partes: string[] = [];
  if (medida === "carga_reps" || medida === "peso_corporal") {
    partes.push(ex.repsAlvo ? `${ex.series} × ${ex.repsAlvo}` : `${ex.series} séries`);
    if (ex.cargaAlvo) partes.push(formatarKg(ex.cargaAlvo));
  } else {
    partes.push(`${ex.series} ${ex.series === 1 ? "série" : "séries"}`);
    if (ex.duracaoAlvoSeg !== undefined) partes.push(formatarTempo(ex.duracaoAlvoSeg));
    if (ex.distanciaAlvoM !== undefined) partes.push(`${ex.distanciaAlvoM} m`);
  }
  partes.push(`${ex.descanso}s de descanso`);
  return partes.join(" · ");
}

interface ExercicioEditavelProps {
  exercicio: ExercicioNoTreino;
  indice: number;
  total: number;
  aberto: boolean;
  onAlternar: () => void;
  onAtualizar: (campos: Partial<ExercicioNoTreino>) => void;
  onMover: (destino: number) => void;
  onRemover: () => void;
}

export function ExercicioEditavel({
  exercicio: ex,
  indice,
  total,
  aberto,
  onAlternar,
  onAtualizar,
  onMover,
  onRemover,
}: ExercicioEditavelProps) {
  const controlesDeArraste = useDragControls();
  const medida = medidaDoExercicio(ex);
  const comReps = medida === "carga_reps" || medida === "peso_corporal";

  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controlesDeArraste}
      className="glass-card rounded-xl list-none"
    >
      <div className="flex items-center">
        {/* Só para arrastar com o dedo ou o mouse. Pelo teclado, use as setas ao abrir o exercício. */}
        <div
          aria-hidden
          data-testid={`arrastar-${ex.exercicioId}`}
          onPointerDown={(e) => controlesDeArraste.start(e)}
          className="h-14 w-9 shrink-0 flex items-center justify-center text-muted-foreground cursor-grab touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <button
          type="button"
          aria-expanded={aberto}
          aria-label={`${aberto ? "Recolher" : "Configurar"} ${ex.exercicioNome}`}
          onClick={onAlternar}
          className="flex-1 min-w-0 flex items-center gap-2.5 py-2 pr-3 text-left"
        >
          <ImagemExercicio caminho={ex.images?.[0]} alt="" className="w-11 h-11 shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block font-medium text-sm leading-tight">{ex.exercicioNome}</span>
            <span className="block mt-0.5 text-[13px] text-muted-foreground">{resumirConfiguracao(ex)}</span>
          </span>
          <ChevronDown
            aria-hidden
            className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {aberto && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1">
            <div className="flex flex-1 min-w-0 flex-wrap gap-1">
              {ex.primaryMuscles.slice(0, 2).map((m) => (
                <Badge key={m} variant="secondary" className="text-[13px] px-1.5 py-0">
                  {MUSCULO_LABEL[m] ?? m}
                </Badge>
              ))}
              <Badge variant="outline" className="text-[13px] px-1.5 py-0">
                {CATEGORIA_LABEL[ex.category] ?? ex.category}
              </Badge>
            </div>
            <button
              type="button"
              aria-label={`Subir ${ex.exercicioNome}`}
              disabled={indice === 0}
              onClick={() => onMover(indice - 1)}
              className="w-9 h-9 shrink-0 flex items-center justify-center text-muted-foreground disabled:opacity-30"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={`Descer ${ex.exercicioNome}`}
              disabled={indice === total - 1}
              onClick={() => onMover(indice + 1)}
              className="w-9 h-9 shrink-0 flex items-center justify-center text-muted-foreground disabled:opacity-30"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={`Remover ${ex.exercicioNome}`}
              onClick={onRemover}
              className="w-9 h-9 shrink-0 flex items-center justify-center text-destructive/70 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Contador
              rotulo="Séries"
              valor={ex.series}
              minimo={1}
              maximo={20}
              onMudar={(series) => onAtualizar({ series })}
            />
            <Contador
              rotulo="Descanso"
              valor={ex.descanso}
              sufixo="s"
              passo={15}
              maximo={600}
              onMudar={(descanso) => onAtualizar({ descanso })}
            />
          </div>

          <div>
            <label className="text-[13px] text-muted-foreground block mb-1">
              Como medir
              <select
                className="mt-1 h-10 w-full rounded-md border border-input bg-secondary/30 px-2 text-sm text-foreground"
                value={medida}
                onChange={(e) => onAtualizar({ medida: e.target.value as TipoMedida })}
              >
                {Object.entries(MEDIDA_LABEL).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {comReps && (
              <label className="text-[13px] text-muted-foreground">
                Repetições (meta)
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1 h-10 bg-secondary/30"
                  value={ex.repsAlvo ?? ""}
                  onChange={(e) => onAtualizar({ repsAlvo: paraNumeroOpcional(e.target.value) })}
                />
              </label>
            )}
            {comReps && (
              <label className="text-[13px] text-muted-foreground">
                {medida === "peso_corporal" ? "Carga extra (kg)" : "Carga inicial (kg)"}
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="mt-1 h-10 bg-secondary/30"
                  value={ex.cargaAlvo ?? ""}
                  onChange={(e) => onAtualizar({ cargaAlvo: paraNumeroOpcional(e.target.value) })}
                />
              </label>
            )}
            {!comReps && (
              <label className="text-[13px] text-muted-foreground">
                Tempo (min)
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="mt-1 h-10 bg-secondary/30"
                  value={ex.duracaoAlvoSeg === undefined ? "" : ex.duracaoAlvoSeg / 60}
                  onChange={(e) => {
                    const minutos = paraNumeroOpcional(e.target.value);
                    onAtualizar({
                      duracaoAlvoSeg: minutos === undefined ? undefined : Math.round(minutos * 60),
                    });
                  }}
                />
              </label>
            )}
            {medida === "distancia" && (
              <label className="text-[13px] text-muted-foreground">
                Distância (m)
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="mt-1 h-10 bg-secondary/30"
                  value={ex.distanciaAlvoM ?? ""}
                  onChange={(e) => onAtualizar({ distanciaAlvoM: paraNumeroOpcional(e.target.value) })}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}
