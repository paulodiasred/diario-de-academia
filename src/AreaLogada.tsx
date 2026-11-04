import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { TelaCarregando } from "@/components/Estados";
import { SessaoAtivaProvider } from "@/components/SessaoAtivaProvider";
import { useAuth } from "@/hooks/useAuth";
import { useMigracaoLegado } from "@/hooks/useMigracaoLegado";

const Index = lazy(() => import("./pages/Index"));
const MeusTreinos = lazy(() => import("./pages/MeusTreinos"));
const CriarEditarTreino = lazy(() => import("./pages/CriarEditarTreino"));
const Treino = lazy(() => import("./pages/Treino"));
const ResumoTreino = lazy(() => import("./pages/ResumoTreino"));
const Exercicios = lazy(() => import("./pages/Exercicios"));
const Evolucao = lazy(() => import("./pages/Evolucao"));
const EvolucaoExercicio = lazy(() => import("./pages/EvolucaoExercicio"));
const Planos = lazy(() => import("./pages/Planos"));
const Conta = lazy(() => import("./pages/Conta"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Conteudo() {
  const { user, novoCadastro } = useAuth();
  useMigracaoLegado(user?.uid);

  return (
    <BrowserRouter>
      <main>
        <Suspense fallback={<TelaCarregando />}>
          {novoCadastro ? (
            <Onboarding />
          ) : (
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/meus-treinos" element={<MeusTreinos />} />
              <Route path="/meus-treinos/criar" element={<CriarEditarTreino />} />
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
      </main>
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
