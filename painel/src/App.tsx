import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
// import CadastroProduto from './CadastroProduto' // (Pode apagar ou comentar esta linha antiga)
import CadastroPessoa from './CadastroPessoa'
import Pesagem from './Pesagem'
import Configuracoes from './Configuracoes'
import Estoque from './Estoque'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* A rota /cadastro agora aponta para a nova tela de Pessoas */}
        <Route path="/cadastro" element={<CadastroPessoa />} />
        <Route path="/pesagem" element={<Pesagem />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/estoque" element={<Estoque />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App