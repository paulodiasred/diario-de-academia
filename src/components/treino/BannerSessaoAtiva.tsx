import { useNavigate } from "react-router-dom";
import { ChevronRight, Timer } from "lucide-react";
import { contarSeriesPendentes } from "@/domain/sessao";
import { useSessaoAtiva } from "@/hooks/useSessaoAtiva";

/** Aviso de recuperação: um treino interrompido nunca fica escondido. */
export function BannerSessaoAtiva() {
  const navigate = useNavigate();
  const { sessao } = useSessaoAtiva();
  if (!sessao) return null;

  const pendentes = contarSeriesPendentes(sessao);

  return (
    <button
      type="button"
      onClick={() => navigate("/treino")}
      className="w-full text-left rounded-xl p-4 bg-primary text-primary-foreground flex items-center gap-3"
    >
      <Timer className="w-6 h-6 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate">Continuar {sessao.nome}</span>
        <span className="block text-sm opacity-90">
          Treino em andamento · {pendentes} série{pendentes !== 1 ? "s" : ""} pendente
          {pendentes !== 1 ? "s" : ""}
        </span>
      </span>
      <ChevronRight className="w-5 h-5 shrink-0" />
    </button>
  );
}
