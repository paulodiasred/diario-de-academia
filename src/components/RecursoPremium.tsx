import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecursoPremiumProps {
  titulo: string;
  descricao: string;
}

/** O que o recurso faria, sem mostrar números falsos no lugar dos dados. */
export function RecursoPremium({ titulo, descricao }: RecursoPremiumProps) {
  const navigate = useNavigate();
  return (
    <section className="glass-card rounded-xl p-4 flex items-center gap-3">
      <Lock className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>
      <Button variant="outline" className="h-11 shrink-0" onClick={() => navigate("/planos")}>
        Ver planos
      </Button>
    </section>
  );
}
