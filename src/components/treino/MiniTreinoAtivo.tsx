import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Timer } from "lucide-react";
import { contarSeriesPendentes } from "@/domain/sessao";
import { formatarTempo } from "@/domain/texto";
import { useSessaoAtiva } from "@/hooks/useSessaoAtiva";
import { useTempoDescanso } from "@/hooks/useTempoDescanso";
import { mostraTreinoAtivo, temBarraInferior } from "@/lib/navegacao";

/** Sempre à vista fora da tela de treino: um treino interrompido nunca fica escondido. */
export function MiniTreinoAtivo() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sessao } = useSessaoAtiva();
  const { terminou, restante, rodando } = useTempoDescanso(sessao?.descanso ?? null);

  if (!sessao || !mostraTreinoAtivo(pathname)) return null;

  const pendentes = contarSeriesPendentes(sessao);
  const detalhe = terminou
    ? "Hora da próxima série"
    : sessao.descanso
      ? `Descanso ${formatarTempo(restante)}${rodando ? "" : " (pausado)"}`
      : `${pendentes} série${pendentes !== 1 ? "s" : ""} pendente${pendentes !== 1 ? "s" : ""}`;

  return (
    <div
      className={`fixed left-0 right-0 z-40 flex justify-center px-4 ${
        temBarraInferior(pathname) ? "bottom-[5.75rem]" : "bottom-3"
      }`}
    >
      <button
        type="button"
        onClick={() => navigate("/treino")}
        className="w-full max-w-[416px] text-left rounded-xl px-3 py-2 bg-primary text-primary-foreground flex items-center gap-2.5 shadow-lg"
      >
        <Timer aria-hidden className="w-5 h-5 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold truncate">Continuar {sessao.nome}</span>
          <span className="block text-caption tabular-nums">{detalhe}</span>
        </span>
        <ChevronRight aria-hidden className="w-5 h-5 shrink-0" />
      </button>
    </div>
  );
}
