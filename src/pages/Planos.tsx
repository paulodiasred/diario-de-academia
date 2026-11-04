import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPARACAO_PLANOS } from "@/domain/planos";
import { usePlano } from "@/hooks/usePlano";

const Planos = () => {
  const navigate = useNavigate();
  const { premium } = usePlano();

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
      <header className="pt-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Planos</h1>
          <p className="text-sm text-muted-foreground">
            Seu plano: {premium ? "Premium" : "Gratuito"}
          </p>
        </div>
      </header>

      <section aria-label="Comparação de planos" className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[13px] text-muted-foreground">
              <th className="p-3 font-medium">Recurso</th>
              <th className="p-3 font-medium">Gratuito</th>
              <th className="p-3 font-medium">Premium</th>
            </tr>
          </thead>
          <tbody>
            {COMPARACAO_PLANOS.map((linha) => (
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
        <p className="text-sm text-muted-foreground">
          O Premium ainda não está à venda: nenhuma cobrança é feita. Durante o beta, o acesso é
          liberado manualmente.
        </p>
      )}
    </div>
  );
};

export default Planos;
