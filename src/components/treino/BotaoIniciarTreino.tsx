import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { toast } from "@/lib/aviso";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessaoAtiva } from "@/hooks/useSessaoAtiva";
import type { TreinoPersonalizado } from "@/types/catalogo";

interface BotaoIniciarTreinoProps {
  treino: TreinoPersonalizado;
  /** A ação principal da tela. Em listas, o botão fica discreto. */
  destaque?: boolean;
  /** Texto no lugar de "Iniciar". */
  rotulo?: string;
  className?: string;
}

export function BotaoIniciarTreino({ treino, destaque = false, rotulo = "Iniciar", className }: BotaoIniciarTreinoProps) {
  const navigate = useNavigate();
  const { sessao, iniciar, descartar } = useSessaoAtiva();
  const [conflito, setConflito] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  const comecar = async () => {
    setIniciando(true);
    try {
      await iniciar(treino);
      navigate("/treino");
    } catch (erro) {
      console.error("Erro ao iniciar o treino:", erro);
      toast.error("Não foi possível iniciar o treino.");
    } finally {
      setIniciando(false);
    }
  };

  const aoTocar = () => {
    if (!sessao) void comecar();
    else if (sessao.treinoId === treino.id) navigate("/treino");
    else setConflito(true);
  };

  return (
    <>
      <Button
        onClick={aoTocar}
        disabled={iniciando}
        variant={destaque ? "default" : "secondary"}
        className={`gap-1.5 ${className ?? ""}`}
      >
        <Play className="w-4 h-4" />
        {sessao?.treinoId === treino.id ? "Continuar" : rotulo}
      </Button>

      <AlertDialog open={conflito} onOpenChange={setConflito}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Há um treino em andamento</AlertDialogTitle>
            <AlertDialogDescription>
              "{sessao?.nome}" ainda não foi finalizado. Se você descartar, as séries dele não
              entram no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate("/treino")}>
              Continuar o atual
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                descartar();
                void comecar();
              }}
            >
              Descartar e iniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
