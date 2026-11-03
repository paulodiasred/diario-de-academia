const MENSAGENS: Record<string, string> = {
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/wrong-password": "Email ou senha incorretos.",
  "auth/user-not-found": "Email ou senha incorretos.",
  "auth/invalid-email": "Digite um email válido.",
  "auth/email-already-in-use": "Este email já está cadastrado. Tente entrar.",
  "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  "auth/network-request-failed": "Sem conexão. Verifique sua internet e tente de novo.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/popup-blocked": "O navegador bloqueou a janela do Google. Libere os pop-ups e tente de novo.",
  "auth/account-exists-with-different-credential": "Este email já usa outro método de login.",
};

export const CANCELAMENTOS_LOGIN = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

export function codigoDoErro(erro: unknown): string | null {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    const { code } = erro as { code: unknown };
    return typeof code === "string" ? code : null;
  }
  return null;
}

export function mensagemErroAuth(erro: unknown): string {
  const codigo = codigoDoErro(erro);
  return (codigo && MENSAGENS[codigo]) || "Não foi possível concluir agora. Tente de novo.";
}
