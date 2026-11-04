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

/** Tempo de uma série: 45 s vira "0:45", e 1 h 5 min vira "1:05:00". */
export function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = String(total % 60).padStart(2, "0");
  return horas > 0
    ? `${horas}:${String(minutos).padStart(2, "0")}:${resto}`
    : `${minutos}:${resto}`;
}

/** Campo numérico digitado: vazio ou inválido vira null, e aceita vírgula decimal. */
export function paraNumeroOuNulo(texto: string): number | null {
  if (texto.trim() === "") return null;
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) && valor >= 0 ? valor : null;
}

export function formatarKg(valor: number): string {
  return `${valor.toLocaleString("pt-BR")} kg`;
}
