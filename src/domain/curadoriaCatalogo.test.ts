import { describe, expect, it } from "vitest";
import catalogoBruto from "@/exercises/exercises-ptbr-partial-translation.json";
import type { ExercicioCatalogo } from "@/types/catalogo";
import { DIAS_SEMANA } from "@/types/catalogo";
import { buscarExercicios, exercicioParaTreino, pertenceAoGrupo } from "./catalogo";
import { aplicarCuradoria, EXERCICIOS_POPULARES, idsCurados } from "./curadoriaCatalogo";
import { idsDosModelos, MODELOS_TREINO, montarTreinosDoModelo } from "./modelosTreino";
import { LIMITES_GRATUITO } from "./planos";
import { normalizarTreino } from "./schemas";
import { normalizarBusca } from "./texto";

const bruto = catalogoBruto as ExercicioCatalogo[];
const catalogo = aplicarCuradoria(bruto);
const ids = new Set(catalogo.map((e) => e.id));
const nomes = (busca: string) => buscarExercicios(catalogo, busca).map((e) => e.name);

describe("curadoria do catálogo", () => {
  it("só cita exercícios que existem", () => {
    expect(idsCurados().filter((id) => !ids.has(id))).toEqual([]);
    expect(idsDosModelos().filter((id) => !ids.has(id))).toEqual([]);
  });

  it("populares não se repetem", () => {
    expect(new Set(EXERCICIOS_POPULARES).size).toBe(EXERCICIOS_POPULARES.length);
  });

  it("não sobram dois exercícios com o mesmo nome", () => {
    const vistos = catalogo.map((e) => normalizarBusca(e.name));
    expect(vistos.filter((nome, i) => vistos.indexOf(nome) !== i)).toEqual([]);
  });

  it("não altera IDs nem apaga exercícios", () => {
    expect(bruto.every((e) => ids.has(e.id))).toBe(true);
    expect(catalogo.length).toBe(bruto.length + 1);
  });

  it("nenhum nome corrigido reaproveita o nome antigo de outro exercício", () => {
    // O histórico também liga exercícios pelo nome: reaproveitar misturaria dois movimentos.
    const nomesAntigos = new Set(bruto.map((e) => normalizarBusca(e.name)));
    const original = new Map(bruto.map((e) => [e.id, e.name]));
    const renomeados = catalogo.filter((e) => original.has(e.id) && original.get(e.id) !== e.name);
    expect(renomeados.length).toBeGreaterThan(0);
    expect(renomeados.filter((e) => nomesAntigos.has(normalizarBusca(e.name))).map((e) => e.name)).toEqual([]);
  });

  it("corrige o exercício de dorsais que se dizia de tríceps", () => {
    const e = catalogo.find((x) => x.id === "Cable_Incline_Pushdown");
    expect(e?.name).not.toMatch(/Tríceps/);
    expect(e?.primaryMuscles).toEqual(["lats"]);
  });

  it("supinos de peito aparecem no filtro Peito; pegada fechada, não", () => {
    const noPeito = (id: string) => pertenceAoGrupo(catalogo.find((e) => e.id === id)!, "peito");
    expect(noPeito("Bench_Press_-_Powerlifting")).toBe(true);
    expect(noPeito("Close-Grip_Barbell_Bench_Press")).toBe(false);
  });
});

