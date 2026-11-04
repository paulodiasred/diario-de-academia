import { lazy, Suspense, useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MotionConfig, Reorder } from "framer-motion";
import { Plus, BookOpen, Calendar } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { CatalogoCarregando } from "@/components/CatalogoCarregando";
import { TelaCarregando } from "@/components/Estados";
import { ExercicioEditavel } from "@/components/treino/ExercicioEditavel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  esquecerRascunhoFormulario,
  guardarRascunhoFormulario,
  lerRascunhoFormulario,
  type ValoresFormularioTreino,
} from "@/data/repositories/rascunhoFormulario";
import { exercicioParaTreino } from "@/domain/catalogo";
import { LimiteDoPlano } from "@/domain/planos";
import { useAuth } from "@/hooks/useAuth";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import type { ExercicioCatalogo, ExercicioNoTreino } from "@/types/catalogo";
import { DIAS_SEMANA } from "@/types/catalogo";
import { toast } from "@/lib/aviso";

// O catálogo (920 KB) só é baixado quando o usuário abre a lista de exercícios.
const CatalogoDrawer = lazy(() =>
  import("@/components/CatalogoDrawer").then((m) => ({ default: m.CatalogoDrawer })),
);

const FORMULARIO_VAZIO: ValoresFormularioTreino = { nome: "", descricao: "", dias: [], exercicios: [] };
const serializar = (valores: ValoresFormularioTreino) => JSON.stringify(valores);

/** Mantém `ordem` igual à posição. */
const renumerar = (lista: ExercicioNoTreino[]) => lista.map((e, ordem) => ({ ...e, ordem }));

function mover(lista: ExercicioNoTreino[], origem: number, destino: number): ExercicioNoTreino[] {
  if (destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  const [item] = copia.splice(origem, 1);
  copia.splice(destino, 0, item);
  return renumerar(copia);
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
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [catalogoCarregado, setCatalogoCarregado] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [preenchido, setPreenchido] = useState(false);
  const [erroNome, setErroNome] = useState(false);
  const [erroExercicios, setErroExercicios] = useState(false);
  const campoNome = useRef<HTMLInputElement>(null);
  const tituloExercicios = useRef<HTMLHeadingElement>(null);
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
    setErroExercicios(false);
    setExercicios((prev) => [...prev, exercicioParaTreino(ex, prev.length)]);
  };

  const removerExercicio = (exercicioId: string) => {
    setExercicios((prev) => renumerar(prev.filter((e) => e.exercicioId !== exercicioId)));
  };

  const atualizar = (exercicioId: string, campos: Partial<ExercicioNoTreino>) => {
    setExercicios((prev) =>
      prev.map((e) => (e.exercicioId === exercicioId ? { ...e, ...campos } : e)),
    );
  };

  const alternarAberto = (exercicioId: string) => {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(exercicioId)) novo.add(exercicioId);
      return novo;
    });
  };

  const salvar = async () => {
    const semNome = !nome.trim();
    const semExercicios = exercicios.length === 0;
    setErroNome(semNome);
    setErroExercicios(semExercicios);
    if (semNome) {
      campoNome.current?.focus();
      return;
    }
    if (semExercicios) {
      tituloExercicios.current?.scrollIntoView({ block: "center" });
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
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen p-4 max-w-md mx-auto pb-32 space-y-5">
<Cabecalho titulo={isEdicao ? "Editar treino" : "Novo treino"} onVoltar={voltar} />

        {/* Nome e descrição */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div>
            <label htmlFor="treino-nome" className="text-sm text-muted-foreground mb-1 block">
              Nome do treino *
            </label>
            <Input
              id="treino-nome"
              ref={campoNome}
              placeholder="Ex: Peito e Tríceps"
              value={nome}
              aria-invalid={erroNome}
              aria-describedby={erroNome ? "treino-nome-erro" : undefined}
              onChange={(e) => {
                setNome(e.target.value);
                setErroNome(false);
              }}
              className={`bg-surface-2 ${erroNome ? "border-destructive" : ""}`}
            />
            {erroNome && (
              <p id="treino-nome-erro" role="alert" className="mt-1 text-caption text-destructive">
                Dê um nome ao treino
              </p>
            )}
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
              className="bg-surface-2 resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Dias da semana */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Dias da semana</span>
            <span className="text-caption text-muted-foreground ml-auto">
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
                      : "bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground"
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
            <h2 ref={tituloExercicios} className="font-semibold">
              Exercícios{" "}
              <span className="text-muted-foreground font-normal text-sm">({exercicios.length})</span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-caption rounded-lg"
              onClick={() => setCatalogoAberto(true)}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Catálogo
            </Button>
          </div>

          {erroExercicios && (
            <p role="alert" className="text-caption text-destructive">
              Adicione pelo menos um exercício
            </p>
          )}

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
              <Reorder.Group
                axis="y"
                values={exercicios}
                onReorder={(lista: ExercicioNoTreino[]) => setExercicios(renumerar(lista))}
                className="space-y-2"
              >
                {exercicios.map((ex, index) => (
                  <ExercicioEditavel
                    key={ex.exercicioId}
                    exercicio={ex}
                    indice={index}
                    total={exercicios.length}
                    aberto={abertos.has(ex.exercicioId)}
                    onAlternar={() => alternarAberto(ex.exercicioId)}
                    onAtualizar={(campos) => atualizar(ex.exercicioId, campos)}
                    onMover={(destino) => setExercicios((l) => mover(l, index, destino))}
                    onRemover={() => removerExercicio(ex.exercicioId)}
                  />
                ))}
              </Reorder.Group>

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

      {/* Na zona do polegar e sempre à vista: a lista de exercícios costuma passar da tela. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
        <div className="max-w-md mx-auto p-3">
          <Button onClick={salvar} disabled={salvando} className="w-full h-12">
            {salvando ? "Salvando..." : "Salvar treino"}
          </Button>
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
        <Suspense fallback={catalogoAberto ? <CatalogoCarregando onFechar={() => setCatalogoAberto(false)} /> : null}>
          <CatalogoDrawer
            open={catalogoAberto}
            onClose={() => setCatalogoAberto(false)}
            onAdicionar={adicionarExercicio}
            exerciciosAdicionados={exerciciosAdicionadosIds}
          />
        </Suspense>
      )}
    </MotionConfig>
  );
};

export default CriarEditarTreino;
