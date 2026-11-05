import Anthropic from "@anthropic-ai/sdk";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { analisarTreinos, ErroDaAnalise } from "./analisar";
import { gerarComClaude, gerarSimulado } from "./claude";
import { criarRepositorio } from "./repositorio";

// O público é brasileiro: "hoje" e "este mês" seguem o calendário do app, não o UTC do servidor.
process.env.TZ = "America/Sao_Paulo";

const CHAVE_DA_API = defineSecret("ANTHROPIC_API_KEY");

initializeApp();

/** O teste de emulador nunca gasta, e a condição dupla impede a simulação em produção. */
const simulado = () => process.env.FUNCTIONS_EMULATOR === "true" && process.env.IA_SIMULADA === "true";

export const analisarMeusTreinos = onCall(
  {
    region: "southamerica-east1",
    secrets: [CHAVE_DA_API],
    // Teto de gasto e de abuso: a cota por pessoa é a primeira barreira, e esta a segunda.
    maxInstances: 3,
    timeoutSeconds: 120,
  },
  async (pedido) => {
    const uid = pedido.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Entre na sua conta para gerar a análise.");

    try {
      return await analisarTreinos(
        { uid, consentiu: pedido.data?.consentiu === true, agora: new Date() },
        {
          ...criarRepositorio(getFirestore()),
          gerar: async (dados) => {
            if (simulado()) return gerarSimulado(dados);
            return gerarComClaude(dados, {
              cliente: new Anthropic({ apiKey: CHAVE_DA_API.value() }),
              modelo: process.env.IA_MODELO || undefined,
              // Só contagens: nem o pedido, nem a resposta, nem quem pediu vão para o log.
              aoMedirUso: (uso) => logger.info("uso da IA", uso),
            });
          },
        },
      );
    } catch (erro) {
      if (erro instanceof ErroDaAnalise) throw new HttpsError(erro.codigo, erro.message);
      logger.error("falha na análise", { tipo: erro instanceof Error ? erro.name : "desconhecido" });
      // Limite de requisições, conta sem crédito ou rede: para a pessoa, é a mesma coisa.
      throw new HttpsError("unavailable", "Não foi possível gerar a análise agora. Tente de novo mais tarde.");
    }
  },
);
