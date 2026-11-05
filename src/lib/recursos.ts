/** Ligadas só depois de publicar as Cloud Functions: sem elas, a tela prometeria o que não funciona. */
export const iaAtiva = import.meta.env.VITE_IA_ATIVA === "true";

/** Separada da análise: a ficha montada por IA ainda depende de revisão jurídica. */
export const fichasIaAtiva = import.meta.env.VITE_FICHAS_IA_ATIVA === "true";
