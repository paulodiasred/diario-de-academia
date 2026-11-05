import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { analisesUsadas, COTA_MENSAL_DE_ANALISES, mesDaCota, type RespostaDaAnalise } from "@/domain/analiseTreinos";
import type { Sessao } from "@/domain/sessao";

/** Evita leitura sem fim em uma conta anormal. Cobre anos de treino. */
const MAXIMO_DE_SESSOES = 1000;

const paraIso = (valor: unknown): string => {
  const comData = valor as { toDate?: () => Date } | null | undefined;
  return comData?.toDate?.().toISOString() ?? (valor as string);
};

export function criarRepositorio(db: Firestore) {
  const usoDe = (uid: string) => db.doc(`users/${uid}/uso/ia`);

  return {
    /** A mesma regra de `premium()` em firestore.rules. */
    async temPremium(uid: string, agora: Date): Promise<boolean> {
      const dados = (await db.doc(`entitlements/${uid}`).get()).data();
      if (dados?.plano !== "premium") return false;
      return !(dados.expiraEm instanceof Timestamp) || dados.expiraEm.toDate() > agora;
    },

    async lerSessoes(uid: string): Promise<Sessao[]> {
      const snap = await db
        .collection(`users/${uid}/sessions`)
        .orderBy("iniciadaEm", "desc")
        .limit(MAXIMO_DE_SESSOES)
        .get();
      return snap.docs.map((d) => {
        const dados = d.data();
        return {
          ...(dados as Sessao),
          id: d.id,
          iniciadaEm: paraIso(dados.iniciadaEm),
          finalizadaEm: paraIso(dados.finalizadaEm),
          exercicioAtual: 0,
          descanso: null,
        };
      });
    },

    reservarCota(uid: string, agora: Date): Promise<boolean> {
      return db.runTransaction(async (t) => {
        const usadas = analisesUsadas((await t.get(usoDe(uid))).data() ?? null, agora);
        if (usadas >= COTA_MENSAL_DE_ANALISES) return false;
        t.set(usoDe(uid), { mes: mesDaCota(agora), analises: usadas + 1 });
        return true;
      });
    },

    async devolverCota(uid: string, agora: Date): Promise<void> {
      await db.runTransaction(async (t) => {
        const usadas = analisesUsadas((await t.get(usoDe(uid))).data() ?? null, agora);
        if (usadas > 0) t.set(usoDe(uid), { mes: mesDaCota(agora), analises: usadas - 1 });
      });
    },

    /** Só a última fica guardada: a pessoa pode apagar, e nada se acumula. */
    async salvar(uid: string, analise: RespostaDaAnalise, modelo: string, agora: Date): Promise<void> {
      await db.doc(`users/${uid}/analises/ultima`).set({
        ...analise,
        modelo,
        criadaEm: Timestamp.fromDate(agora),
      });
    },
  };
}
