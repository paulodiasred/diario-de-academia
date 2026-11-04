import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  increment,
  writeBatch,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { LIMITES_GRATUITO } from "../../src/domain/planos";
import { normalizarExercicioProprio, normalizarTreino } from "../../src/domain/schemas";

let ambiente: RulesTestEnvironment;

const agora = Timestamp.fromDate(new Date("2026-11-03T12:00:00Z"));

const exercicio = {
  exercicioId: "x",
  exercicioNome: "Supino",
  primaryMuscles: ["chest"],
  category: "strength",
  series: 3,
  descanso: 60,
  ordem: 0,
};

const registroDe = (userId: string) => ({
  userId,
  exercicio: "Supino",
  peso: 50,
  serie: 1,
  dia: "Segunda",
  concluida: true,
  data: agora,
});

const treinoDe = (userId: string) => ({
  userId,
  nome: "Peito",
  descricao: "",
  dias: ["Segunda"],
  exercicios: [exercicio],
  criadoEm: agora,
  atualizadoEm: agora,
});

const comoAna = () => ambiente.authenticatedContext("ana").firestore() as unknown as Firestore;
const comoBia = () => ambiente.authenticatedContext("bia").firestore() as unknown as Firestore;
const anonimo = () => ambiente.unauthenticatedContext().firestore() as unknown as Firestore;

/** Grava como admin, ignorando as regras: simula dados que já estão em produção. */
async function semear(caminho: string, id: string, dados: Record<string, unknown>) {
  await ambiente.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, caminho, id), dados);
  });
}

