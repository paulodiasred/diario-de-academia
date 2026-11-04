import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna a URL pública de uma imagem do catálogo de exercícios.
 * As fotos são .webp, mas o catálogo e os treinos já salvos guardam o caminho com .jpg.
 */
export function getExerciseImageUrl(imagePath: string): string {
  return `/exercises-img/${imagePath.replace(/\.jpg$/, ".webp")}`;
}

/** Entrega um arquivo gerado no aparelho: nada passa por servidor. */
export function baixarArquivo(nome: string, conteudo: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
