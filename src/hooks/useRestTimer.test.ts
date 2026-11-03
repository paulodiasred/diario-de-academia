import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRestTimer } from "./useRestTimer";

describe("useRestTimer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const avancar = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  it("pausar e retomar mantém o tempo restante (regressão B6)", () => {
    const { result } = renderHook(() => useRestTimer(60));
    act(() => result.current.iniciar());
    avancar(20_000);
    expect(result.current.restante).toBe(40);

    act(() => result.current.pausar());
    expect(result.current).toMatchObject({ ativo: false, pausado: true, restante: 40 });

    avancar(30_000);
    expect(result.current.restante).toBe(40);

    act(() => result.current.retomar());
    avancar(10_000);
    expect(result.current).toMatchObject({ ativo: true, pausado: false, restante: 30 });
  });

  it("avisa uma vez ao terminar", () => {
    const aoTerminar = vi.fn();
    const { result } = renderHook(() => useRestTimer(5, aoTerminar));
    act(() => result.current.iniciar());
    avancar(6_000);
    expect(result.current).toMatchObject({ ativo: false, pausado: false, restante: 0 });
    expect(aoTerminar).toHaveBeenCalledTimes(1);
  });

  it("resetar volta à duração completa", () => {
    const { result } = renderHook(() => useRestTimer(60));
    act(() => result.current.iniciar());
    avancar(10_000);
    act(() => result.current.resetar());
    expect(result.current).toMatchObject({ ativo: false, pausado: false, restante: 60 });
  });

  it("calcula pelo relógio, mesmo se os ticks atrasarem em segundo plano", () => {
    const { result } = renderHook(() => useRestTimer(60));
    act(() => result.current.iniciar());
    vi.setSystemTime(Date.now() + 45_000);
    avancar(500);
    expect(result.current.restante).toBeLessThanOrEqual(15);
  });
});
