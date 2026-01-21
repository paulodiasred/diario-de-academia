import { useMemo } from "react";
import { TreinoRegistro } from "@/data/treino";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

interface ProgressChartProps {
  registros: TreinoRegistro[];
}

export function ProgressChart({ registros }: ProgressChartProps) {
  const data = useMemo(() => {
    return registros.slice(-10).map((r) => ({
      data: new Date(r.data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      peso: r.peso,
    }));
  }, [registros]);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Sem dados ainda
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="data"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 11%)",
              border: "1px solid hsl(217, 33%, 25%)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            labelStyle={{ color: "hsl(210, 40%, 98%)" }}
            formatter={(value: number) => [`${value} kg`, "Peso"]}
          />
          <Area
            type="monotone"
            dataKey="peso"
            fill="url(#chartGradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={3}
            dot={{ fill: "hsl(217, 91%, 60%)", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(263, 70%, 58%)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
