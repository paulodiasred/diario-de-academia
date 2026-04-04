import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna a URL pública de uma imagem do catálogo de exercícios.
 * As imagens ficam em public/exercises-img/ e são servidas estaticamente.
 */
export function getExerciseImageUrl(imagePath: string): string {
  return `/exercises-img/${imagePath}`;
}
