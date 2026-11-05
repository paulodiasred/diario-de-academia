import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { CANCELAMENTOS_LOGIN, codigoDoErro, mensagemErroAuth } from '@/domain/errosAuth';
import { toast } from '@/lib/aviso';

interface CampoSenhaProps {
  id: string;
  valor: string;
  novaSenha?: boolean;
  onMudar: (valor: string) => void;
}

function CampoSenha({ id, valor, novaSenha = false, onMudar }: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
      <Input
        id={id}
        type={visivel ? 'text' : 'password'}
        autoComplete={novaSenha ? 'new-password' : 'current-password'}
        placeholder="••••••••"
        aria-describedby={novaSenha ? `${id}-regra` : undefined}
        value={valor}
        onChange={(e) => onMudar(e.target.value)}
        className="pl-10 pr-11"
        required
      />
      <button
        type="button"
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setVisivel((v) => !v)}
        className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground"
      >
        {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthForm() {
  useEffect(() => {
    document.title = 'Entrar · Diário de Academia';
  }, []);

  // A página pública leva direto ao cadastro.
  const abaInicial = new URLSearchParams(window.location.search).get('modo') === 'cadastro' ? 'signup' : 'signin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      toast.error(mensagemErroAuth(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (error) {
      toast.error(mensagemErroAuth(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      if (!CANCELAMENTOS_LOGIN.has(codigoDoErro(error) ?? '')) {
        toast.error(mensagemErroAuth(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.error('Digite seu email no campo acima para recuperar a senha.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
    } catch (error) {
      // Conta inexistente recebe a mesma resposta: a tela não revela quem tem cadastro.
      if (codigoDoErro(error) !== 'auth/user-not-found') {
        toast.error(mensagemErroAuth(error));
        return;
      }
    } finally {
      setLoading(false);
    }
    toast.success('Se houver uma conta com este email, enviamos o link para redefinir a senha.');
  };

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 flex flex-col justify-center">
      <div className="text-center mb-8">
        <a href="/" aria-label="Sobre o Diário de Academia" className="inline-block">
          <img src="/logo.svg" alt="" className="w-16 h-16 mx-auto mb-4" />
        </a>
        <h1 className="text-3xl font-bold mb-2">Diário de Academia</h1>
        <p className="text-muted-foreground">Seu treino, sua evolução, seus resultados.</p>
      </div>

      <div className="space-y-4 mb-6">
        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-caption uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue={abaInicial} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Entrar</TabsTrigger>
          <TabsTrigger value="signup">Cadastrar</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password">Senha</Label>
              <CampoSenha id="signin-password" valor={password} onMudar={setPassword} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full"
              disabled={loading}
              onClick={handleResetPassword}
            >
              Esqueci minha senha
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha</Label>
              <CampoSenha id="signup-password" valor={password} novaSenha onMudar={setPassword} />
              <p id="signup-password-regra" className="text-caption text-muted-foreground">
                Pelo menos 6 caracteres.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                'Criando conta...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Conta
                </>
              )}
            </Button>

            <p className="text-caption text-center text-muted-foreground">
              Ao criar uma conta, você concorda com os{" "}
              <a className="underline" href="/termos">
                termos de uso
              </a>{" "}
              e a{" "}
              <a className="underline" href="/privacidade">
                política de privacidade
              </a>
              .
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </main>
  );
}