import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Settings as SettingsIcon, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Configuracoes() {
  // Inicializando com as regras já estabelecidas na operação
  const [toleranciaImpureza, setToleranciaImpureza] = useState('1.0');
  const [fatorUmidade1, setFatorUmidade1] = useState('1.4');
  const [fatorUmidade2, setFatorUmidade2] = useState('1.5');

  // Ao abrir a tela, busca se já existe alguma configuração salva na memória
  useEffect(() => {
    const configSalva = JSON.parse(localStorage.getItem('configuracoesDesconto') || '{}');
    if (configSalva.toleranciaImpureza) setToleranciaImpureza(configSalva.toleranciaImpureza);
    if (configSalva.fatorUmidade1) setFatorUmidade1(configSalva.fatorUmidade1);
    if (configSalva.fatorUmidade2) setFatorUmidade2(configSalva.fatorUmidade2);
  }, []);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cria o pacote de configurações atualizado
    const config = {
      toleranciaImpureza,
      fatorUmidade1,
      fatorUmidade2
    };
    
    // Salva na memória do navegador
    localStorage.setItem('configuracoesDesconto', JSON.stringify(config));
    alert('Configurações de desconto atualizadas com sucesso!');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <SettingsIcon className="text-blue-600" /> Configurações do Sistema
              </h2>
              <p className="text-sm text-gray-500 mt-1">Gerencie os parâmetros de cálculo e descontos.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSalvar} className="space-y-8">
          
          {/* Bloco de Regras de Desconto */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-6">
              <Percent size={20} className="text-blue-600" /> Parâmetros de Classificação (Grãos)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tolerância de Impureza (%)
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={toleranciaImpureza} 
                  onChange={(e) => setToleranciaImpureza(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                />
                <p className="text-xs text-slate-500 mt-1">Abaixo deste valor, o sistema não aplicará desconto de impureza.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fator Umidade (14% a 18%)
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={fatorUmidade1} 
                  onChange={(e) => setFatorUmidade1(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fator Umidade (Acima de 18%)
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={fatorUmidade2} 
                  onChange={(e) => setFatorUmidade2(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                />
              </div>

            </div>
          </div>

          <button type="submit" className="w-full mt-6 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm">
            <Save className="w-5 h-5" /> Salvar Configurações
          </button>
        </form>

      </div>
    </div>
  );
}