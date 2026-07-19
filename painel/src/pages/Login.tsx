import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Certifique-se de que o caminho está correto

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log("Botão clicado. Tentando autenticar...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      console.log("Retorno do Supabase:", { data, error });

      if (error) {
        setError(error.message);
      } else {
        console.log("Autenticação bem-sucedida! Redirecionando para /dashboard");
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError('Ocorreu um erro inesperado. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center py-10 px-4 bg-gray-50">
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">AgroERP</h1>
            <p className="text-gray-500 text-sm">Acesse sua conta para continuar</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input 
                type="email" 
                required
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input 
                type="password" 
                required
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg font-semibold transition shadow-lg ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center mt-8">
        <p className="text-gray-600 font-medium">Desenvolvido por ContadorHigorSantos</p>
        <p className="text-gray-400 text-sm">Contato: (17) 98179-9576</p>
      </footer>
    </div>
  );
}