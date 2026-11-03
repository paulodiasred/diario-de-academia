import { describe, expect, it } from "vitest";
import { codigoDoErro, mensagemErroAuth } from "./errosAuth";

describe("mensagemErroAuth", () => {
  it("traduz erros conhecidos", () => {
    expect(mensagemErroAuth({ code: "auth/weak-password" })).toContain("6 caracteres");
  });

  it("não revela se o email existe", () => {
    expect(mensagemErroAuth({ code: "auth/user-not-found" })).toBe(
      mensagemErroAuth({ code: "auth/wrong-password" }),
    );
  });

  it("nunca mostra a mensagem crua do Firebase", () => {
    const mensagem = mensagemErroAuth(new Error("Firebase: Error (auth/internal-error)."));
    expect(mensagem).not.toContain("Firebase");
  });

  it("codigoDoErro tolera valores inesperados", () => {
    expect(codigoDoErro(null)).toBeNull();
    expect(codigoDoErro("texto")).toBeNull();
  });
});
