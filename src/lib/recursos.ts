/** Ligada só depois de publicar a Cloud Function: sem ela, a tela prometeria o que não funciona. */
export const iaAtiva = import.meta.env.VITE_IA_ATIVA === "true";
