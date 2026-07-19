import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute'; // Certifique-se que o arquivo esteja em src/components/
import Dashboard from './Dashboard';
import CadastroPessoa from './CadastroPessoa';
import Pesagem from './Pesagem';
import Configuracoes from './Configuracoes';
import Estoque from './Estoque';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rota de Login (Não é protegida para permitir o acesso) */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas protegidas (Envolvidas pelo PrivateRoute) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/cadastro" element={
          <PrivateRoute>
            <CadastroPessoa />
          </PrivateRoute>
        } />
        
        <Route path="/pesagem" element={
          <PrivateRoute>
            <Pesagem />
          </PrivateRoute>
        } />
        
        <Route path="/configuracoes" element={
          <PrivateRoute>
            <Configuracoes />
          </PrivateRoute>
        } />
        
        <Route path="/estoque" element={
          <PrivateRoute>
            <Estoque />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;