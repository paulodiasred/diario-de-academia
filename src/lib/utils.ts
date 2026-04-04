import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna a URL pública de uma imagem do catálogo de exercícios.
 * Usa o CDN jsDelivr espelhando o repo original free-exercise-db,
 * evitando armazenar ~94MB de imagens no próprio repositório.
 */
export function getExerciseImageUrl(imagePath: string): string {
  return `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${imagePath}`;
}
