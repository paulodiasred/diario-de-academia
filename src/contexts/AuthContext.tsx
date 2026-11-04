import { createContext } from 'react';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** A conta acabou de ser criada nesta visita: mostra o onboarding. */
  novoCadastro: boolean;
  concluirOnboarding: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** `senha` para quem entra com email; sem ela, confirma pelo Google. */
  excluirConta: (senha?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
