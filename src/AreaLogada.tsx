import { lazy, Suspense, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { TelaCarregando } from "@/components/Estados";
import { SessaoAtivaProvider } from "@/components/SessaoAtivaProvider";
import { AvisoFimDescanso } from "@/components/treino/AvisoFimDescanso";
import { MiniTreinoAtivo } from "@/components/treino/MiniTreinoAtivo";
import { useAuth } from "@/hooks/useAuth";
import { useMigracaoLegado } from "@/hooks/useMigracaoLegado";
import { useSessaoAtiva } from "@/hooks/useSessaoAtiva";
import { mostraTreinoAtivo, nomeDaTela, tituloDaPagina } from "@/lib/navegacao";

const Index = lazy(() => import("./pages/Index"));
const MeusTreinos = lazy(() => import("./pages/MeusTreinos"));
const CriarEditarTreino = lazy(() => import("./pages/CriarEditarTreino"));
const Modelos = lazy(() => import("./pages/Modelos"));
const Treino = lazy(() => import("./pages/Treino"));
const ResumoTreino = lazy(() => import("./pages/ResumoTreino"));
const Exercicios = lazy(() => import("./pages/Exercicios"));
const Evolucao = lazy(() => import("./pages/Evolucao"));
const EvolucaoExercicio = lazy(() => import("./pages/EvolucaoExercicio"));
const Planos = lazy(() => import("./pages/Planos"));
const Conta = lazy(() => import("./pages/Conta"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

/** Tela nova começa no topo. Voltar (POP) mantém a posição em que a pessoa estava. */
function RolarAoTopo() {
  const { pathname } = useLocation();
  const tipo = useNavigationType();

  useLayoutEffect(() => {
    if (tipo !== "POP") window.scrollTo(0, 0);
  }, [pathname, tipo]);

  return null;
}

/** Cada tela tem título próprio. Ao navegar, o foco vai para o conteúdo novo e o nome é anunciado. */
function AnuncioDeTela({ conteudo }: { conteudo: RefObject<HTMLElement> }) {
  const { pathname } = useLocation();
  const nome = nomeDaTela(pathname);
  const primeira = useRef(true);

  useEffect(() => {
    document.title = tituloDaPagina(nome);
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    conteudo.current?.focus({ preventScroll: true });
  }, [pathname, nome, conteudo]);

  return (
    <p role="status" className="sr-only">
      {nome}
    </p>
  );
}

/** Reserva o espaço da barra do treino ativo: o fim das telas não fica atrás dela. */
function EspacoTreinoAtivo() {
  const { pathname } = useLocation();
  const { sessao } = useSessaoAtiva();
  return sessao && mostraTreinoAtivo(pathname) ? <div aria-hidden className="h-16" /> : null;
}

function Conteudo() {
  const { user, novoCadastro } = useAuth();
  useMigracaoLegado(user?.uid);
  const conteudo = useRef<HTMLElement>(null);

  return (
    <BrowserRouter>
      <RolarAoTopo />
      <AnuncioDeTela conteudo={conteudo} />
      <main ref={conteudo} tabIndex={-1} className="outline-none">
        <Suspense fallback={<TelaCarregando />}>
          {novoCadastro ? (
            <Onboarding />
          ) : (
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/meus-treinos" element={<MeusTreinos />} />
              <Route path="/meus-treinos/criar" element={<CriarEditarTreino />} />
              <Route path="/meus-treinos/modelos" element={<Modelos />} />
              <Route path="/meus-treinos/editar/:id" element={<CriarEditarTreino />} />
              {/* Endereço antigo da tela de treino: pode estar em favoritos. */}
              <Route path="/meus-treinos/:id" element={<Navigate to="/meus-treinos" replace />} />
              <Route path="/treino" element={<Treino />} />
              <Route path="/treino/resumo/:id" element={<ResumoTreino />} />
              <Route path="/exercicios" element={<Exercicios />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/conta" element={<Conta />} />
              <Route path="/evolucao" element={<Evolucao />} />
              <Route path="/evolucao/exercicio/:nome" element={<EvolucaoExercicio />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </Suspense>
        {!novoCadastro && <EspacoTreinoAtivo />}
      </main>
      <AvisoFimDescanso />
      {!novoCadastro && <MiniTreinoAtivo />}
      {!novoCadastro && <BottomNav />}
    </BrowserRouter>
  );
}

export default function AreaLogada() {
  return (
    <SessaoAtivaProvider>
      <Conteudo />
    </SessaoAtivaProvider>
  );
}
