import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { relatarErro } from "@/lib/monitoramento";

interface Props {
  children: ReactNode;
}

interface State {
  temErro: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { temErro: false };

  static getDerivedStateFromError(): State {
    return { temErro: true };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("Erro não tratado na interface:", erro, info.componentStack);
    relatarErro(erro, { componentes: info.componentStack ?? "" });
  }

  render() {
    if (!this.state.temErro) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-lg font-semibold">Algo deu errado nesta tela</p>
          <p className="text-sm text-muted-foreground">
            Seus treinos registrados continuam salvos. Recarregue para continuar.
          </p>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </div>
      </div>
    );
  }
}
