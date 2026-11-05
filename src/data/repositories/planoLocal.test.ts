import { beforeEach, describe, expect, it } from "vitest";
import { temPremium } from "@/domain/planos";
import { guardarPlano, lerPlanoGuardado, limparPlanosGuardados } from "./planoLocal";

describe("plano guardado no aparelho", () => {
  beforeEach(() => localStorage.clear());

  it("devolve o último plano confirmado da mesma conta", () => {
    guardarPlano("a", { plano: "premium", expiraEm: null });
    expect(lerPlanoGuardado("a")).toEqual({ plano: "premium", expiraEm: null });
    expect(lerPlanoGuardado("b")).toBeNull();
  });

  it("assinatura vencida não vale, mesmo guardada", () => {
    guardarPlano("a", { plano: "premium", expiraEm: "2020-01-01T00:00:00.000Z" });
    expect(temPremium(lerPlanoGuardado("a")!)).toBe(false);
  });

  it("sair da conta apaga", () => {
    guardarPlano("a", { plano: "premium", expiraEm: null });
    limparPlanosGuardados();
    expect(lerPlanoGuardado("a")).toBeNull();
  });

  it("valor corrompido não quebra", () => {
    localStorage.setItem("diario:plano:a", "{quebrado");
    expect(lerPlanoGuardado("a")).toBeNull();
  });
});
