import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const MeusTreinos = lazy(() => import("./pages/MeusTreinos"));
const CriarEditarTreino = lazy(() => import("./pages/CriarEditarTreino"));
const TreinoPersonalizadoSession = lazy(() => import("./pages/TreinoPersonalizadoSession"));
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

const Carregando = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <Carregando />;

  if (!user) {
    return <AuthForm />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<Carregando />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/meus-treinos" element={<MeusTreinos />} />
          <Route path="/meus-treinos/criar" element={<CriarEditarTreino />} />
          <Route path="/meus-treinos/editar/:id" element={<CriarEditarTreino />} />
          <Route path="/meus-treinos/:id" element={<TreinoPersonalizadoSession />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </BrowserRouter>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
