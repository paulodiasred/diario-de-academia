import { describe, expect, it, vi } from "vitest";
import { catalogo } from "@/data/catalogo";
import { candidatosDaFicha, type PreferenciasFicha, type RespostaDaFicha } from "@/domain/fichaIA";
import { gerarFichaComClaude, gerarFichaSimulada, INSTRUCOES_FICHA, type OpcoesDoClaude } from "./claude";
import { ErroDaIA } from "./erros";

const PREFERENCIAS: PreferenciasFicha = {
  objetivo: "forca",
  dias: 3,
  local: "academia",
  experiencia: "avancado",
  restricao: false,
};
const candidatos = candidatosDaFicha(catalogo, "academia");
const ids = candidatos.map((c) => c.id);

const resposta = (fichaIds: string[]): RespostaDaFicha => ({
  nome: "Corpo inteiro",
  resumo: "Uma ficha repetida.",
  fichas: [{ nome: "Treino A - Corpo inteiro", exercicios: fichaIds.map((id) => ({ id, series: 4, repeticoes: 5, descansoSeg: 150 })) }],
});

const comoResposta = (parsed: RespostaDaFicha | null, stop_reason = "end_turn") => ({
  model: "claude-opus-5-5",
  stop_reason,
  usage: { input_tokens: 1, output_tokens: 1 },
  parsed_output: parsed,
});

function clienteCom(...respostas: object[]) {
  const parse = vi.fn(async (_pedido: Record<string, unknown>) => respostas.shift());
  return { parse, cliente: { beta: { messages: { parse } } } as unknown as OpcoesDoClaude["cliente"] };
}

describe("ficha pelo Claude", () => {
  it("envia só as respostas de escolha e a lista de opções", async () => {
    const { cliente, parse } = clienteCom(comoResposta(resposta(ids.slice(0, 5))));
    const modelo = await gerarFichaComClaude(PREFERENCIAS, candidatos, { cliente });
    expect(modelo.fichas[0].dias).toEqual(["Segunda", "Quarta", "Sexta"]);

    const pedido = parse.mock.calls[0][0] as { system: string; messages: Array<{ content: string }> };
    expect(pedido.system).toBe(INSTRUCOES_FICHA);
    const conteudo = pedido.messages[0].content;
    expect(conteudo).toContain(`"objetivo":"forca"`);
    expect(conteudo).not.toContain("restricao");
    expect(conteudo).toContain(`${ids[0]}|`);
  });

  it("dá uma chance de corrigir, dizendo o que estava errado", async () => {
    const { cliente, parse } = clienteCom(
      comoResposta(resposta([...ids.slice(0, 4), "Inventado"])),
      comoResposta(resposta(ids.slice(0, 5))),
    );
    const modelo = await gerarFichaComClaude(PREFERENCIAS, candidatos, { cliente });
    expect(modelo.fichas[0].itens).toHaveLength(5);
    expect(parse).toHaveBeenCalledTimes(2);
    const segunda = parse.mock.calls[1][0] as { messages: Array<{ role: string; content: string }> };
    expect(segunda.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(segunda.messages[2].content).toContain("Inventado");
  });

  it("errada duas vezes, desiste com mensagem clara", async () => {
    const errada = comoResposta(resposta(["Inventado", "Outro", "Mais um"]));
    const { cliente, parse } = clienteCom(errada, errada);
    const erro = await gerarFichaComClaude(PREFERENCIAS, candidatos, { cliente }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDaIA);
    expect(erro.codigo).toBe("unavailable");
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("recusa não vira ficha", async () => {
    const { cliente } = clienteCom(comoResposta(null, "refusal"));
    const erro = await gerarFichaComClaude(PREFERENCIAS, candidatos, { cliente }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDaIA);
  });

  it.each([2, 3, 4, 5, 6])("a simulação passa pela validação com %i dias", (dias) => {
    for (const local of ["academia", "halteres", "casa"] as const) {
      const modelo = gerarFichaSimulada({ ...PREFERENCIAS, dias, local }, candidatosDaFicha(catalogo, local));
      expect(modelo.fichas.length).toBe(Math.min(dias, 3));
    }
  });
});
