import { useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
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
import { codigoDoErro } from '@/domain/errosAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    // Séries ainda na fila dependem desta sessão. Sair agora as perderia.
    if (!(await gravacoesSincronizadas())) {
      throw new Error('Há séries ainda não sincronizadas. Conecte-se à internet antes de sair.');
    }
    await signOut(auth);
    try {
      await limparDadosLocais();
    } catch (error) {
      // Falha esperada com o app aberto em outra aba: o cache é limpo em um próximo logout.
      console.warn('Não foi possível limpar os dados locais:', error);
    }
    // O Firestore foi encerrado: recarregar é o que permite usar o app de novo.
    window.location.assign('/');
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, signInWithGoogle, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
