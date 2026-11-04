import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Home, LineChart, ListChecks } from "lucide-react";
import { temBarraInferior } from "@/lib/navegacao";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/meus-treinos", label: "Treinos", icon: ListChecks },
  { path: "/evolucao", label: "Evolução", icon: LineChart },
  { path: "/exercicios", label: "Exercícios", icon: BookOpen },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!temBarraInferior(location.pathname)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
      <nav className="glass-card rounded-xl w-full max-w-md">
        <div className="flex">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 min-w-0 rounded-xl transition-all ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[13px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
