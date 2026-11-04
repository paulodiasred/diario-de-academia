import { lazy } from "react";

// Recharts é pesado: a tela abre primeiro e o gráfico chega em seguida.
export const GraficoLinha = lazy(() =>
  import("./Graficos").then((m) => ({ default: m.GraficoLinha })),
);
export const GraficoColunas = lazy(() =>
  import("./Graficos").then((m) => ({ default: m.GraficoColunas })),
);

export const preCarregarGraficos = () => import("./Graficos");
