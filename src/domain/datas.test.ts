import { describe, expect, it } from "vitest";
import { chaveDiaLocal, mesmoDiaLocal } from "./datas";

describe("datas locais (regressão B11)", () => {
  it("usa o dia do aparelho, não o dia em UTC, à noite", () => {
    expect(chaveDiaLocal(new Date(2026, 10, 3, 23, 59))).toBe("2026-11-03");
  });

  it("completa mês e dia com zero", () => {
    expect(chaveDiaLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("compara por dia local", () => {
    expect(mesmoDiaLocal(new Date(2026, 10, 3, 0, 1), new Date(2026, 10, 3, 23, 59))).toBe(true);
    expect(mesmoDiaLocal(new Date(2026, 10, 3, 23, 59), new Date(2026, 10, 4, 0, 1))).toBe(false);
  });
});
