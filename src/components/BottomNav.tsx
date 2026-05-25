import { useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, ListChecks } from "lucide-react";

const navItems = [
  { path: "/", label: "Início", icon: Dumbbell },
  { path: "/meus-treinos", label: "Meus Treinos", icon: ListChecks },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isVisible =
    location.pathname === "/" || location.pathname === "/meus-treinos";

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
      <nav className="glass-card rounded-2xl w-full max-w-md">
        <div className="flex">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-4 rounded-2xl transition-all ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
