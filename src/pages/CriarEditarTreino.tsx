import { lazy, Suspense, useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2, Save, BookOpen, Calendar } from "lucide-react";
import { TelaCarregando } from "@/components/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorState } from "@/components/ErrorState";
import { ImagemExercicio } from "@/components/ImagemExercicio";
import {
  esquecerRascunhoFormulario,
  guardarRascunhoFormulario,
  lerRascunhoFormulario,
  type ValoresFormularioTreino,
} from "@/data/repositories/rascunhoFormulario";
import { LimiteDoPlano } from "@/domain/planos";
import { medidaDoExercicio } from "@/domain/sessao";
import { useAuth } from "@/hooks/useAuth";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import type { ExercicioCatalogo, ExercicioNoTreino, TipoMedida } from "@/types/catalogo";
import {
  CATEGORIA_LABEL,
  DIAS_SEMANA,
  MEDIDA_LABEL,
  medidaPadraoDoCatalogo,
  MUSCULO_LABEL,
} from "@/types/catalogo";
import { toast } from "sonner";

// O catálogo (920 KB) só é baixado quando o usuário abre a lista de exercícios.
const CatalogoDrawer = lazy(() =>
  import("@/components/CatalogoDrawer").then((m) => ({ default: m.CatalogoDrawer })),
);

interface ContadorProps {
  rotulo: string;
  valor: number;
  sufixo?: string;
  onMudar: (valor: number) => void;
  passo?: number;
  minimo?: number;
  maximo: number;
}

function Contador({ rotulo, valor, sufixo = "", onMudar, passo = 1, minimo = 0, maximo }: ContadorProps) {
  return (
    <div>
      <span className="text-[13px] text-muted-foreground block mb-1">{rotulo}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          className="w-9 h-9 rounded-full bg-secondary/70 text-sm font-bold hover:bg-secondary"
          onClick={() => onMudar(Math.max(minimo, valor - passo))}
        >
          −
        </button>
        <span className="min-w-9 text-center text-sm font-semibold">
          {valor}
          {sufixo}
        </span>
        <button
          type="button"
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          className="w-9 h-9 rounded-full bg-secondary/70 text-sm font-bold hover:bg-secondary"
          onClick={() => onMudar(Math.min(maximo, valor + passo))}
        >
          +
        </button>
      </div>
    </div>
  );
}

const paraNumeroOpcional = (texto: string): number | undefined => {
  if (texto.trim() === "") return undefined;
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) && valor >= 0 ? valor : undefined;
};

const FORMULARIO_VAZIO: ValoresFormularioTreino = { nome: "", descricao: "", dias: [], exercicios: [] };
const serializar = (valores: ValoresFormularioTreino) => JSON.stringify(valores);

