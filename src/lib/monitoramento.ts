type Sentry = typeof import("@sentry/react");

let carregando: Promise<Sentry> | null = null;

const EMAIL = /[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/g;

/** Mensagens de erro de terceiros podem citar o email da conta. */
export function semEmail(texto: string): string {
  return texto.replace(EMAIL, "[email removido]");
}

/**
 * Relatórios de erro. Sem VITE_SENTRY_DSN, nada é carregado nem enviado.
 * Só o erro técnico sai do aparelho: sem nome, email, cliques nem dados de treino.
 * Isto é o que a política de privacidade promete: altere os dois juntos.
 */
export function iniciarMonitoramento(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || carregando) return;
  carregando = import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      // O padrão do Sentry é coletar tudo isto: cada item precisa ser desligado.
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        stackFrameVariables: false,
      },
      // O histórico de cliques e de mensagens no console pode conter dados da pessoa.
      beforeBreadcrumb: () => null,
      beforeSend: (evento) => {
        if (evento.message) evento.message = semEmail(evento.message);
        for (const excecao of evento.exception?.values ?? []) {
          if (excecao.value) excecao.value = semEmail(excecao.value);
        }
        return evento;
      },
    });
    return Sentry;
  });
  carregando.catch((erro) => console.warn("Monitoramento de erros indisponível:", erro));
}

export function relatarErro(erro: unknown, contexto?: Record<string, string>): void {
  void carregando?.then((Sentry) => Sentry.captureException(erro, contexto && { extra: contexto })).catch(() => undefined);
}
