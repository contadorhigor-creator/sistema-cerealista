import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Salva o token no navegador
        localStorage.setItem('token', data.token);
        // Redireciona para o dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
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
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input 
                type="email" 
                required
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input 
                type="password" 
                required
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition shadow-lg"
            >
              Entrar
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