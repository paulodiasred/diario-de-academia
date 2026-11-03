/** Chave AAAA-MM-DD no fuso do aparelho (nunca em UTC: às 22h em Brasília, UTC já é amanhã). */
export function chaveDiaLocal(data: Date = new Date()): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function mesmoDiaLocal(a: Date, b: Date): boolean {
  return chaveDiaLocal(a) === chaveDiaLocal(b);
}