/** Reordena e mantém `ordem` igual à posição. */
function mover(lista: ExercicioNoTreino[], origem: number, destino: number): ExercicioNoTreino[] {
  if (destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  const [item] = copia.splice(origem, 1);
  copia.splice(destino, 0, item);
  return copia.map((e, ordem) => ({ ...e, ordem }));
}

const CriarEditarTreino = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdicao = !!id;

  const { user } = useAuth();
  const uid = user?.uid;
  const { treinos, loading, erro, recarregar, criarTreino, atualizarTreino } = useMeusTreinos();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dias, setDias] = useState<string[]>([]);
  const [exercicios, setExercicios] = useState<ExercicioNoTreino[]>([]);
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [catalogoCarregado, setCatalogoCarregado] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [preenchido, setPreenchido] = useState(false);
  const formularioPreenchido = useRef(false);
  // O que está salvo: é a comparação com ele que diz se há algo a perder.
  const valoresIniciais = useRef(serializar(FORMULARIO_VAZIO));
  const versao = useRef<string | null>(null);

  const aplicar = useCallback((valores: ValoresFormularioTreino) => {
    setNome(valores.nome);
    setDescricao(valores.descricao);
    setDias(valores.dias);
    setExercicios(valores.exercicios);
  }, []);

  // Preenche uma única vez: recarregar a lista não pode apagar o que está sendo editado.
  useEffect(() => {
    if (!uid || formularioPreenchido.current) return;
    const treino = isEdicao ? treinos.find((t) => t.id === id) : undefined;
    if (isEdicao && !treino) return;
    formularioPreenchido.current = true;

    const iniciais: ValoresFormularioTreino = treino
      ? {
          nome: treino.nome,
          descricao: treino.descricao ?? "",
          dias: treino.dias ?? [],
          exercicios: [...treino.exercicios].sort((a, b) => a.ordem - b.ordem),
        }
      : FORMULARIO_VAZIO;
    valoresIniciais.current = serializar(iniciais);
    versao.current = treino?.atualizadoEm ?? null;

    const salvo = lerRascunhoFormulario(uid, id);
    const aproveitavel = salvo && salvo.versao === versao.current;
    aplicar(aproveitavel ? salvo.valores : iniciais);
    if (aproveitavel) {
      toast("Rascunho recuperado", {
        duration: 6000,
        action: {
          label: "Descartar",
          onClick: () => aplicar(iniciais),
        },
      });
    }
    setPreenchido(true);
  }, [aplicar, id, isEdicao, treinos, uid]);

  const temAlteracoes =
    preenchido && serializar({ nome, descricao, dias, exercicios }) !== valoresIniciais.current;

  useEffect(() => {
    if (!uid || !preenchido) return;
    if (temAlteracoes) {
      guardarRascunhoFormulario(uid, id, {
        valores: { nome, descricao, dias, exercicios },
        versao: versao.current,
      });
    } else {
      esquecerRascunhoFormulario(uid, id);
    }
  }, [uid, id, preenchido, temAlteracoes, nome, descricao, dias, exercicios]);

  const voltar = () => {
    if (temAlteracoes) setConfirmarSaida(true);
    else navigate("/meus-treinos");
  };

  const sairSemSalvar = () => {
    if (uid) esquecerRascunhoFormulario(uid, id);
    navigate("/meus-treinos");
  };

  useEffect(() => {
    if (catalogoAberto) setCatalogoCarregado(true);
  }, [catalogoAberto]);

  const toggleDia = (dia: string) => {
    setDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  };

  const adicionarExercicio = (ex: ExercicioCatalogo) => {
    const medida = medidaPadraoDoCatalogo(ex);
    const novoExercicio: ExercicioNoTreino = {
      exercicioId: ex.id,
      exercicioNome: ex.name,
      primaryMuscles: ex.primaryMuscles,
      category: ex.category,
      series: 3,
      descanso: 60,
      ordem: exercicios.length,
      images: ex.images,
      medida,
      ...(medida === "carga_reps" || medida === "peso_corporal" ? { repsAlvo: 10 } : {}),
    };
    setExercicios((prev) => [...prev, novoExercicio]);
  };

  const removerExercicio = (exercicioId: string) => {
    setExercicios((prev) =>
      prev.filter((e) => e.exercicioId !== exercicioId).map((e, i) => ({ ...e, ordem: i })),
    );
  };

  const atualizar = (exercicioId: string, campos: Partial<ExercicioNoTreino>) => {
    setExercicios((prev) =>
      prev.map((e) => (e.exercicioId === exercicioId ? { ...e, ...campos } : e)),
    );
  };

  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("Dê um nome ao treino");
      return;
    }
    if (exercicios.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }

    setSalvando(true);
    try {
      const dados = { nome, descricao, dias, exercicios };

      if (isEdicao && id) {
        await atualizarTreino(id, dados);
      } else {
        await criarTreino(dados);
      }
      if (uid) esquecerRascunhoFormulario(uid, id);
      toast.success(isEdicao ? "Treino atualizado" : "Treino criado");
      navigate("/meus-treinos");
    } catch (erro) {
      if (erro instanceof LimiteDoPlano) navigate("/planos");
      toast.error(erro instanceof LimiteDoPlano ? erro.message : "Erro ao salvar treino");
    } finally {
      setSalvando(false);
    }
  };

  const exerciciosAdicionadosIds = exercicios.map((e) => e.exercicioId);

  if (isEdicao && erro) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar este treino"
        onTentarNovamente={() => void recarregar()}
      />
    );
  }

  if (isEdicao && loading) {
    return (
      <TelaCarregando />
    );
  }

  if (isEdicao && !treinos.some((t) => t.id === id)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Treino não encontrado</p>
          <button onClick={() => navigate("/meus-treinos")} className="text-primary underline">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 max-w-md mx-auto pb-32 space-y-5">
        {/* Header */}
        <div className="pt-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={voltar}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">{isEdicao ? "Editar treino" : "Novo treino"}</h1>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="rounded-lg h-11 gap-1.5 text-sm"
          >
            <Save className="w-4 h-4" />
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* Nome e descrição */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div>
            <label htmlFor="treino-nome" className="text-sm text-muted-foreground mb-1 block">
              Nome do treino *
            </label>
            <Input
              id="treino-nome"
              placeholder="Ex: Peito e Tríceps"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-secondary/30"
            />
          </div>
          <div>
            <label htmlFor="treino-descricao" className="text-sm text-muted-foreground mb-1 block">
              Descrição (opcional)
            </label>
            <Textarea
              id="treino-descricao"
              placeholder="Ex: Treino de hipertrofia, foco em volume"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="bg-secondary/30 resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Dias da semana */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Dias da semana</span>
            <span className="text-[13px] text-muted-foreground ml-auto">
              {dias.length === 0
                ? "Nenhum selecionado"
                : `${dias.length} dia${dias.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map((dia) => {
              const selecionado = dias.includes(dia);
              return (
                <button
                  key={dia}
                  type="button"
                  aria-pressed={selecionado}
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selecionado
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercícios adicionados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Exercícios{" "}
              <span className="text-muted-foreground font-normal text-sm">({exercicios.length})</span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-[13px] rounded-lg"
              onClick={() => setCatalogoAberto(true)}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Catálogo
            </Button>
          </div>

          {exercicios.length === 0 ? (
            <button
              type="button"
              onClick={() => setCatalogoAberto(true)}
              className="w-full glass-card rounded-xl p-8 text-center border-dashed hover:border-primary/40 transition-colors"
            >
              <span className="block text-muted-foreground text-sm">Nenhum exercício adicionado</span>
              <span className="text-primary text-sm mt-1 font-medium flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" />
                Abrir catálogo
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              {exercicios.map((ex, index) => {
                const medida = medidaDoExercicio(ex);
                const comReps = medida === "carga_reps" || medida === "peso_corporal";
                return (
                  <div key={ex.exercicioId} className="glass-card rounded-xl p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <ImagemExercicio caminho={ex.images?.[0]} alt="" className="w-11 h-11 shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">{ex.exercicioNome}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ex.primaryMuscles.slice(0, 2).map((m) => (
                            <Badge key={m} variant="secondary" className="text-[13px] px-1.5 py-0">
                              {MUSCULO_LABEL[m] ?? m}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-[13px] px-1.5 py-0">
                            {CATEGORIA_LABEL[ex.category] ?? ex.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex shrink-0">
                        <button
                          type="button"
                          aria-label={`Subir ${ex.exercicioNome}`}
                          disabled={index === 0}
                          onClick={() => setExercicios((l) => mover(l, index, index - 1))}
                          className="w-9 h-9 flex items-center justify-center text-muted-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Descer ${ex.exercicioNome}`}
                          disabled={index === exercicios.length - 1}
                          onClick={() => setExercicios((l) => mover(l, index, index + 1))}
                          className="w-9 h-9 flex items-center justify-center text-muted-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remover ${ex.exercicioNome}`}
                          onClick={() => removerExercicio(ex.exercicioId)}
                          className="w-9 h-9 flex items-center justify-center text-destructive/70 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <Contador
                        rotulo="Séries"
                        valor={ex.series}
                        minimo={1}
                        maximo={20}
                        onMudar={(series) => atualizar(ex.exercicioId, { series })}
                      />
                      <Contador
                        rotulo="Descanso"
                        valor={ex.descanso}
                        sufixo="s"
                        passo={15}
                        maximo={600}
                        onMudar={(descanso) => atualizar(ex.exercicioId, { descanso })}
                      />
                    </div>

                    <div>
                      <label className="text-[13px] text-muted-foreground block mb-1">
                        Como medir
                        <select
                          className="mt-1 h-10 w-full rounded-md border border-input bg-secondary/30 px-2 text-sm text-foreground"
                          value={medida}
                          onChange={(e) =>
                            atualizar(ex.exercicioId, { medida: e.target.value as TipoMedida })
                          }
                        >
                          {Object.entries(MEDIDA_LABEL).map(([valor, rotulo]) => (
                            <option key={valor} value={valor}>
                              {rotulo}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {comReps && (
                        <label className="text-[13px] text-muted-foreground">
                          Repetições (meta)
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            className="mt-1 h-10 bg-secondary/30"
                            value={ex.repsAlvo ?? ""}
                            onChange={(e) =>
                              atualizar(ex.exercicioId, { repsAlvo: paraNumeroOpcional(e.target.value) })
                            }
                          />
                        </label>
                      )}
                      {comReps && (
                        <label className="text-[13px] text-muted-foreground">
                          {medida === "peso_corporal" ? "Carga extra (kg)" : "Carga inicial (kg)"}
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            className="mt-1 h-10 bg-secondary/30"
                            value={ex.cargaAlvo ?? ""}
                            onChange={(e) =>
                              atualizar(ex.exercicioId, { cargaAlvo: paraNumeroOpcional(e.target.value) })
                            }
                          />
                        </label>
                      )}
                      {!comReps && (
                        <label className="text-[13px] text-muted-foreground">
                          Tempo (min)
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            className="mt-1 h-10 bg-secondary/30"
                            value={ex.duracaoAlvoSeg === undefined ? "" : ex.duracaoAlvoSeg / 60}
                            onChange={(e) => {
                              const minutos = paraNumeroOpcional(e.target.value);
                              atualizar(ex.exercicioId, {
                                duracaoAlvoSeg: minutos === undefined ? undefined : Math.round(minutos * 60),
                              });
                            }}
                          />
                        </label>
                      )}
                      {medida === "distancia" && (
                        <label className="text-[13px] text-muted-foreground">
                          Distância (m)
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            className="mt-1 h-10 bg-secondary/30"
                            value={ex.distanciaAlvoM ?? ""}
                            onChange={(e) =>
                              atualizar(ex.exercicioId, {
                                distanciaAlvoM: paraNumeroOpcional(e.target.value),
                              })
                            }
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setCatalogoAberto(true)}
                className="w-full glass-card rounded-xl p-3 text-center text-sm text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Adicionar exercício
              </button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmarSaida} onOpenChange={setConfirmarSaida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações feitas neste treino serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={sairSemSalvar}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {catalogoCarregado && (
        <Suspense fallback={null}>
          <CatalogoDrawer
            open={catalogoAberto}
            onClose={() => setCatalogoAberto(false)}
            onAdicionar={adicionarExercicio}
            exerciciosAdicionados={exerciciosAdicionadosIds}
          />
        </Suspense>
      )}
    </>
  );
};

export default CriarEditarTreino;
