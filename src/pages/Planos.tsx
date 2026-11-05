import { useNavigate } from "react-router-dom";
import { Cabecalho } from "@/components/Cabecalho";
import { buttonVariants } from "@/components/ui/button";
import { COMPARACAO_PLANOS, LINHA_ANALISE_IA } from "@/domain/planos";
import { iaAtiva } from "@/lib/recursos";
import { useAuth } from "@/hooks/useAuth";
import { usePlano } from "@/hooks/usePlano";
import { linkPedidoPremium } from "@/lib/contato";
import { cn } from "@/lib/utils";

const Planos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { premium } = usePlano();

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
      <Cabecalho
        titulo="Planos"
        subtitulo={`Seu plano: ${premium ? "Premium" : "Gratuito"}`}
        onVoltar={() => navigate(-1)}
      />

      <section aria-label="Comparação de planos" className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-caption text-muted-foreground">
              <th className="p-3 font-medium">Recurso</th>
              <th className="p-3 font-medium">Gratuito</th>
              <th className="p-3 font-medium">Premium</th>
            </tr>
          </thead>
          <tbody>
            {(iaAtiva ? [...COMPARACAO_PLANOS, LINHA_ANALISE_IA] : COMPARACAO_PLANOS).map((linha) => (
              <tr key={linha.recurso} className="border-t border-border/60 align-top">
                <td className="p-3">{linha.recurso}</td>
                <td className="p-3 text-muted-foreground">{linha.gratuito}</td>
                <td className="p-3 font-medium">{linha.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {!premium && (
        <section aria-label="Pedir o Premium" className="glass-card rounded-xl p-4 space-y-3">
          <div>
            <h2 className="font-semibold">Quer testar o Premium?</h2>
            <p className="text-sm text-muted-foreground">
              O Premium ainda não está à venda: nenhuma cobrança é feita. Durante o beta, o acesso é
              liberado a pedido.
            </p>
          </div>
          <a href={linkPedidoPremium(user?.email)} className={cn(buttonVariants(), "w-full")}>
            Pedir acesso por email
          </a>
        </section>
      )}
    </div>
  );
};

export default Planos;
