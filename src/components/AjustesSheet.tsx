import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useInstalarApp } from "@/hooks/useInstalarApp";
import { usePerfil } from "@/hooks/usePerfil";
import { avisoLigado, avisoSuportado, desligarAviso, ligarAviso } from "@/lib/avisoDescanso";
import { definirSom, prepararSom, somLigado, somSuportado, tocarSomDescanso } from "@/lib/somDescanso";
import { toast } from "sonner";

const TEMAS = [
  { valor: "dark", rotulo: "Escuro" },
  { valor: "light", rotulo: "Claro" },
  { valor: "system", rotulo: "Sistema" },
];

const classeOpcao = (ativa: boolean) =>
  `h-11 rounded-lg text-sm font-medium border transition-colors ${
    ativa
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-secondary/40 text-foreground border-transparent"
  }`;

interface AjustesSheetProps {
  aberto: boolean;
  onFechar: () => void;
}

export function AjustesSheet({ aberto, onFechar }: AjustesSheetProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { metaSemanal, definirMeta } = usePerfil();
  const { podeInstalar, mostrarDicaIos, instalar } = useInstalarApp();
  const [avisar, setAvisar] = useState(avisoLigado);
  const [som, setSom] = useState(somLigado);

  const alternarAviso = async (ligar: boolean) => {
    if (!ligar) {
      desligarAviso();
      setAvisar(false);
      return;
    }
    const permitido = await ligarAviso();
    setAvisar(permitido);
    if (!permitido) toast.error("O navegador não permitiu notificações.");
  };

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">Ajustes</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Meta: treinos por semana</legend>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} treino${n > 1 ? "s" : ""} por semana`}
                  aria-pressed={metaSemanal === n}
                  onClick={() => definirMeta(n)}
                  className={classeOpcao(metaSemanal === n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium mb-2">Aparência</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMAS.map(({ valor, rotulo }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={theme === valor}
                  onClick={() => setTheme(valor)}
                  className={classeOpcao(theme === valor)}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </fieldset>

          {somSuportado() && (
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="som-descanso" className="text-sm font-medium">
                Som no fim do descanso
                <span className="block text-[13px] font-normal text-muted-foreground">
                  Com o app na tela. No iPhone, o modo silencioso desliga o som.
                </span>
              </label>
              <Switch
                id="som-descanso"
                checked={som}
                onCheckedChange={(ligado) => {
                  definirSom(ligado);
                  setSom(ligado);
                  // O toque no botão libera o áudio, e o bipe confirma o volume.
                  if (ligado) {
                    prepararSom();
                    tocarSomDescanso();
                  }
                }}
              />
            </div>
          )}

          {avisoSuportado() && (
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="avisar-descanso" className="text-sm font-medium">
                Avisar o fim do descanso
                <span className="block text-[13px] font-normal text-muted-foreground">
                  Com o app aberto em segundo plano. O sistema pode suspender o app e impedir o aviso.
                </span>
              </label>
              <Switch id="avisar-descanso" checked={avisar} onCheckedChange={(v) => void alternarAviso(v)} />
            </div>
          )}

          {podeInstalar && (
            <Button variant="outline" className="w-full h-11" onClick={() => void instalar()}>
              Instalar o app
            </Button>
          )}
          {mostrarDicaIos && (
            <p className="text-[13px] text-muted-foreground">
              Para instalar no iPhone: no Safari, toque em Compartilhar e em Adicionar à Tela de Início.
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate("/conta")}
            className="w-full h-11 flex items-center justify-between text-sm font-medium"
          >
            Minha conta, planos e dados
            <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
