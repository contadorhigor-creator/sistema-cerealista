import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Verifique se o caminho está correto

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Tenta recuperar a sessão atual do LocalStorage imediatamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Só paramos de carregar quando o Supabase responde
    });

    // 2. Escuta mudanças na autenticação (caso o usuário saia ou entre)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Enquanto o Supabase estiver checando, mostramos apenas uma tela de carregamento
  // Isso evita o erro de redirecionar antes da hora
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        Carregando sistema...
      </div>
    );
  }

  // Se não houver sessão após o carregamento, manda pro login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se tudo estiver certo, mostra o conteúdo (o Dashboard, etc)
  return children;
}