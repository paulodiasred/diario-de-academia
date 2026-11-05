import { useEffect } from "react";
import { Check, ClipboardList, LineChart, WifiOff } from "lucide-react";
import { EMAIL_CONTATO } from "@/lib/contato";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BENEFICIOS = [
  {
    icone: Check,
    titulo: "Uma série, um toque",
    texto: "A carga da última vez já vem preenchida. Você só confirma, e o descanso começa sozinho.",
  },
  {
    icone: ClipboardList,
    titulo: "Sua ficha, em poucos minutos",
    texto: "Use um modelo pronto ou passe a sua ficha. A busca entende voador, extensora, stiff e serrote.",
  },
  {
    icone: WifiOff,
    titulo: "Funciona sem sinal",
    texto: "Depois do primeiro acesso, treine sem internet. Tudo sincroniza quando o sinal voltar.",
  },
  {
    icone: LineChart,
    titulo: "Evolução com dados reais",
    texto: "Veja sua carga subir, seus recordes e o calendário de treinos, sem números inventados.",
  },
];

const PERGUNTAS = [
  {
    pergunta: "Preciso baixar na loja de aplicativos?",
    resposta:
      "Não. O app abre direto no navegador e pode ser adicionado à tela inicial do celular, em poucos toques.",
  },
  {
    pergunta: "Quanto custa?",
    resposta:
      "O plano gratuito permite até 4 treinos e 10 exercícios próprios. O Premium ainda está em teste, sem nenhuma cobrança, e o acesso é liberado a pedido.",
  },
  {
    pergunta: "Os dados são meus?",
    resposta:
      "Sim. Você baixa uma cópia de tudo quando quiser, em qualquer plano, e pode excluir a conta pelo próprio app.",
  },
  {
    pergunta: "O app monta o treino para mim?",
    resposta:
      "Ele oferece modelos comuns como ponto de partida, mas não prescreve treinos nem substitui um profissional de educação física.",
  },
];

/** A primeira impressão de quem ainda não tem conta. Só promete o que o app já faz. */
const Landing = () => {
  useEffect(() => {
    document.title = "Diário de Academia: sua ficha de treino no celular";
  }, []);

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-2.5">
        <img src="/logo.svg" alt="" className="w-8 h-8" />
        <span className="flex-1 font-bold">Diário de Academia</span>
        <a href="/entrar" className={buttonVariants({ variant: "ghost" })}>
          Entrar
        </a>
      </header>

      <main>
        <section className="max-w-5xl mx-auto px-4 pt-6 pb-12 grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Sua ficha de treino no celular, sem papel e sem planilha
            </h1>
            <p className="text-lg text-muted-foreground">
              Registre cada série com um toque, descanse com o cronômetro certo e veja sua carga evoluir. Feito
              para usar entre uma série e outra, com uma mão.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a href="/entrar?modo=cadastro" className={cn(buttonVariants({ size: "lg" }), "sm:px-8")}>
                Criar conta grátis
              </a>
              <a href="/entrar" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Já tenho conta
              </a>
            </div>
            <p className="text-sm text-muted-foreground">Sem cartão de crédito.</p>
          </div>
          <img
            src="/landing-treino.png"
            width={390}
            height={844}
            alt="Tela de treino do app: séries com carga e repetições, botão para concluir e cronômetro de descanso"
            className="mx-auto w-full max-w-[300px] rounded-3xl border border-border shadow-lg"
          />
        </section>

        <section aria-labelledby="beneficios" className="max-w-5xl mx-auto px-4 pb-12">
          <h2 id="beneficios" className="text-2xl font-bold mb-4">
            Feito para o meio do treino
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BENEFICIOS.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="glass-card rounded-xl p-4 flex gap-3">
                <Icone aria-hidden className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block text-sm text-muted-foreground">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="perguntas" className="max-w-5xl mx-auto px-4 pb-12">
          <h2 id="perguntas" className="text-2xl font-bold mb-4">
            Perguntas frequentes
          </h2>
          <dl className="grid gap-4 md:grid-cols-2">
            {PERGUNTAS.map(({ pergunta, resposta }) => (
              <div key={pergunta}>
                <dt className="font-semibold">{pergunta}</dt>
                <dd className="text-sm text-muted-foreground">{resposta}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-12 text-center space-y-3">
          <h2 className="text-2xl font-bold">Passe sua ficha para o celular hoje</h2>
          <a href="/entrar?modo=cadastro" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto sm:px-8")}>
            Criar conta grátis
          </a>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <a className="underline py-2" href="/termos">
            Termos de uso
          </a>
          <a className="underline py-2" href="/privacidade">
            Política de privacidade
          </a>
          <a className="underline py-2" href={`mailto:${EMAIL_CONTATO}`}>
            Contato
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
