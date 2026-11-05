import { describe, expect, it, vi } from "vitest";
import type { DadosDaAnalise } from "@/domain/analiseTreinos";
import { ErroDaIA } from "./erros";
import { gerarComClaude, gerarSimulado, INSTRUCOES_ANALISE, MODELO_PADRAO, type OpcoesDoClaude } from "./claude";

const VAZIO = { treinos: 4, diasAtivos: 4, series: 12, volumeKg: 1000, minutos: 100 };
const DADOS: DadosDaAnalise = {
  dias: 30,
  atual: VAZIO,
  anterior: VAZIO,
  variacaoPercentual: { treinos: 0, series: 0, volumeKg: 0 },
  seriesPorGrupo: [],
  exercicios: [],
  recordes: [],
};

const RESPOSTA = {
  model: MODELO_PADRAO,
  stop_reason: "end_turn",
  usage: { input_tokens: 10, output_tokens: 20 },
  parsed_output: { resumo: " Bom período. ", evolucao: [], atencao: [], sugestoes: [] },
};

function clienteCom(resposta: object) {
  const parse = vi.fn(async (_pedido: Record<string, unknown>) => resposta);
  return { parse, cliente: { beta: { messages: { parse } } } as unknown as OpcoesDoClaude["cliente"] };
}

describe("chamada ao Claude", () => {
  it("devolve a resposta normalizada e informa o uso, sem conteúdo", async () => {
    const { cliente } = clienteCom(RESPOSTA);
    const aoMedirUso = vi.fn();
    const { analise, modelo } = await gerarComClaude(DADOS, { cliente, aoMedirUso });
    expect(analise.resumo).toBe("Bom período.");
    expect(modelo).toBe(MODELO_PADRAO);
    expect(aoMedirUso).toHaveBeenCalledWith({ tarefa: "analise", modelo: MODELO_PADRAO, entrada: 10, saida: 20 });
  });

  it("os dados vão na mensagem, e as instruções ficam fixas no system", async () => {
    const { cliente, parse } = clienteCom(RESPOSTA);
    await gerarComClaude(DADOS, { cliente });
    const pedido = parse.mock.calls[0][0];
    expect(pedido.system).toBe(INSTRUCOES_ANALISE);
    const [mensagem] = pedido.messages as Array<{ content: string }>;
    expect(mensagem.content).toContain(`"treinos":4`);
    expect(pedido.fallbacks).toBe("default");
    expect(pedido.betas).toEqual(["server-side-fallback-2026-07-01"]);
    // O Opus 5.5 recusa estes parâmetros com erro 400.
    expect(pedido).not.toHaveProperty("temperature");
    expect(pedido).not.toHaveProperty("thinking");
  });

  it("o Haiku não pede modelo alternativo", async () => {
    const { cliente, parse } = clienteCom(RESPOSTA);
    await gerarComClaude(DADOS, { cliente, modelo: "claude-haiku-5-5" });
    expect(parse.mock.calls[0][0]).not.toHaveProperty("fallbacks");
    expect(parse.mock.calls[0][0]).not.toHaveProperty("betas");
  });

  it.each([
    ["recusa", { ...RESPOSTA, stop_reason: "refusal", parsed_output: null }],
    ["resposta cortada", { ...RESPOSTA, stop_reason: "max_tokens" }],
    ["JSON inválido", { ...RESPOSTA, parsed_output: null }],
    ["resumo vazio", { ...RESPOSTA, parsed_output: { ...RESPOSTA.parsed_output, resumo: " " } }],
  ])("%s vira erro compreensível", async (_nome, resposta) => {
    const { cliente } = clienteCom(resposta);
    const erro = await gerarComClaude(DADOS, { cliente }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDaIA);
    expect(erro.codigo).toBe("unavailable");
  });

  it("a resposta simulada usa os dados recebidos", () => {
    expect(gerarSimulado(DADOS).analise.resumo).toContain("4 treinos");
  });
});
