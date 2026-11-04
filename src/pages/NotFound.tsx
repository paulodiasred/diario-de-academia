import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">O endereço não existe ou mudou de lugar.</p>
        <Button className="h-11" onClick={() => navigate("/", { replace: true })}>
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
