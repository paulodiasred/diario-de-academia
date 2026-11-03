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
import { normalizarRegistro, normalizarTreino } from "../../src/domain/schemas";

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
    await assertFails(setDoc(doc(db, "treinos", "a"), { ...treinoDe("ana"), exercicios: [] }));
    await assertFails(setDoc(doc(db, "treinos", "b"), { ...treinoDe("ana"), nome: "" }));
  });

  it("nega coleções não previstas", async () => {
    await assertFails(setDoc(doc(comoAna(), "entitlements", "ana"), { plano: "premium" }));
    await assertFails(getDoc(doc(comoAna(), "qualquer", "coisa")));
  });
});

describe("compatibilidade com o que o app grava", () => {
  it("B1: treino sem descrição é aceito de ponta a ponta, pelo SDK e pelas regras", async () => {
    // Usa o normalizador real. O SDK rejeitaria o documento se restasse algum `undefined`.
    const dados = normalizarTreino({ nome: " Peito ", descricao: "  ", exercicios: [exercicio] });
    await assertSucceeds(
      setDoc(doc(comoAna(), "treinos", "novo"), {
        ...dados,
        userId: "ana",
        criadoEm: agora,
        atualizadoEm: agora,
      }),
    );
  });

  it("registro normalizado é aceito", async () => {
    const dados = normalizarRegistro({ exercicio: "Supino", peso: 50, serie: 1, dia: "treino-abc" });
    await assertSucceeds(
      setDoc(doc(comoAna(), "registros", "novo"), { ...dados, userId: "ana", data: agora }),
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
