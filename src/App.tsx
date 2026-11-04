import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";
import { BottomNav } from "@/components/BottomNav";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TelaCarregando } from "@/components/Estados";
import { SessaoAtivaProvider } from "@/components/SessaoAtivaProvider";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sem isso, as consultas ficam paradas offline e o cache local do Firestore não é usado.
      networkMode: "offlineFirst",
      // As telas compartilham o cache: trocar de tela não relê todo o histórico.
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { user, loading, novoCadastro } = useAuth();
  useMigracaoLegado(user?.uid);

  if (loading) return <TelaCarregando />;

  if (!user) {
    return <AuthForm />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<TelaCarregando />}>
        {novoCadastro ? <Onboarding /> : (
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        )}
      </Suspense>
      {!novoCadastro && <BottomNav />}
    </BrowserRouter>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <SessaoAtivaProvider>
                <AppContent />
              </SessaoAtivaProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
