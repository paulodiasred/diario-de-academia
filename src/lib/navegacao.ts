/** As telas com a barra inferior. */
export const ROTAS_COM_BARRA = ["/", "/meus-treinos", "/evolucao", "/exercicios"];

export const temBarraInferior = (caminho: string): boolean => ROTAS_COM_BARRA.includes(caminho);

const NOME_DO_APP = "Diário de Academia";

const TITULOS: Array<[RegExp, string]> = [
  [/^\/$/, "Início"],
  [/^\/meus-treinos$/, "Meus treinos"],
  [/^\/meus-treinos\/criar$/, "Novo treino"],
  [/^\/meus-treinos\/modelos$/, "Modelos de treino"],
  [/^\/meus-treinos\/editar\//, "Editar treino"],
  [/^\/treino$/, "Treino em andamento"],
  [/^\/treino\/resumo\//, "Resumo do treino"],
  [/^\/exercicios$/, "Exercícios"],
  [/^\/evolucao$/, "Evolução"],
  [/^\/evolucao\/exercicio\//, "Evolução do exercício"],
  [/^\/planos$/, "Planos"],
  [/^\/conta$/, "Minha conta"],
  [/^\/privacidade$/, "Política de privacidade"],
  [/^\/termos$/, "Termos de uso"],
];

/** O nome da tela, para quem usa leitor de tela ou troca de aba no navegador. */
export function nomeDaTela(caminho: string): string {
  return TITULOS.find(([padrao]) => padrao.test(caminho))?.[1] ?? "Página não encontrada";
}

export const tituloDaPagina = (nome: string): string => `${nome} · ${NOME_DO_APP}`;

/** O treino tem controles próprios; o resumo já é o fim dele; o formulário tem o Salvar fixo. */
export function mostraTreinoAtivo(caminho: string): boolean {
  return (
    caminho !== "/treino" &&
    !caminho.startsWith("/treino/") &&
    caminho !== "/meus-treinos/criar" &&
    !caminho.startsWith("/meus-treinos/editar/")
  );
}
