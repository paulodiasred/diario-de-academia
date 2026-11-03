import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  mensagem: string;
  onTentarNovamente: () => void;
}

/** Falha de carregamento não pode parecer conta vazia: os dados continuam salvos. */
export function ErrorState({ mensagem, onTentarNovamente }: ErrorStateProps) {
  return (
    <div role="alert" className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-xs">
        <CloudOff className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="font-semibold">{mensagem}</p>
        <p className="text-sm text-muted-foreground">
          Seus dados não foram perdidos. Verifique a conexão e tente de novo.
        </p>
        <Button onClick={onTentarNovamente}>Tentar novamente</Button>
      </div>
    </div>
  );
}
