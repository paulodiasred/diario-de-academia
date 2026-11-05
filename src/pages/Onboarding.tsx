import { startTransition, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Check, LineChart, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePerfil } from "@/hooks/usePerfil";

const PONTOS = [
  { icone: Check, texto: "Registre cada série com um toque" },
  { icone: Timer, texto: "Descanso cronometrado, sem perder o treino se fechar o app" },
  { icone: LineChart, texto: "Veja sua carga evoluir com seus dados reais" },
];

/** Só aparece logo após o cadastro. Sempre dá para pular. */
const Onboarding = () => {
  const navigate = useNavigate();
  const { concluirOnboarding } = useAuth();
  const { metaSemanal, definirMeta } = usePerfil();
  const [passo, setPasso] = useState(0);

  // O roteador muda o endereço em uma transição. Sem esta, as rotas apareceriam ainda em
  // /entrar, cujo redirecionamento para o início passaria por cima do destino escolhido.
  const concluir = (destino: string) => {
    startTransition(() => {
      concluirOnboarding();
      navigate(destino, { replace: true });
    });
  };

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col">
      <div className="flex justify-between items-center h-11">
        <span className="text-sm text-muted-foreground">Passo {passo + 1} de 3</span>
        <Button variant="ghost" className="h-11" onClick={() => concluir("/")}>
          Pular
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        {passo === 0 && (
          <>
            <div className="space-y-2">
              <img src="/logo.svg" alt="" className="w-14 h-14 mb-2" />
              <h1 className="text-3xl font-bold">Seu treino, sua evolução, seus resultados.</h1>
              <p className="text-muted-foreground">Feito para usar no meio do treino, com o celular na mão.</p>
            </div>
            <ul className="space-y-3">
              {PONTOS.map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-center gap-3">
                  <Icone className="w-5 h-5 text-primary shrink-0" aria-hidden />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
            <Button className="h-12 w-full" onClick={() => setPasso(1)}>
              Começar
            </Button>
          </>
        )}

        {passo === 1 && (
          <>
            <div className="space-y-2">
              <CalendarCheck className="w-8 h-8 text-primary" aria-hidden />
              <h1 className="text-2xl font-bold">Quantas vezes por semana você quer treinar?</h1>
              <p className="text-muted-foreground">É a sua meta. Dá para mudar quando quiser, em Ajustes.</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} treino${n > 1 ? "s" : ""} por semana`}
                  aria-pressed={metaSemanal === n}
                  onClick={() => definirMeta(n)}
                  className={`h-12 rounded-lg font-semibold ${
                    metaSemanal === n ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <Button className="h-12 w-full" onClick={() => setPasso(2)}>
              Continuar
            </Button>
          </>
        )}

        {passo === 2 && (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Agora, sua ficha de treino</h1>
              <p className="text-muted-foreground">
                Comece com um modelo pronto ou passe a sua ficha para cá, do seu jeito. Dá para ajustar tudo depois.
              </p>
            </div>
            <div className="space-y-2">
              <Button className="h-12 w-full" onClick={() => concluir("/meus-treinos/modelos")}>
                Escolher um modelo pronto
              </Button>
              <Button variant="outline" className="h-12 w-full" onClick={() => concluir("/meus-treinos/criar")}>
                Montar minha ficha
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
