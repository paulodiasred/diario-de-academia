export type CodigoDeErro =
  | "invalid-argument"
  | "permission-denied"
  | "failed-precondition"
  | "resource-exhausted"
  | "unavailable";

/** Falha que a pessoa pode entender. A mensagem é mostrada no app. */
export class ErroDaIA extends Error {
  constructor(
    readonly codigo: CodigoDeErro,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroDaIA";
  }
}

export const INDISPONIVEL = "Não foi possível falar com a IA agora. Tente de novo mais tarde.";
