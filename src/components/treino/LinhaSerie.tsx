import type { KeyboardEvent } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { descreverSerie, type CamposSerie, type SerieSessao } from "@/domain/sessao";
import { juntarTempo, paraNumeroOuNulo, partesDoTempo } from "@/domain/texto";
import type { TipoMedida } from "@/types/catalogo";

interface LinhaSerieProps {
  numero: number;
  serie: SerieSessao;
  medida: TipoMedida;
  anterior?: SerieSessao;
  /** A próxima a fazer é a única com o botão em destaque e com os ajustes rápidos. */
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
          ? ["MIN", "SEG"]
          : ["MIN", "SEG", "METROS"];

  return (
    <div aria-hidden className="flex items-center gap-2 px-2 text-micro font-semibold tracking-wide text-muted-foreground">
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

/** Enter leva ao campo seguinte da série; no último, fecha o teclado. */
function avancarCampo(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const campos = [...(e.currentTarget.closest("[data-serie]")?.querySelectorAll("input") ?? [])];
  const seguinte = campos[campos.indexOf(e.currentTarget) + 1];
  if (seguinte) seguinte.focus();
  else e.currentTarget.blur();
}

const somar = (valor: number | null, delta: number) =>
  Math.max(0, Math.round(((valor ?? 0) + delta) * 100) / 100);

interface CampoProps {
  /** Nome completo, para quem usa leitor de tela: "Peso da série 1 em kg". */
  rotulo: string;
  /** Nome curto dos botões: "peso da série 1". */
  nomeAjuste: string;
  valor: number | null;
  passo: number;
  mostrarAjustes: boolean;
  feita: boolean;
  ultimo?: boolean;
  decimal?: boolean;
  onMudar: (valor: number | null) => void;
}

function Campo({ rotulo, nomeAjuste, valor, passo, mostrarAjustes, feita, ultimo = false, decimal = true, onMudar }: CampoProps) {
  return (
    <div className="flex-1 min-w-0 space-y-1">
      <Input
        type="number"
        inputMode={decimal ? "decimal" : "numeric"}
        enterKeyHint={ultimo ? "done" : "next"}
        min={0}
        step="any"
        aria-label={rotulo}
        value={valor ?? ""}
        onChange={(e) => onMudar(paraNumeroOuNulo(e.target.value))}
        onKeyDown={avancarCampo}
        onFocus={(e) => e.target.select()}
        className={`h-12 text-center text-xl font-bold tabular-nums px-1 ${
          feita ? "border-transparent bg-transparent" : "bg-surface-2"
        }`}
      />
      {mostrarAjustes && (
        <div className="flex gap-1">
          <button
            type="button"
            aria-label={`Diminuir ${nomeAjuste}`}
            onClick={() => onMudar(somar(valor, -passo))}
            className="h-10 flex-1 min-w-0 rounded-lg bg-secondary flex items-center justify-center"
          >
            <Minus aria-hidden className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={`Aumentar ${nomeAjuste}`}
            onClick={() => onMudar(somar(valor, passo))}
            className="h-10 flex-1 min-w-0 rounded-lg bg-secondary flex items-center justify-center"
          >
            <Plus aria-hidden className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function LinhaSerie({ numero, serie, medida, anterior, proxima, onMudar, onAlternar }: LinhaSerieProps) {
  const feita = serie.concluida;
  const nomeSerie = `série ${numero}`;
  const comReps = medida === "carga_reps" || medida === "peso_corporal";
  const tempo = serie.duracaoSeg === null ? null : partesDoTempo(serie.duracaoSeg);
  const comuns = { mostrarAjustes: proxima && !feita, feita };

  const estiloBotao = feita
    ? "bg-primary/20 text-primary"
    : proxima
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-muted-foreground";

  return (
    <div data-serie={numero} className={`rounded-lg p-1.5 transition-colors ${feita ? "bg-primary/10" : ""}`}>
      <div className="flex items-start gap-2">
        <span className="w-5 h-12 flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
          {numero}
        </span>

        <div className="flex flex-1 min-w-0 gap-2">
          {comReps && (
            <Campo
              {...comuns}
              rotulo={
                medida === "peso_corporal"
                  ? `Carga extra da ${nomeSerie} em kg`
                  : `Peso da ${nomeSerie} em kg`
              }
              nomeAjuste={`peso da ${nomeSerie}`}
              valor={serie.peso}
              passo={2.5}
              onMudar={(peso) => onMudar({ peso })}
            />
          )}
          {comReps && (
            <Campo
              {...comuns}
              rotulo={`Repetições da ${nomeSerie}`}
              nomeAjuste={`repetições da ${nomeSerie}`}
              valor={serie.reps}
              passo={1}
              decimal={false}
              ultimo
              onMudar={(reps) => onMudar({ reps })}
            />
          )}
          {!comReps && (
            <Campo
              {...comuns}
              rotulo={`Minutos da ${nomeSerie}`}
              nomeAjuste={`minutos da ${nomeSerie}`}
              valor={tempo?.minutos ?? null}
              passo={1}
              decimal={false}
              onMudar={(minutos) => onMudar({ duracaoSeg: juntarTempo(minutos, tempo?.segundos ?? null) })}
            />
          )}
          {!comReps && (
            <Campo
              {...comuns}
              rotulo={`Segundos da ${nomeSerie}`}
              nomeAjuste={`segundos da ${nomeSerie}`}
              valor={tempo?.segundos ?? null}
              passo={15}
              decimal={false}
              ultimo={medida !== "distancia"}
              onMudar={(segundos) => onMudar({ duracaoSeg: juntarTempo(tempo?.minutos ?? null, segundos) })}
            />
          )}
          {medida === "distancia" && (
            <Campo
              {...comuns}
              rotulo={`Metros da ${nomeSerie}`}
              nomeAjuste={`metros da ${nomeSerie}`}
              valor={serie.distanciaM}
              passo={100}
              ultimo
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

      {anterior && proxima && !feita && (
        <p className="pl-7 mt-1 text-caption text-muted-foreground">
          Última vez: {descreverSerie(anterior, medida)}
        </p>
      )}
    </div>
  );
}
