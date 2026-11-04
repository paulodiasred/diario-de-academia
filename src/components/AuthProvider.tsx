import { useEffect, useState, ReactNode } from 'react';
import {
  User,
  deleteUser,
  EmailAuthProvider,
  getAdditionalUserInfo,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { auth, gravacoesSincronizadas, limparDadosLocais } from '@/lib/firebase';
import { AuthContext } from '@/contexts/AuthContext';
import { excluirDadosDaConta } from '@/data/repositories/contaRepository';
import {
  descarregarRascunho,
  esquecerRascunhoLocal,
  limparRascunhosLocais,
} from '@/data/repositories/rascunhoSessao';
import { codigoDoErro } from '@/domain/errosAuth';

async function encerrarNoAparelho() {
  limparRascunhosLocais();
  try {
    await limparDadosLocais();
  } catch (error) {
    // Falha esperada com o app aberto em outra aba: o cache é limpo em um próximo logout.
    console.warn('Não foi possível limpar os dados locais:', error);
  }
  // O Firestore foi encerrado: recarregar é o que permite usar o app de novo.
  window.location.assign('/');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [novoCadastro, setNovoCadastro] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    // Antes de criar: o aviso de login chega logo que a conta existe.
    setNovoCadastro(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setNovoCadastro(false);
      throw error;
    }
  };

  const logout = async () => {
    // Séries ainda na fila dependem desta sessão. Sair agora as perderia.
    descarregarRascunho();
    if (!(await gravacoesSincronizadas())) {
      throw new Error('Há séries ainda não sincronizadas. Conecte-se à internet antes de sair.');
    }
    await signOut(auth);
    await encerrarNoAparelho();
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const resultado = await signInWithPopup(auth, provider);
      if (getAdditionalUserInfo(resultado)?.isNewUser) setNovoCadastro(true);
    } catch (error) {
      const codigo = codigoDoErro(error);
      if (codigo === 'auth/popup-blocked' || codigo === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const excluirConta = async (senha?: string) => {
    const atual = auth.currentUser;
    if (!atual) throw new Error('Não autenticado');

    // Confirma a identidade antes de apagar qualquer dado: senha errada não pode custar nada.
    if (senha && atual.email) {
      await reauthenticateWithCredential(atual, EmailAuthProvider.credential(atual.email, senha));
    } else {
      await reauthenticateWithPopup(atual, new GoogleAuthProvider());
    }

    // Sem isso, um rascunho na fila recriaria o treino em andamento depois da exclusão.
    esquecerRascunhoLocal(atual.uid);
    await excluirDadosDaConta(atual.uid);
    await deleteUser(atual);
    await encerrarNoAparelho();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        novoCadastro,
        concluirOnboarding: () => setNovoCadastro(false),
        signIn,
        signUp,
        logout,
        signInWithGoogle,
        resetPassword,
        excluirConta,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
