import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LimiteDoPlano } from "@/domain/planos";
import { useExerciciosProprios } from "@/hooks/useExerciciosProprios";
import {
  EQUIPAMENTO_LABEL,
  MEDIDA_LABEL,
  MUSCULO_LABEL,
  type ExercicioCatalogo,
  type TipoMedida,
} from "@/types/catalogo";

interface ExercicioProprioFormProps {
  aberto: boolean;
  exercicio?: ExercicioCatalogo | null;
  onFechar: () => void;
  onSalvo?: (exercicio: ExercicioCatalogo) => void;
}

const classeSelect =
  "h-11 w-full rounded-md border border-input bg-secondary/30 px-3 text-sm text-foreground";

export function ExercicioProprioForm({ aberto, exercicio, onFechar, onSalvo }: ExercicioProprioFormProps) {
  const { salvar } = useExerciciosProprios();
  const [nome, setNome] = useState("");
  const [musculo, setMusculo] = useState("");
  const [secundarios, setSecundarios] = useState<string[]>([]);
  const [equipamento, setEquipamento] = useState("");
  const [medida, setMedida] = useState<TipoMedida>("carga_reps");
  const [instrucoes, setInstrucoes] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setNome(exercicio?.name ?? "");
    setMusculo(exercicio?.primaryMuscles[0] ?? "");
    setSecundarios(exercicio?.secondaryMuscles ?? []);
    setEquipamento(exercicio?.equipment ?? "");
    setMedida(exercicio?.medida ?? "carga_reps");
    setInstrucoes(exercicio?.instructions.join("\n") ?? "");
  }, [aberto, exercicio]);

  const enviar = () => {
    try {
      const salvo = salvar(
        {
          name: nome,
          category: medida === "tempo" || medida === "distancia" ? "cardio" : "strength",
          equipment: equipamento || null,
          medida,
          primaryMuscles: musculo ? [musculo] : [],
          secondaryMuscles: secundarios.filter((m) => m !== musculo),
          instructions: instrucoes
            .split("\n")
            .map((linha) => linha.trim())
            .filter(Boolean),
        },
        exercicio?.id,
      );
      onSalvo?.(salvo);
      onFechar();
      toast.success(exercicio ? "Exercício atualizado" : "Exercício criado");
    } catch (erro) {
      toast.error(
        erro instanceof z.ZodError
          ? erro.issues[0].message
          : erro instanceof LimiteDoPlano
            ? erro.message
            : "Não foi possível salvar o exercício.",
      );
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercicio ? "Editar exercício" : "Novo exercício"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="exercicio-nome" className="text-sm text-muted-foreground mb-1 block">
              Nome
            </label>
            <Input id="exercicio-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div>
            <label htmlFor="exercicio-musculo" className="text-sm text-muted-foreground mb-1 block">
              Músculo principal
            </label>
            <select
              id="exercicio-musculo"
              className={classeSelect}
              value={musculo}
              onChange={(e) => setMusculo(e.target.value)}
            >
              <option value="">Escolha</option>
              {Object.entries(MUSCULO_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm text-muted-foreground mb-1">Músculos secundários</legend>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MUSCULO_LABEL)
                .filter(([valor]) => valor !== musculo)
                .map(([valor, rotulo]) => {
                  const marcado = secundarios.includes(valor);
                  return (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={marcado}
                      onClick={() =>
                        setSecundarios((atual) =>
                          marcado ? atual.filter((m) => m !== valor) : [...atual, valor],
                        )
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-[13px] border ${
                        marcado
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      {rotulo}
                    </button>
                  );
                })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="exercicio-equipamento" className="text-sm text-muted-foreground mb-1 block">
              Equipamento
            </label>
            <select
              id="exercicio-equipamento"
              className={classeSelect}
              value={equipamento}
              onChange={(e) => setEquipamento(e.target.value)}
            >
              <option value="">Nenhum</option>
              {Object.entries(EQUIPAMENTO_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exercicio-medida" className="text-sm text-muted-foreground mb-1 block">
              Como medir
            </label>
            <select
              id="exercicio-medida"
              className={classeSelect}
              value={medida}
              onChange={(e) => setMedida(e.target.value as TipoMedida)}
            >
              {Object.entries(MEDIDA_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exercicio-instrucoes" className="text-sm text-muted-foreground mb-1 block">
              Instruções (uma por linha, opcional)
            </label>
            <Textarea
              id="exercicio-instrucoes"
              rows={3}
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button className="h-11 w-full" onClick={enviar}>
            Salvar exercício
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
