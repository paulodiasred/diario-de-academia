import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AtualizacaoApp } from "@/components/AtualizacaoApp";
import { AuthForm } from "@/components/AuthForm";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TelaCarregando } from "@/components/Estados";
import { useAuth } from "@/hooks/useAuth";

// O banco de dados e as telas só carregam depois do login: a primeira tela abre mais rápido.
const AreaLogada = lazy(() => import("./AreaLogada"));
const Privacidade = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Privacidade })));
const Termos = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Termos })));

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
  const { user, loading } = useAuth();

  // Públicas: precisam abrir antes de a pessoa ter conta.
  const caminho = window.location.pathname;
  if (caminho === "/privacidade" || caminho === "/termos") {
    return (
      <Suspense fallback={<TelaCarregando />}>
        {caminho === "/privacidade" ? <Privacidade /> : <Termos />}
      </Suspense>
    );
  }

  if (loading) return <TelaCarregando />;
  if (!user) return <AuthForm />;

  return (
    <Suspense fallback={<TelaCarregando />}>
      <AreaLogada />
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Sonner />
          <AtualizacaoApp />
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
