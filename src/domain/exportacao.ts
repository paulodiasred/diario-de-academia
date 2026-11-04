import { exerciciosTreinados } from "./estatisticas";
import type { ResumoSessao, Sessao } from "./sessao";
import { formatarDuracao, formatarKg } from "./texto";

/**
 * Separador ";" e vírgula decimal: é o que o Excel em português abre sem configurar nada.
 * Texto que começa com = + - @ vira fórmula no Excel: o apóstrofo impede que um nome
 * de exercício seja executado ao abrir o arquivo.
 */
function celula(valor: string | number | null): string {
  if (valor === null) return "";
  if (typeof valor === "number") return String(valor).replace(".", ",");
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return /[;"\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

function montarCsv(cabecalho: string[], linhas: Array<Array<string | number | null>>): string {
  const corpo = [cabecalho, ...linhas].map((linha) => linha.map(celula).join(";")).join("\r\n");
  // A marca inicial faz o Excel reconhecer os acentos.
  return `\uFEFF${corpo}\r\n`;
}

const dataBr = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/** Uma linha por série: o histórico completo, para qualquer plano. */
export function historicoEmCsv(sessoes: Sessao[]): string {
  const linhas: Array<Array<string | number | null>> = [];
  const ordenadas = sessoes
    .filter((s) => s.finalizadaEm)
    .sort((a, b) => new Date(a.iniciadaEm).getTime() - new Date(b.iniciadaEm).getTime());

  for (const sessao of ordenadas) {
    for (const exercicio of sessao.exercicios) {
      exercicio.series.forEach((serie, i) => {
        linhas.push([
          dataBr(sessao.iniciadaEm),
          sessao.nome,
          exercicio.nome,
          i + 1,
          serie.peso,
          serie.reps,
          serie.duracaoSeg === null ? null : serie.duracaoSeg / 60,
          serie.distanciaM,
          exercicio.notas || null,
        ]);
      });
    }
  }
  return montarCsv(
    ["Data", "Treino", "Exercício", "Série", "Peso (kg)", "Repetições", "Minutos", "Metros", "Observações"],
    linhas,
  );
}

/** Premium: uma linha por exercício. */
export function relatorioPorExercicioEmCsv(sessoes: Sessao[]): string {
  const linhas = exerciciosTreinados(sessoes).map((e) => [
    e.nome,
    e.vezes,
    e.melhorPeso,
    e.melhorPesoData ? dataBr(e.melhorPesoData) : null,
    dataBr(e.ultimaData),
  ]);
  return montarCsv(["Exercício", "Treinos", "Maior carga (kg)", "Data da maior carga", "Último treino"], linhas);
}

export function textoParaCompartilhar(sessao: Sessao, resumo: ResumoSessao): string {
  const partes = [`${resumo.series} série${resumo.series !== 1 ? "s" : ""}`];
  if (resumo.volumeKg > 0) partes.push(formatarKg(resumo.volumeKg));
  if (resumo.duracaoSeg !== null) partes.push(formatarDuracao(resumo.duracaoSeg));

  const linhas = [`Treino concluído: ${sessao.nome}`, partes.join(" · ")];
  for (const recorde of resumo.recordes) {
    linhas.push(`Novo recorde: ${recorde.nome}, ${formatarKg(recorde.peso)}`);
  }
  linhas.push("Registrado no Diário de Academia");
  return linhas.join("\n");
}
