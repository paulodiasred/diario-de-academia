import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { descreverSerie, type CamposSerie, type SerieSessao } from "@/domain/sessao";
import { paraNumeroOuNulo } from "@/domain/texto";
import type { TipoMedida } from "@/types/catalogo";

interface LinhaSerieProps {
  numero: number;
  serie: SerieSessao;
  medida: TipoMedida;
  anterior?: SerieSessao;
  /** A próxima a fazer é a única com o botão em destaque. */
  proxima: boolean;
  onMudar: (campos: CamposSerie) => void;
  onAlternar: () => void;
}

/** Mesmas colunas de LinhaSerie, para o rótulo ficar sobre o campo certo. */
export function CabecalhoSeries({ medida }: { medida: TipoMedida }) {
  const colunas =
    medida === "carga_reps"
      ? ["KG", "REPS"]
      : medida === "peso_corporal"
        ? ["EXTRA (KG)", "REPS"]
        : medida === "tempo"
          ? ["MIN"]
          : ["MIN", "METROS"];

  return (
    <div aria-hidden className="flex items-center gap-2 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
      <span className="w-5 shrink-0 text-center">#</span>
      <div className="flex flex-1 min-w-0 gap-2">
        {colunas.map((coluna) => (
          <span key={coluna} className="flex-1 min-w-0 text-center">
            {coluna}
          </span>
        ))}
      </div>
      <span className="w-12 shrink-0" />
    </div>
  );
}

interface CampoProps {
  rotulo: string;
  valor: number | null;
  desativado: boolean;
  decimal?: boolean;
  onMudar: (valor: number | null) => void;
}

function Campo({ rotulo, valor, desativado, decimal = true, onMudar }: CampoProps) {
  return (
    <Input
      type="number"
      inputMode={decimal ? "decimal" : "numeric"}
      min={0}
      step="any"
      aria-label={rotulo}
      value={valor ?? ""}
      disabled={desativado}
      onChange={(e) => onMudar(paraNumeroOuNulo(e.target.value))}
      onFocus={(e) => e.target.select()}
      className="h-12 min-w-0 flex-1 text-center text-xl font-bold tabular-nums bg-secondary/40 px-1 disabled:opacity-100 disabled:border-transparent disabled:bg-transparent"
    />
  );
}

export function LinhaSerie({
  numero,
  serie,
  medida,
  anterior,
  proxima,
  onMudar,
  onAlternar,
}: LinhaSerieProps) {
  const feita = serie.concluida;
  const nomeSerie = `série ${numero}`;
  const comReps = medida === "carga_reps" || medida === "peso_corporal";

  const estiloBotao = feita
    ? "bg-primary/20 text-primary"
    : proxima
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-muted-foreground";

  return (
    <div className={`rounded-lg p-2 transition-colors ${feita ? "bg-primary/10" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="w-5 text-center text-sm font-bold text-muted-foreground shrink-0">
          {numero}
        </span>

        <div className="flex flex-1 min-w-0 gap-2">
          {comReps && (
            <Campo
              rotulo={
                medida === "peso_corporal"
                  ? `Carga extra da ${nomeSerie} em kg`
                  : `Peso da ${nomeSerie} em kg`
              }
              valor={serie.peso}
              desativado={feita}
              onMudar={(peso) => onMudar({ peso })}
            />
          )}
          {comReps && (
            <Campo
              rotulo={`Repetições da ${nomeSerie}`}
              valor={serie.reps}
              desativado={feita}
              decimal={false}
              onMudar={(reps) => onMudar({ reps })}
            />
          )}
          {!comReps && (
            <Campo
              rotulo={`Minutos da ${nomeSerie}`}
              valor={serie.duracaoSeg === null ? null : serie.duracaoSeg / 60}
              desativado={feita}
              onMudar={(minutos) =>
                onMudar({ duracaoSeg: minutos === null ? null : Math.round(minutos * 60) })
              }
            />
          )}
          {medida === "distancia" && (
            <Campo
              rotulo={`Metros da ${nomeSerie}`}
              valor={serie.distanciaM}
              desativado={feita}
              onMudar={(distanciaM) => onMudar({ distanciaM })}
            />
          )}
        </div>

        <button
          type="button"
          aria-label={feita ? `Desfazer ${nomeSerie}` : `Concluir ${nomeSerie}`}
          aria-pressed={feita}
          onClick={onAlternar}
          className={`h-12 w-12 shrink-0 rounded-lg flex items-center justify-center transition-colors ${estiloBotao}`}
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {anterior && (
        <p className="pl-7 mt-1 text-[13px] text-muted-foreground">
          Última vez: {descreverSerie(anterior, medida)}
        </p>
      )}
    </div>
  );
}
