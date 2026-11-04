import { ImagemExercicio } from "@/components/ImagemExercicio";
import { EQUIPAMENTO_LABEL, MUSCULO_LABEL, type ExercicioCatalogo } from "@/types/catalogo";

const rotulosMusculos = (musculos: string[]) =>
  musculos.map((m) => MUSCULO_LABEL[m] ?? m).join(", ");

/** Imagens, músculos e passo a passo. Usado na biblioteca e durante o treino. */
export function ExercicioDetalhes({ exercicio }: { exercicio: ExercicioCatalogo }) {
  return (
    <div className="space-y-4">
      {exercicio.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {exercicio.images.map((img, i) => (
            <figure key={img}>
              <ImagemExercicio
                caminho={img}
                alt={`${exercicio.name}, ${i === 0 ? "início" : "fim"} do movimento`}
                className="w-full aspect-square"
              />
              <figcaption className="mt-1 text-center text-caption text-muted-foreground">
                {i === 0 ? "Início" : "Fim"}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <dl className="text-sm space-y-1">
        <div>
          <dt className="inline text-muted-foreground">Principal: </dt>
          <dd className="inline">{rotulosMusculos(exercicio.primaryMuscles)}</dd>
        </div>
        {exercicio.secondaryMuscles.length > 0 && (
          <div>
            <dt className="inline text-muted-foreground">Secundários: </dt>
            <dd className="inline">{rotulosMusculos(exercicio.secondaryMuscles)}</dd>
          </div>
        )}
        {exercicio.equipment && (
          <div>
            <dt className="inline text-muted-foreground">Equipamento: </dt>
            <dd className="inline">
              {EQUIPAMENTO_LABEL[exercicio.equipment] ?? exercicio.equipment}
            </dd>
          </div>
        )}
      </dl>

      {exercicio.instructions.length > 0 && (
        <section>
          <h3 className="font-semibold text-sm mb-1">Como executar</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            {exercicio.instructions.map((passo, i) => (
              <li key={i}>{passo}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
