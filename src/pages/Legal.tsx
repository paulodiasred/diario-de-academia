import { useEffect, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

// Público de propósito: é o canal para pedidos sobre dados. Para trocar sem mexer no código, defina VITE_CONTATO_EMAIL.
const CONTATO = (import.meta.env.VITE_CONTATO_EMAIL as string | undefined) || "pauloalberto13@gmail.com";
const ATUALIZADO_EM = "novembro de 2026";

const Contato = () => (
  <a className="underline" href={`mailto:${CONTATO}`}>
    {CONTATO}
  </a>
);

function Pagina({ titulo, children }: { titulo: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${titulo} · Diário de Academia`;
  }, [titulo]);

  return (
    <main className="min-h-screen p-4 pb-12 max-w-md mx-auto">
      <header className="pt-4 flex items-center gap-2">
        <a href="/" aria-label="Voltar" className="h-11 w-11 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{titulo}</h1>
          <p className="text-sm text-muted-foreground">Atualizado em {ATUALIZADO_EM}</p>
        </div>
      </header>
      <div className="mt-5 space-y-5 text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}

export function Privacidade() {
  return (
    <Pagina titulo="Política de privacidade">
      <section>
        <h2>Quais dados guardamos</h2>
        <ul>
          <li>Conta: email e, se você entrar com o Google, nome.</li>
          <li>Treinos: rotinas, séries, cargas, repetições, tempos, observações, metas e exercícios próprios.</li>
          <li>Plano: gratuito ou Premium e a contagem de treinos e exercícios criados.</li>
        </ul>
      </section>
      <section>
        <h2>Para que usamos</h2>
        <p>
          Para o app funcionar: guardar seus treinos, mostrar sua evolução e aplicar os limites do
          seu plano. Não vendemos seus dados, não exibimos anúncios e não usamos ferramentas de
          publicidade ou de análise de comportamento.
        </p>
      </section>
      <section>
        <h2>Onde ficam</h2>
        <ul>
          <li>Google Firebase: login e banco de dados. Pode haver armazenamento fora do Brasil.</li>
          <li>Render: hospedagem do site.</li>
          <li>No seu aparelho: uma cópia para o app funcionar sem internet, apagada quando você sai da conta.</li>
        </ul>
      </section>
      <section>
        <h2>Seus direitos</h2>
        <p>Pela LGPD, você pode acessar, corrigir, levar e apagar seus dados. No app, em Minha conta:</p>
        <ul>
          <li>Baixe todos os seus dados a qualquer momento, em qualquer plano.</li>
          <li>Exclua sua conta, com seus treinos, histórico e exercícios próprios.</li>
        </ul>
      </section>
      <section>
        <h2>O que sobra depois de excluir a conta</h2>
        <p>
          Dois registros técnicos, sem dados de treino, podem continuar no banco: a contagem de itens
          criados e o registro do plano, ligados a um identificador interno da conta. Para pedir a
          remoção, use o contato abaixo.
        </p>
      </section>
      <section>
        <h2>Contato</h2>
        <p>
          Dúvidas e pedidos sobre seus dados: <Contato />.
        </p>
      </section>
    </Pagina>
  );
}

export function Termos() {
  return (
    <Pagina titulo="Termos de uso">
      <section>
        <h2>O serviço</h2>
        <p>
          O Diário de Academia é um app para registrar treinos e acompanhar sua evolução. Ao criar uma
          conta, você concorda com estes termos e com a política de privacidade.
        </p>
      </section>
      <section>
        <h2>Saúde e segurança</h2>
        <p>
          O app é uma ferramenta de registro. Ele não prescreve treinos, não faz diagnósticos e não
          substitui médicos ou profissionais de educação física. As instruções dos exercícios são
          informativas. Procure orientação profissional antes de começar ou mudar sua rotina e pare
          se sentir dor ou mal-estar.
        </p>
      </section>
      <section>
        <h2>Sua conta</h2>
        <p>
          Você é responsável por manter sua senha segura e pelas informações que registra. Não use o
          serviço para burlar limites, atacar o sistema ou acessar dados de outras pessoas.
        </p>
      </section>
      <section>
        <h2>Planos</h2>
        <p>
          O plano gratuito tem limites, descritos na tela de planos. O Premium ainda não está à venda,
          e nenhuma cobrança é feita. Preços e condições de assinatura serão informados antes de
          qualquer cobrança.
        </p>
      </section>
      <section>
        <h2>Disponibilidade</h2>
        <p>
          Trabalhamos para manter o serviço estável e seus dados seguros, mas não garantimos
          funcionamento sem interrupções. Baixe uma cópia dos seus dados quando quiser, em Minha conta.
        </p>
      </section>
      <section>
        <h2>Contato</h2>
        <p>
          <Contato />.
        </p>
      </section>
    </Pagina>
  );
}
