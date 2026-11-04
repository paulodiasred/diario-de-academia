import type { ReactNode } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Cores por token: seguem o tema. A primária foi validada contra as duas superfícies. */
const COR_SERIE = "hsl(var(--grafico))";
const COR_GRADE = "hsl(var(--border))";
const COR_TEXTO = "hsl(var(--muted-foreground))";
const COR_SUPERFICIE = "hsl(var(--card))";

const eixo = {
  axisLine: false,
  tickLine: false,
  tick: { fill: COR_TEXTO, fontSize: 11, style: { fontVariantNumeric: "tabular-nums" } },
};

const estiloTooltip = {
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    border: `1px solid ${COR_GRADE}`,
    borderRadius: 12,
    fontSize: 13,
  },
  labelStyle: { color: "hsl(var(--popover-foreground))" },
  itemStyle: { color: "hsl(var(--popover-foreground))" },
};

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export interface PontoGrafico {
  rotulo: string;
  valor: number;
}

interface GraficoProps {
  /** Nome da medida, usado na dica e na tabela. */
  medida: string;
  unidade?: string;
  dados: PontoGrafico[];
  vazio?: string;
}

/** O gráfico nunca é a única forma de ler os valores. */
function TabelaDoGrafico({ medida, unidade, dados }: GraficoProps) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer py-2 text-[13px] text-muted-foreground">Ver dados</summary>
      <table className="w-full text-left tabular-nums">
        <thead>
          <tr className="text-[13px] text-muted-foreground">
            <th className="py-1 font-medium">Período</th>
            <th className="py-1 font-medium text-right">{medida}</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d, i) => (
            <tr key={`${d.rotulo}-${i}`} className="border-t border-border/60">
              <td className="py-1">{d.rotulo}</td>
              <td className="py-1 text-right">
                {d.valor.toLocaleString("pt-BR")}
                {unidade ? ` ${unidade}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

const AvisoSemDados = ({ children }: { children: ReactNode }) => (
  <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>
);

/** Mudança ao longo do tempo. Com menos de dois pontos não há linha a mostrar. */
export function GraficoLinha(props: GraficoProps) {
  const { medida, unidade, dados, vazio } = props;
  if (dados.length < 2) {
    return (
      <AvisoSemDados>
        {vazio ?? "Registre pelo menos dois treinos deste exercício para ver a evolução."}
      </AvisoSemDados>
    );
  }
  return (
    <figure>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dados}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke={COR_GRADE} />
            <XAxis dataKey="rotulo" {...eixo} minTickGap={16} />
            <YAxis {...eixo} domain={["auto", "auto"]} tickFormatter={(v) => compacto.format(v)} />
            <Tooltip
              {...estiloTooltip}
              cursor={{ stroke: COR_TEXTO, strokeWidth: 1 }}
              formatter={(valor: number) => [
                `${valor.toLocaleString("pt-BR")}${unidade ? ` ${unidade}` : ""}`,
                medida,
              ]}
            />
            <Area
              type="monotone"
              dataKey="valor"
              fill={COR_SERIE}
              fillOpacity={0.1}
              stroke="none"
              isAnimationActive={false}
              tooltipType="none"
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke={COR_SERIE}
              strokeWidth={2}
              dot={{ r: 4, fill: COR_SERIE, stroke: COR_SUPERFICIE, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: COR_SERIE, stroke: COR_SUPERFICIE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <TabelaDoGrafico {...props} />
    </figure>
  );
}

/** Quantidades por período. Uma série só: sem legenda, o título do cartão a identifica. */
export function GraficoColunas(props: GraficoProps) {
  const { medida, unidade, dados, vazio } = props;
  if (dados.every((d) => d.valor === 0)) {
    return <AvisoSemDados>{vazio ?? "Ainda não há dados neste período."}</AvisoSemDados>;
  }
  return (
    <figure>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            barCategoryGap={4}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke={COR_GRADE} />
            <XAxis dataKey="rotulo" {...eixo} minTickGap={8} />
            <YAxis {...eixo} allowDecimals={false} tickFormatter={(v) => compacto.format(v)} />
            <Tooltip
              {...estiloTooltip}
              cursor={{ fill: COR_GRADE, fillOpacity: 0.4 }}
              formatter={(valor: number) => [
                `${valor.toLocaleString("pt-BR")}${unidade ? ` ${unidade}` : ""}`,
                medida,
              ]}
            />
            <Bar
              dataKey="valor"
              fill={COR_SERIE}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TabelaDoGrafico {...props} />
    </figure>
  );
}
