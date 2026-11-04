import { useContext } from "react";
import { SessaoAtivaContext } from "@/contexts/SessaoAtivaContext";

export function useSessaoAtiva() {
  const contexto = useContext(SessaoAtivaContext);
  if (contexto === undefined) {
    throw new Error("useSessaoAtiva precisa estar dentro de SessaoAtivaProvider");
  }
  return contexto;
}
