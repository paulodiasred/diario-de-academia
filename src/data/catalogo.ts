import catalogoData from "@/exercises/exercises-ptbr-partial-translation.json";
import { aplicarCuradoria } from "@/domain/curadoriaCatalogo";
import type { ExercicioCatalogo } from "@/types/catalogo";

/** O catálogo como a pessoa o vê: nomes corrigidos e exercícios acrescentados. O app e a Cloud Function usam este. */
export const catalogo = aplicarCuradoria(catalogoData as ExercicioCatalogo[]);
