import { useNavigate } from "react-router-dom";
import { Cabecalho } from "@/components/Cabecalho";
import { COMPARACAO_PLANOS } from "@/domain/planos";
import { usePlano } from "@/hooks/usePlano";

const Planos = () => {
  const navigate = useNavigate();
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
