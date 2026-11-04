import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePerfil } from "@/hooks/usePerfil";

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
