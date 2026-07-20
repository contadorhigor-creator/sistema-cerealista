import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

// Importações
import Login from './Login';
import Dashboard from './Dashboard';
import CadastroPessoa from './CadastroPessoa'; 
import Estoque from './Estoque';   
import Pesagem from './Pesagem'; // 👈 IMPORTAÇÃO ADICIONADA (Se o seu arquivo se chamar Pesagem.tsx, mude para './Pesagem')

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Carregando sistema...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/cadastro" 
          element={session ? <CadastroPessoa /> : <Navigate to="/login" />} 
        />

        {/* 👇 NOVA ROTA DA BALANÇA ADICIONADA AQUI 👇 */}
        <Route 
          path="/pesagem" 
          element={session ? <Pesagem /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/estoque" 
          element={session ? <Estoque /> : <Navigate to="/login" />} 
        />

        <Route 
          path="*" 
          element={<Navigate to={session ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}