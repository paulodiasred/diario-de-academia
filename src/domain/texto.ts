/** "elevacao" encontra "Elevação". */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function slug(texto: string): string {
  return normalizarBusca(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatarDuracao(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.round((segundos % 3600) / 60);
  if (horas === 0) return `${minutos} min`;
  return minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`;
}

export function formatarKg(valor: number): string {
  return `${valor.toLocaleString("pt-BR")} kg`;
}
