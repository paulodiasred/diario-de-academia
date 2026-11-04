/** As telas com a barra inferior. */
export const ROTAS_COM_BARRA = ["/", "/meus-treinos", "/evolucao", "/exercicios"];

export const temBarraInferior = (caminho: string): boolean => ROTAS_COM_BARRA.includes(caminho);

/** O treino tem controles próprios; o resumo já é o fim dele; o formulário tem o Salvar fixo. */
export function mostraTreinoAtivo(caminho: string): boolean {
  return (
    caminho !== "/treino" &&
    !caminho.startsWith("/treino/") &&
    caminho !== "/meus-treinos/criar" &&
    !caminho.startsWith("/meus-treinos/editar/")
  );
}