describe("busca", () => {
  it("peito mostra supino logo no início, e não alongamento", () => {
    const primeiros = nomes("peito").slice(0, 3);
    expect(primeiros[0]).toMatch(/Supino/);
    expect(primeiros.join(" ")).not.toMatch(/Alongamento|Arremesso/);
  });

  it.each([
    "cadeira extensora",
    "extensora",
    "mesa flexora",
    "abdutora",
    "adutora",
    "voador",
    "peck deck",
    "puxada frontal",
    "burpee",
    "stiff",
    "serrote",
    "triceps testa",
    "rosca scott",
    "agachamento bulgaro",
    "elevacao pelvica",
    "graviton",
  ])("encontra o termo de academia: %s", (termo) => {
    expect(nomes(termo).length).toBeGreaterThan(0);
  });

  it("todas as palavras precisam combinar, em qualquer ordem e sem acento", () => {
    expect(nomes("halteres supino")[0]).toMatch(/Supino/);
    expect(nomes("tríceps corda")[0]).toMatch(/Tríceps/);
    expect(nomes("xyzabc")).toEqual([]);
  });

  it("procura também por equipamento e músculo", () => {
    expect(buscarExercicios(catalogo, "peito maquina")[0].primaryMuscles).toContain("chest");
    expect(nomes("costas")[0]).toBeTruthy();
  });

  it("o nome exato vem primeiro, mesmo sem ser popular", () => {
    expect(nomes("Abdominal 3/4")[0]).toBe("Abdominal 3/4");
    expect(nomes("Supino Inclinado com Barra - Pegada Média")[0]).toBe(
      "Supino Inclinado com Barra - Pegada Média",
    );
  });

  it("sem busca: populares primeiro e especializados por último", () => {
    const lista = buscarExercicios(catalogo, "");
    expect(lista).toHaveLength(catalogo.length);
    expect(lista[0].id).toBe(EXERCICIOS_POPULARES[0]);
    expect(lista[lista.length - 1].category).toMatch(/stretching|strongman|plyometrics|olympic/);
  });

  it("exercício próprio vem antes de tudo", () => {
    const proprio: ExercicioCatalogo = {
      ...catalogo[0],
      id: "meu",
      name: "Meu Supino",
      proprio: true,
      category: "strength",
    };
    expect(buscarExercicios([...catalogo, proprio], "")[0].id).toBe("meu");
    expect(buscarExercicios([...catalogo, proprio], "supino")[0].id).toBe("meu");
  });

  it("cardio só aparece no grupo Cardio", () => {
    const esteira = catalogo.find((e) => e.id === "Running_Treadmill")!;
    expect(pertenceAoGrupo(esteira, "cardio")).toBe(true);
    expect(pertenceAoGrupo(esteira, "pernas")).toBe(false);
  });
});

describe("modelos de treino", () => {
  it.each(MODELOS_TREINO.map((m) => [m.nome, m] as const))("%s: pronto para salvar", (_, modelo) => {
    const treinos = montarTreinosDoModelo(modelo, catalogo);
    expect(treinos).toHaveLength(modelo.fichas.length);
    for (const [i, treino] of treinos.entries()) {
      expect(treino.exercicios).toHaveLength(modelo.fichas[i].itens.length);
      expect(() => normalizarTreino(treino)).not.toThrow();
      expect(treino.exercicios.map((e) => e.ordem)).toEqual(treino.exercicios.map((_, j) => j));
      expect(new Set(treino.exercicios.map((e) => e.exercicioId)).size).toBe(treino.exercicios.length);
      expect(treino.dias?.every((d) => (DIAS_SEMANA as readonly string[]).includes(d))).toBe(true);
    }
  });

  it("cabem no plano gratuito de uma conta nova", () => {
    for (const modelo of MODELOS_TREINO) {
      expect(modelo.fichas.length).toBeLessThanOrEqual(LIMITES_GRATUITO.treinos);
    }
  });

  it("não inventa carga, e tempo não pede repetições", () => {
    const [treino] = montarTreinosDoModelo(MODELOS_TREINO[0], catalogo);
    expect(treino.exercicios.every((e) => e.cargaAlvo === undefined)).toBe(true);
    const prancha = treino.exercicios.find((e) => e.exercicioId === "Plank");
    expect(prancha).toMatchObject({ medida: "tempo", duracaoAlvoSeg: 45 });
    expect(prancha?.repsAlvo).toBeUndefined();
  });

  it("exercício de corpo e de máquina recebem a medida certa", () => {
    const flexao = catalogo.find((e) => e.id === "Pushups")!;
    expect(exercicioParaTreino(flexao, 0).medida).toBe("peso_corporal");
    const legPress = catalogo.find((e) => e.id === "Leg_Press")!;
    expect(exercicioParaTreino(legPress, 0).medida).toBe("carga_reps");
  });
});
