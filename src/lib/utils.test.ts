import { describe, expect, it } from "vitest";
import { getExerciseImageUrl } from "./utils";

describe("getExerciseImageUrl", () => {
  it("treinos já salvos guardam .jpg, e a foto agora é .webp", () => {
    expect(getExerciseImageUrl("3_4_Sit-Up/0.jpg")).toBe("/exercises-img/3_4_Sit-Up/0.webp");
  });

  it("não troca nada além da extensão final", () => {
    expect(getExerciseImageUrl("a.jpg.b/0.jpg")).toBe("/exercises-img/a.jpg.b/0.webp");
    expect(getExerciseImageUrl("Pasta/1.webp")).toBe("/exercises-img/Pasta/1.webp");
  });
});
