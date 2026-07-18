import React, { useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function CadastroProduto() {
  // Aqui criamos as "caixinhas de memória" para guardar o que você digita em tempo real
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('KG');
  const [estoqueMin, setEstoqueMin] = useState('');

  // Função que roda quando clicamos no botão Salvar
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que a página recarregue e pisque
    
    // Alerta simulando o salvamento no banco de dados
    alert(`PRODUTO PRONTO PARA SALVAR!\n\nCódigo: ${codigo}\nNome: ${nome}\nUnidade: ${unidade}\nEstoque Mínimo: ${estoqueMin}`);
    
    // No futuro, é exatamente aqui que enviaremos esses dados para o Banco de Dados verdadeiro!
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        
        {/* Cabeçalho da Tela */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Novo Produto</h2>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código do Produto</label>
              <input 
                type="text" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Ex: PROD-001"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Grão</label>
              <input 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Ex: Milho, Sorgo, Soja"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidade de Medida</label>
              <select 
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                <option value="KG">Quilogramas (KG)</option>
                <option value="SC">Sacas de 60kg (SC)</option>
                <option value="TON">Toneladas (TON)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alerta de Estoque Mínimo</label>
              <input 
                type="number" 
                value={estoqueMin}
                onChange={(e) => setEstoqueMin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Quantidade mínima aceitável"
                required
              />
            </div>

          </div>

          {/* Botões do Rodapé */}
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4 mt-8">
            <button type="button" className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">
              Limpar Tudo
            </button>
            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-2">
              <Save className="w-5 h-5" />
              Salvar Produto
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}