beforeAll(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: "demo-diario",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

beforeEach(async () => {
  await ambiente.clearFirestore();
});

afterAll(async () => {
  await ambiente.cleanup();
});

/** Cria como o app: documento e contador no mesmo lote. */
function criarTreinoComContador(db: Firestore, uid: string, id: string, dados: Record<string, unknown>) {
  const lote = writeBatch(db);
  lote.set(doc(db, "treinos", id), dados);
  lote.set(
    doc(db, "users", uid, "uso", "contadores"),
    { treinos: increment(1), ultimoId: id },
    { merge: true },
  );
  return lote.commit();
}

function criarExercicioComContador(db: Firestore, uid: string, id: string, dados: Record<string, unknown>) {
  const lote = writeBatch(db);
  lote.set(doc(db, "users", uid, "exercises", id), dados);
  lote.set(
    doc(db, "users", uid, "uso", "contadores"),
    { exercicios: increment(1), ultimoId: id },
    { merge: true },
  );
  return lote.commit();
}

describe("isolamento entre usuários: registros", () => {
  beforeEach(async () => {
    await semear("registros", "da-ana", registroDe("ana"));
    await semear("registros", "da-bia", registroDe("bia"));
  });

  it("dono lê o próprio registro", async () => {
    await assertSucceeds(getDoc(doc(comoAna(), "registros", "da-ana")));
  });

  it("não lê o registro de outra pessoa", async () => {
    await assertFails(getDoc(doc(comoAna(), "registros", "da-bia")));
  });

  it("lista só os próprios, com o filtro que o app usa", async () => {
    const db = comoAna();
    await assertSucceeds(getDocs(query(collection(db, "registros"), where("userId", "==", "ana"))));
  });

  it("não lista a coleção inteira", async () => {
    await assertFails(getDocs(collection(comoAna(), "registros")));
  });

  it("não lista registros de outra pessoa filtrando pelo uid dela", async () => {
    const db = comoAna();
    await assertFails(getDocs(query(collection(db, "registros"), where("userId", "==", "bia"))));
  });

  it("não apaga o registro de outra pessoa", async () => {
    await assertFails(deleteDoc(doc(comoAna(), "registros", "da-bia")));
  });

  it("dono apaga o próprio", async () => {
    await assertSucceeds(deleteDoc(doc(comoAna(), "registros", "da-ana")));
  });

  it("não cria registro em nome de outra pessoa", async () => {
    await assertFails(setDoc(doc(comoAna(), "registros", "novo"), registroDe("bia")));
  });

  it("ninguém edita um registro, nem o dono", async () => {
    await assertFails(updateDoc(doc(comoAna(), "registros", "da-ana"), { peso: 999 }));
  });

  it("sem login não lê nem grava", async () => {
    await assertFails(getDoc(doc(anonimo(), "registros", "da-ana")));
    await assertFails(setDoc(doc(anonimo(), "registros", "novo"), registroDe("ana")));
  });
});

describe("isolamento entre usuários: treinos", () => {
  beforeEach(async () => {
    await semear("treinos", "da-ana", treinoDe("ana"));
    await semear("treinos", "da-bia", treinoDe("bia"));
  });

  it("não lê o treino de outra pessoa", async () => {
    await assertFails(getDoc(doc(comoAna(), "treinos", "da-bia")));
  });

  it("não altera o treino de outra pessoa", async () => {
    await assertFails(updateDoc(doc(comoAna(), "treinos", "da-bia"), { nome: "Invadido" }));
  });

  it("não apaga o treino de outra pessoa", async () => {
    await assertFails(deleteDoc(doc(comoAna(), "treinos", "da-bia")));
  });

  it("não transfere o próprio treino para outra pessoa", async () => {
    await assertFails(updateDoc(doc(comoAna(), "treinos", "da-ana"), { userId: "bia" }));
  });

  it("não cria treino em nome de outra pessoa", async () => {
    await assertFails(setDoc(doc(comoAna(), "treinos", "novo"), treinoDe("bia")));
  });

  it("dono lê, altera e apaga o próprio", async () => {
    const db = comoAna();
    await assertSucceeds(getDoc(doc(db, "treinos", "da-ana")));
    await assertSucceeds(updateDoc(doc(db, "treinos", "da-ana"), { nome: "Novo", atualizadoEm: agora }));
    await assertSucceeds(deleteDoc(doc(db, "treinos", "da-ana")));
  });
});

describe("integridade dos dados", () => {
  const criarRegistro = (extra: Record<string, unknown>) =>
    setDoc(doc(comoAna(), "registros", "novo"), { ...registroDe("ana"), ...extra });

  it("aceita o cardio, gravado com peso 0 e série 0", async () => {
    await assertSucceeds(criarRegistro({ peso: 0, serie: 0 }));
  });

  it.each([
    ["peso negativo", { peso: -1 }],
    ["peso absurdo", { peso: 2001 }],
    ["peso em texto", { peso: "50" }],
    ["série fracionada", { serie: 1.5 }],
    ["exercício vazio", { exercicio: "" }],
    ["data em texto", { data: "2026-11-03" }],
    ["campo desconhecido", { plano: "premium" }],
  ])("rejeita registro com %s", async (_nome, extra) => {
    await assertFails(criarRegistro(extra));
  });

  it("rejeita treino sem exercícios ou sem nome", async () => {
    const db = comoAna();
    await assertFails(criarTreinoComContador(db, "ana", "a", { ...treinoDe("ana"), exercicios: [] }));
    await assertFails(criarTreinoComContador(db, "ana", "b", { ...treinoDe("ana"), nome: "" }));
  });

  it("nega coleções não previstas", async () => {
    await assertFails(setDoc(doc(comoAna(), "entitlements", "ana"), { plano: "premium" }));
    await assertFails(getDoc(doc(comoAna(), "qualquer", "coisa")));
  });
});

const sessaoValida = (extra: Record<string, unknown> = {}) => ({
  treinoId: "t1",
  nome: "Peito",
  iniciadaEm: agora,
  finalizadaEm: agora,
  origem: "app",
  notas: "",
  atualizadaEm: "2026-11-03T12:00:00.000Z",
  exercicios: [{ exercicioId: "x", nome: "Supino", series: [{ peso: 50, reps: 10, concluida: true }] }],
  ...extra,
});

const rascunhoValido = { id: "s1", nome: "Peito", exercicios: [], exercicioAtual: 0, descanso: null };

const exercicioValido = {
  name: "Meu exercício",
  category: "strength",
  equipment: null,
  medida: "carga_reps",
  primaryMuscles: ["chest"],
  secondaryMuscles: [],
  instructions: [],
  atualizadoEm: agora,
};

describe("isolamento: dados dentro de users/{uid}", () => {
  const colecoes: Array<[string, string, Record<string, unknown>]> = [
    ["sessions", "s1", sessaoValida()],
    ["exercises", "e1", exercicioValido],
    ["activeSession", "current", rascunhoValido],
  ];

  describe.each(colecoes)("%s", (colecao, id, dados) => {
    beforeEach(async () => {
      await semear(`users/bia/${colecao}`, id, dados);
    });

    it("não lê os dados de outra pessoa", async () => {
      await assertFails(getDoc(doc(comoAna(), "users", "bia", colecao, id)));
    });

    it("não lista os dados de outra pessoa", async () => {
      await assertFails(getDocs(collection(comoAna(), "users", "bia", colecao)));
    });

    it("não grava nos dados de outra pessoa", async () => {
      await assertFails(setDoc(doc(comoAna(), "users", "bia", colecao, id), dados));
    });

    it("não apaga os dados de outra pessoa", async () => {
      await assertFails(deleteDoc(doc(comoAna(), "users", "bia", colecao, id)));
    });

    it("sem login não acessa", async () => {
      await assertFails(getDoc(doc(anonimo(), "users", "bia", colecao, id)));
    });

    it("dono lê, grava, lista e apaga", async () => {
      const db = comoBia();
      await assertSucceeds(getDoc(doc(db, "users", "bia", colecao, id)));
      // activeSession tem um único documento: o app nunca lista, e a regra não permite.
      if (colecao !== "activeSession") {
        await assertSucceeds(getDocs(collection(db, "users", "bia", colecao)));
      }
      await assertSucceeds(setDoc(doc(db, "users", "bia", colecao, id), dados));
      await assertSucceeds(deleteDoc(doc(db, "users", "bia", colecao, id)));
    });
  });

  it("o próprio perfil é legível, e o de outra pessoa, não", async () => {
    await semear("users", "bia", { metaSemanal: 3 });
    await assertSucceeds(getDoc(doc(comoBia(), "users", "bia")));
    await assertFails(getDoc(doc(comoAna(), "users", "bia")));
  });
});

describe("integridade do modelo novo", () => {
  const criarSessao = (extra: Record<string, unknown>) =>
    setDoc(doc(comoAna(), "users", "ana", "sessions", "s"), sessaoValida(extra));

  it.each([
    ["sem nome", { nome: "" }],
    ["origem desconhecida", { origem: "invasor" }],
    ["início em texto", { iniciadaEm: "2026-11-03" }],
    ["fim antes do início", { finalizadaEm: Timestamp.fromDate(new Date("2020-01-01")) }],
    ["campo desconhecido", { plano: "premium" }],
  ])("rejeita sessão com %s", async (_nome, extra) => {
    await assertFails(criarSessao(extra));
  });

  it("aceita sessão migrada, com os IDs dos registros de origem", async () => {
    await assertSucceeds(criarSessao({ origem: "legado", legadoIds: ["a", "b"] }));
  });

  it("o cliente não concede a si mesmo um plano no perfil", async () => {
    const perfil = doc(comoAna(), "users", "ana");
    await assertFails(setDoc(perfil, { plano: "premium" }));
    await assertFails(setDoc(perfil, { migracaoLegadoEm: agora, premium: true }));
    await assertSucceeds(setDoc(perfil, { migracaoLegadoEm: agora }));
  });

  it("a meta semanal aceita de 1 a 7 treinos", async () => {
    const perfil = doc(comoAna(), "users", "ana");
    await assertSucceeds(setDoc(perfil, { metaSemanal: 1 }));
    await assertSucceeds(setDoc(perfil, { metaSemanal: 7 }));
    await assertFails(setDoc(perfil, { metaSemanal: 0 }));
    await assertFails(setDoc(perfil, { metaSemanal: 8 }));
    await assertFails(setDoc(perfil, { metaSemanal: "3" }));
    await assertFails(setDoc(perfil, { metaSemanal: 2.5 }));
  });

  it("guarda a referência escolhida no Como fazer, só como mapa", async () => {
    const perfil = doc(comoAna(), "users", "ana");
    await assertSucceeds(
      setDoc(perfil, { vinculosExercicios: { "supino-barra": { exercicioId: "x", imagem: null } } }),
    );
    await assertFails(setDoc(perfil, { vinculosExercicios: "invasao" }));
    await assertFails(setDoc(doc(comoBia(), "users", "ana"), { vinculosExercicios: {} }));
  });

  it("o dono apaga o próprio perfil ao excluir a conta, mas não o de outra pessoa", async () => {
    await semear("users", "ana", { metaSemanal: 3 });
    await assertFails(deleteDoc(doc(comoBia(), "users", "ana")));
    await assertSucceeds(deleteDoc(doc(comoAna(), "users", "ana")));
  });

  it("só existe um treino em andamento por conta", async () => {
    await assertFails(setDoc(doc(comoAna(), "users", "ana", "activeSession", "outro"), rascunhoValido));
  });

  it("rejeita exercício próprio sem músculo ou com medida desconhecida", async () => {
    const db = comoAna();
    await assertFails(criarExercicioComContador(db, "ana", "e", { ...exercicioValido, primaryMuscles: [] }));
    await assertFails(criarExercicioComContador(db, "ana", "e", { ...exercicioValido, medida: "outra" }));
  });

  it("a migração não consegue alterar um registro antigo", async () => {
    await semear("registros", "antigo", registroDe("ana"));
    await assertFails(updateDoc(doc(comoAna(), "registros", "antigo"), { peso: 1 }));
  });
});

describe("plano e limites: tentativas de burlar pelo SDK direto", () => {
  const contadores = (db: Firestore, uid = "ana") => doc(db, "users", uid, "uso", "contadores");
  const treino = () => treinoDe("ana");

  async function encher(campo: "treinos" | "exercicios", quantidade: number) {
    await semear("users/ana/uso", "contadores", { [campo]: quantidade });
  }

  it("cria até o limite do gratuito, e não passa dele", async () => {
    await encher("treinos", LIMITES_GRATUITO.treinos - 1);
    const db = comoAna();
    await assertSucceeds(criarTreinoComContador(db, "ana", "ultimo", treino()));
    await assertFails(criarTreinoComContador(db, "ana", "a-mais", treino()));
  });

  it("o limite de exercícios próprios também vale", async () => {
    await encher("exercicios", LIMITES_GRATUITO.exercicios - 1);
    const db = comoAna();
    await assertSucceeds(criarExercicioComContador(db, "ana", "ultimo", exercicioValido));
    await assertFails(criarExercicioComContador(db, "ana", "a-mais", exercicioValido));
  });

  it("não cria treino sem somar no contador", async () => {
    await assertFails(setDoc(doc(comoAna(), "treinos", "sem-contar"), treino()));
  });

  it("não cria exercício sem somar no contador", async () => {
    await assertFails(setDoc(doc(comoAna(), "users", "ana", "exercises", "sem-contar"), exercicioValido));
  });

  it("não zera o contador apagando o documento", async () => {
    await encher("treinos", LIMITES_GRATUITO.treinos);
    await assertFails(deleteDoc(contadores(comoAna())));
  });

  it("não baixa o contador sem excluir um treino de verdade", async () => {
    await encher("treinos", LIMITES_GRATUITO.treinos);
    await assertFails(setDoc(contadores(comoAna()), { treinos: 0, ultimoId: "x" }));
    await assertFails(setDoc(contadores(comoAna()), { treinos: LIMITES_GRATUITO.treinos - 1, ultimoId: "inexistente" }));
  });

  it("não usa o treino de outra coisa para justificar a baixa, sem apagá-lo", async () => {
    await encher("treinos", LIMITES_GRATUITO.treinos);
    await semear("treinos", "existente", treino());
    await assertFails(setDoc(contadores(comoAna()), { treinos: LIMITES_GRATUITO.treinos - 1, ultimoId: "existente" }));
  });

  it("não cria o contador já com outro valor", async () => {
    await assertFails(setDoc(contadores(comoAna()), { treinos: -5, ultimoId: "x" }));
  });

  it("não coloca campos estranhos no contador", async () => {
    const db = comoAna();
    const lote = writeBatch(db);
    lote.set(doc(db, "treinos", "t"), treino());
    lote.set(contadores(db), { treinos: 1, ultimoId: "t", plano: "premium" });
    await assertFails(lote.commit());
  });

  it("não mexe no contador de outra pessoa", async () => {
    await assertFails(getDoc(contadores(comoAna(), "bia")));
    await assertFails(setDoc(contadores(comoAna(), "bia"), { treinos: 0, ultimoId: "x" }));
  });

  it("excluir um treino de verdade devolve a vaga", async () => {
    await encher("treinos", LIMITES_GRATUITO.treinos);
    await semear("treinos", "t", treino());
    const db = comoAna();
    const lote = writeBatch(db);
    lote.delete(doc(db, "treinos", "t"));
    lote.set(contadores(db), { treinos: increment(-1), ultimoId: "t" }, { merge: true });
    await assertSucceeds(lote.commit());
    await assertSucceeds(criarTreinoComContador(db, "ana", "novo", treino()));
  });

  it("excluir sempre é permitido, mesmo sem mexer no contador", async () => {
    await semear("treinos", "antigo", treino());
    await assertSucceeds(deleteDoc(doc(comoAna(), "treinos", "antigo")));
  });

  it("o cliente não concede Premium a si mesmo", async () => {
    const entitlement = doc(comoAna(), "entitlements", "ana");
    await assertFails(setDoc(entitlement, { plano: "premium" }));
    await semear("entitlements", "ana", { plano: "gratuito" });
    await assertFails(updateDoc(entitlement, { plano: "premium" }));
    await assertFails(deleteDoc(entitlement));
  });

  it("cada um lê só o próprio plano", async () => {
    await semear("entitlements", "bia", { plano: "premium" });
    await assertFails(getDoc(doc(comoAna(), "entitlements", "bia")));
    await assertSucceeds(getDoc(doc(comoBia(), "entitlements", "bia")));
  });

  it("Premium não tem limite", async () => {
    await semear("entitlements", "ana", { plano: "premium" });
    await encher("treinos", LIMITES_GRATUITO.treinos + 20);
    await assertSucceeds(criarTreinoComContador(comoAna(), "ana", "mais", treino()));
  });

  it("Premium vencido volta a ter limite", async () => {
    await semear("entitlements", "ana", {
      plano: "premium",
      expiraEm: Timestamp.fromDate(new Date("2020-01-01")),
    });
    await encher("treinos", LIMITES_GRATUITO.treinos);
    await assertFails(criarTreinoComContador(comoAna(), "ana", "mais", treino()));
  });

  it("Premium ainda válido vale", async () => {
    await semear("entitlements", "ana", {
      plano: "premium",
      expiraEm: Timestamp.fromDate(new Date("2099-01-01")),
    });
    await encher("treinos", LIMITES_GRATUITO.treinos);
    await assertSucceeds(criarTreinoComContador(comoAna(), "ana", "mais", treino()));
  });

  it("a migração cria só as rotinas com o ID fechado da própria conta", async () => {
    const db = comoAna();
    await assertSucceeds(setDoc(doc(db, "treinos", "fixo-ana-segunda"), treino()));
    await assertFails(setDoc(doc(db, "treinos", "fixo-ana-domingo"), treino()));
    await assertFails(setDoc(doc(db, "treinos", "fixo-bia-segunda"), treino()));
    await assertFails(setDoc(doc(db, "treinos", "fixo-ana-segunda-2"), treino()));
  });

  describe("metas personalizadas", () => {
    const meta = { tipo: "carga", alvo: 100, exercicioNome: "Supino", criadaEm: agora };
    const ref = (db: Firestore) => doc(db, "users", "ana", "metas", "m");

    it("gratuito não cria", async () => {
      await assertFails(setDoc(ref(comoAna()), meta));
    });

    it("Premium cria, e valores inválidos são recusados", async () => {
      await semear("entitlements", "ana", { plano: "premium" });
      await assertSucceeds(setDoc(ref(comoAna()), meta));
      await assertFails(setDoc(doc(comoAna(), "users", "ana", "metas", "b"), { ...meta, alvo: 0 }));
      await assertFails(setDoc(doc(comoAna(), "users", "ana", "metas", "c"), { ...meta, tipo: "x" }));
    });

    it("quem perdeu o Premium ainda vê e apaga as próprias metas", async () => {
      await semear("users/ana/metas", "m", meta);
      await assertSucceeds(getDoc(ref(comoAna())));
      await assertSucceeds(deleteDoc(ref(comoAna())));
    });

    it("outra pessoa não acessa", async () => {
      await semear("users/ana/metas", "m", meta);
      await assertFails(getDoc(ref(comoBia())));
    });
  });
});

describe("compatibilidade com o que o app grava", () => {
  it("B1: treino sem descrição é aceito de ponta a ponta, pelo SDK e pelas regras", async () => {
    // Usa o normalizador real. O SDK rejeitaria o documento se restasse algum `undefined`.
    const dados = normalizarTreino({ nome: " Peito ", descricao: "  ", exercicios: [exercicio] });
    await assertSucceeds(
      criarTreinoComContador(comoAna(), "ana", "novo", {
        ...dados,
        userId: "ana",
        criadoEm: agora,
        atualizadoEm: agora,
      }),
    );
  });

  it("treino com os campos novos de medida e metas é aceito", async () => {
    const dados = normalizarTreino({
      nome: "Peito",
      exercicios: [{ ...exercicio, medida: "peso_corporal", repsAlvo: 12, cargaAlvo: 5 }],
    });
    await assertSucceeds(
      criarTreinoComContador(comoAna(), "ana", "novo", {
        ...dados,
        userId: "ana",
        criadoEm: agora,
        atualizadoEm: agora,
      }),
    );
  });

  it("exercício próprio normalizado é aceito", async () => {
    const dados = normalizarExercicioProprio({
      name: "Meu exercício",
      category: "strength",
      equipment: null,
      medida: "carga_reps",
      primaryMuscles: ["chest"],
    });
    await assertSucceeds(
      criarExercicioComContador(comoAna(), "ana", "novo", { ...dados, atualizadoEm: agora }),
    );
  });

  it("treino antigo, sem descrição nem dias, continua legível e editável", async () => {
    const { descricao: _d, dias: _e, ...antigo } = treinoDe("ana");
    await semear("treinos", "antigo", antigo);
    const db = comoAna();
    await assertSucceeds(getDoc(doc(db, "treinos", "antigo")));
    await assertSucceeds(updateDoc(doc(db, "treinos", "antigo"), { nome: "Renomeado" }));
  });

  it("registro antigo, sem o campo concluida, continua legível e apagável", async () => {
    const { concluida: _c, ...antigo } = registroDe("ana");
    await semear("registros", "antigo", antigo);
    const db = comoAna();
    await assertSucceeds(getDoc(doc(db, "registros", "antigo")));
    await assertSucceeds(deleteDoc(doc(db, "registros", "antigo")));
  });
});
