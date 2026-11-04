import { treino as TREINO_FIXO, type TreinoRegistro } from "@/data/treino";
import type { ExercicioNoTreino, TreinoPersonalizado } from "@/types/catalogo";
import { chaveDiaLocal } from "./datas";
import { slug } from "./texto";
import type { ExercicioSessao, Sessao, SerieSessao } from "./sessao";

export { slug };

const DIAS_FIXOS = [...new Set(TREINO_FIXO.map((e) => e.dia))];

const tempo = (r: TreinoRegistro) => new Date(r.data).getTime();

/** O antigo treino fixo só existe para quem já registrou séries nele. */
export function usouTreinoFixo(registros: TreinoRegistro[]): boolean {
  return registros.some((r) => DIAS_FIXOS.includes(r.dia));
}

/** `treinos` é compartilhada entre contas: o ID precisa incluir o usuário, ou uma conta colide com a outra. */
export const idRotinaFixa = (uid: string, dia: string) => `fixo-${uid}-${slug(dia)}`;

/** O antigo treino fixo como rotinas normais, com IDs determinísticos por conta. */
export function rotinasDoTreinoFixo(uid: string): Array<{
  id: string;
  dados: Pick<TreinoPersonalizado, "nome" | "descricao" | "dias" | "exercicios">;
}> {
  return DIAS_FIXOS.map((dia) => {
    const exercicios: ExercicioNoTreino[] = TREINO_FIXO.filter((e) => e.dia === dia).map(
      (e, ordem) => {
        const base = {
          exercicioId: `fixo-${slug(e.exercicio)}`,
          exercicioNome: e.exercicio,
          primaryMuscles: [],
          ordem,
        };
        if (e.tipo === "Cardio") {
          return { ...base, category: "cardio", medida: "tempo" as const, series: 1, descanso: 0 };
        }
        return {
          ...base,
          category: "strength",
          medida: "carga_reps" as const,
          series: e.series,
          descanso: e.descanso,
          ...(e.tipo === "Circuito" ? { circuito: e.circuito } : {}),
        };
      },
    );
    const grupos = [...new Set(TREINO_FIXO.filter((e) => e.dia === dia).map((e) => e.grupo))];
    return {
      id: idRotinaFixa(uid, dia),
      dados: { nome: dia, descricao: grupos.join(", "), dias: [dia], exercicios },
    };
  });
}

/** Liga o nome gravado nos registros antigos a um ID estável de exercício. */
function mapaDeExercicios(treinos: Array<Pick<TreinoPersonalizado, "exercicios">>) {
  const mapa = new Map<string, ExercicioNoTreino>();
  for (const t of treinos) {
    for (const e of t.exercicios) {
      if (!mapa.has(e.exercicioNome)) mapa.set(e.exercicioNome, e);
    }
  }
  return mapa;
}

function nomeDaSessao(dia: string, treinos: TreinoPersonalizado[]): string {
  if (!dia.startsWith("treino-")) return dia;
  const id = dia.slice("treino-".length);
  return treinos.find((t) => t.id === id)?.nome ?? "Treino";
}

/**
 * Converte os registros antigos em sessões, um documento por dia e treino.
 * IDs determinísticos: repetir a conversão gera os mesmos documentos, sem duplicar.
 * Registros antigos não têm repetições nem duração, e esses valores não são inventados.
 */
export function converterRegistrosEmSessoes(
  registros: TreinoRegistro[],
  treinos: TreinoPersonalizado[],
  uid: string,
): Sessao[] {
  const conhecidos = mapaDeExercicios([
    ...treinos,
    ...rotinasDoTreinoFixo(uid).map((r) => r.dados),
  ]);

  const grupos = new Map<string, TreinoRegistro[]>();
  for (const r of registros) {
    if (r.concluida === false || Number.isNaN(tempo(r))) continue;
    const chave = `${chaveDiaLocal(new Date(r.data))}|${r.dia}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), r]);
  }

  return [...grupos.entries()].map(([chave, doGrupo]) => {
    const [diaLocal, dia] = chave.split("|");
    const ordenados = [...doGrupo].sort((a, b) => tempo(a) - tempo(b));

    const porExercicio = new Map<string, TreinoRegistro[]>();
    for (const r of ordenados) {
      porExercicio.set(r.exercicio, [...(porExercicio.get(r.exercicio) ?? []), r]);
    }

    const exercicios = [...porExercicio.entries()].map(([nome, series]): ExercicioSessao => {
      const conhecido = conhecidos.get(nome);
      const cardio = series.every((s) => s.serie === 0) || conhecido?.category === "cardio";
      return {
        exercicioId: conhecido?.exercicioId ?? `nome-${slug(nome)}`,
        nome,
        medida: cardio ? "tempo" : "carga_reps",
        descanso: conhecido?.descanso ?? 0,
        primaryMuscles: conhecido?.primaryMuscles ?? [],
        images: conhecido?.images,
        notas: "",
        series: [...series]
          .sort((a, b) => a.serie - b.serie)
          .map((s): SerieSessao => ({
            peso: cardio ? null : s.peso,
            reps: null,
            duracaoSeg: null,
            distanciaM: null,
            concluida: true,
            concluidaEm: new Date(s.data).toISOString(),
            editada: false,
          })),
      };
    });

    const iniciadaEm = new Date(ordenados[0].data).toISOString();
    const finalizadaEm = new Date(ordenados[ordenados.length - 1].data).toISOString();
    return {
      id: `legacy-${diaLocal}-${slug(dia)}`,
      treinoId: dia.startsWith("treino-") ? dia.slice("treino-".length) : idRotinaFixa(uid, dia),
      nome: nomeDaSessao(dia, treinos),
      iniciadaEm,
      finalizadaEm,
      origem: "legado" as const,
      notas: "",
      exercicios,
      exercicioAtual: 0,
      descanso: null,
      atualizadaEm: finalizadaEm,
      legadoIds: ordenados.map((r) => r.id).filter((id): id is string => !!id),
    };
  });
}
