import Anthropic from "@anthropic-ai/sdk";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { catalogo } from "@/data/catalogo";
import { COTA_MENSAL_DE_ANALISES, COTA_MENSAL_DE_FICHAS } from "@/domain/planos";
import { analisarTreinos } from "./analisar";
import { gerarComClaude, gerarFichaComClaude, gerarFichaSimulada, gerarSimulado, type OpcoesDoClaude } from "./claude";
import { ErroDaIA, INDISPONIVEL } from "./erros";
import { montarFicha } from "./fichas";
import { criarRepositorio } from "./repositorio";

// O público é brasileiro: "hoje" e "este mês" seguem o calendário do app, não o UTC do servidor.
process.env.TZ = "America/Sao_Paulo";

const CHAVE_DA_API = defineSecret("ANTHROPIC_API_KEY");

initializeApp();

/** O teste de emulador nunca gasta, e a condição dupla impede a simulação em produção. */
const simulado = () => process.env.FUNCTIONS_EMULATOR === "true" && process.env.IA_SIMULADA === "true";

const opcoesDoClaude = (): OpcoesDoClaude => ({
  cliente: new Anthropic({ apiKey: CHAVE_DA_API.value() }),
  modelo: process.env.IA_MODELO || undefined,
  // Só contagens: nem o pedido, nem a resposta, nem quem pediu vão para o log.
  aoMedirUso: (uso) => logger.info("uso da IA", uso),
});

const CONFIGURACAO = {
  region: "southamerica-east1",
  secrets: [CHAVE_DA_API],
  // Teto de gasto e de abuso: a cota por pessoa é a primeira barreira, e esta a segunda.
  maxInstances: 3,
  timeoutSeconds: 180,
};

function comErrosCompreensiveis<T>(executar: (uid: string) => Promise<T>) {
  return async (pedido: { auth?: { uid: string } }) => {
    const uid = pedido.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Entre na sua conta para usar a IA.");
    try {
      return await executar(uid);
    } catch (erro) {
      if (erro instanceof ErroDaIA) throw new HttpsError(erro.codigo, erro.message);
      logger.error("falha na IA", { tipo: erro instanceof Error ? erro.name : "desconhecido" });
      // Limite de requisições, conta sem crédito ou rede: para a pessoa, é a mesma coisa.
      throw new HttpsError("unavailable", INDISPONIVEL);
    }
  };
}

const repositorio = () => criarRepositorio(getFirestore());

export const analisarMeusTreinos = onCall(CONFIGURACAO, (pedido) =>
  comErrosCompreensiveis((uid) => {
    const repo = repositorio();
    return analisarTreinos(
      { uid, consentiu: pedido.data?.consentiu === true, agora: new Date() },
      {
        ...repo,
        reservarCota: (id, agora) => repo.reservarCota(id, "analises", COTA_MENSAL_DE_ANALISES, agora),
        devolverCota: (id, agora) => repo.devolverCota(id, "analises", agora),
        gerar: async (dados) => (simulado() ? gerarSimulado(dados) : gerarComClaude(dados, opcoesDoClaude())),
      },
    );
  })(pedido),
);

export const montarMinhaFicha = onCall(CONFIGURACAO, (pedido) =>
  comErrosCompreensiveis((uid) => {
    const repo = repositorio();
    return montarFicha(
      { uid, consentiu: pedido.data?.consentiu === true, preferencias: pedido.data?.preferencias, agora: new Date() },
      {
        catalogo,
        temPremium: repo.temPremium,
        reservarCota: (id, agora) => repo.reservarCota(id, "fichas", COTA_MENSAL_DE_FICHAS, agora),
        devolverCota: (id, agora) => repo.devolverCota(id, "fichas", agora),
        gerar: async (preferencias, candidatos) =>
          simulado()
            ? gerarFichaSimulada(preferencias, candidatos)
            : gerarFichaComClaude(preferencias, candidatos, opcoesDoClaude()),
      },
    );
  })(pedido),
);
