import { describe, expect, it } from "vitest";
import { mostraTreinoAtivo, nomeDaTela, temBarraInferior, tituloDaPagina } from "./navegacao";

describe("navegação", () => {
  it.each([
    ["/", "Início"],
    ["/meus-treinos", "Meus treinos"],
    ["/meus-treinos/modelos", "Modelos de treino"],
    ["/meus-treinos/editar/abc", "Editar treino"],
    ["/treino", "Treino em andamento"],
    ["/treino/resumo/abc", "Resumo do treino"],
    ["/evolucao/exercicio/Supino", "Evolução do exercício"],
    ["/nao-existe", "Página não encontrada"],
  ])("%s se chama %s", (caminho, nome) => {
    expect(nomeDaTela(caminho)).toBe(nome);
  });

  it("o título da página leva o nome da tela e do app", () => {
    expect(tituloDaPagina("Planos")).toBe("Planos · Diário de Academia");
  });

  it("só as quatro abas têm barra inferior", () => {
    expect(temBarraInferior("/evolucao")).toBe(true);
    expect(temBarraInferior("/conta")).toBe(false);
  });

  it("a barra de treino ativo não aparece onde atrapalharia", () => {
    expect(mostraTreinoAtivo("/")).toBe(true);
    expect(mostraTreinoAtivo("/conta")).toBe(true);
    expect(mostraTreinoAtivo("/treino")).toBe(false);
    expect(mostraTreinoAtivo("/treino/resumo/abc")).toBe(false);
    expect(mostraTreinoAtivo("/meus-treinos/criar")).toBe(false);
    expect(mostraTreinoAtivo("/meus-treinos/editar/abc")).toBe(false);
  });
});
