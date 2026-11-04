import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Com sinal ruim, o catálogo demora: o painel abre na hora, em vez de parecer que o toque falhou. */
export function CatalogoCarregando({ onFechar }: { onFechar: () => void }) {
  return (
    <Sheet open onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left text-lg font-bold">Catálogo de Exercícios</SheetTitle>
        </SheetHeader>
        <div role="status" aria-label="Carregando exercícios" className="pt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
