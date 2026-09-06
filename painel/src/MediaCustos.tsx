import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Save, ArrowLeft, Edit, Trash2, TrendingUp, 
  DollarSign, Truck, Package, Filter, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function MediaCustos() {
  const [compras, setCompras] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [editando, setEditando] = useState<any>(null);

  // Estados do Formulário
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [fornecedor, setFornecedor] = useState('');
  const [produto, setProduto] = useState('Milho');
  const [kg, setKg] = useState('');
  const [valorSaca, setValorSaca] = useState('');
  const [frete, setFrete] = useState('');

  // Estados dos Filtros da Tabela
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');

  // Estado do Simulador de Estoque
  const [estoqueAtualSacas, setEstoqueAtualSacas] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    // Busca fornecedores
    const { data: fornDB } = await supabase.from('pessoas').select('nome').order('nome');
    if (fornDB) setFornecedores(fornDB);

    // Busca histórico de compras
    const { data: compDB } = await supabase.from('compras_custos').select('*');
    if (compDB) setCompras(compDB);
  };

  // --- FUNÇÕES UTILITÁRIAS DE DATA ---
  // Converte DD/MM/YYYY para YYYY-MM-DD para o sistema conseguir ordenar e filtrar corretamente
  const converterParaISO = (dataBR: string) => {
    if (!dataBR) return '';
    const partes = dataBR.split('/');
    if (partes.length !== 3) return dataBR;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  };

  // --- CÁLCULOS AUTOMÁTICOS DO FORMULÁRIO ---
  const sacas = Number(kg) / 60 || 0;
  const vSaca = Number(valorSaca) || 0;
  const vFrete = Number(frete) || 0;
  
  const custoProduto = sacas * vSaca;
  const totalCompra = custoProduto + vFrete;
  const custoFinalSaca = sacas > 0 ? (totalCompra / sacas) : 0;

  // --- FUNÇÕES DE BANCO DE DADOS (CRUD) ---
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor || sacas <= 0 || vSaca <= 0) return alert('Preencha fornecedor, KG e valor da saca.');

    const dados = {
      data: dataCompra.split('-').reverse().join('/'), // Salva em padrão BR: DD/MM/YYYY
      fornecedor,
      produto,
      kg: Number(kg),
      sacas,
      valor_saca: vSaca,
      frete_total: vFrete,
      total_compra: totalCompra,
      custo_final_saca: custoFinalSaca
    };

    if (editando) {
      const { error } = await supabase.from('compras_custos').update(dados).eq('id', editando.id);
      if (error) return alert('Erro ao atualizar: ' + error.message);
      alert('Compra atualizada!');
    } else {
      const { error } = await supabase.from('compras_custos').insert([dados]);
      if (error) return alert('Erro ao salvar: ' + error.message);
      alert('Compra registrada!');
    }

    limparFormulario();
    carregarDados();
  };

  const iniciarEdicao = (c: any) => {
    setEditando(c);
    setDataCompra(converterParaISO(c.data));
    setFornecedor(c.fornecedor);
    setProduto(c.produto);
    setKg(c.kg.toString());
    setValorSaca(c.valor_saca.toString());
    setFrete(c.frete_total.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta compra do histórico?')) return;
    const { error } = await supabase.from('compras_custos').delete().eq('id', id);
    if (error) return alert('Erro ao excluir: ' + error.message);
    carregarDados();
  };

  const limparFormulario = () => {
    setEditando(null);
    setDataCompra(new Date().toISOString().split('T')[0]);
    setFornecedor(''); setKg(''); setValorSaca(''); setFrete('');
  };

  // --- LÓGICA DE FILTRAGEM E ORDENAÇÃO DA TABELA ---
  const comprasFiltradas = useMemo(() => {
    let filtradas = [...compras];

    // 1. Aplica o filtro de Fornecedor
    if (filtroFornecedor) {
      filtradas = filtradas.filter(c => c.fornecedor === filtroFornecedor);
    }

    // 2. Aplica o filtro de Datas
    if (filtroDataInicio || filtroDataFim) {
      filtradas = filtradas.filter(c => {
        const dataISO = converterParaISO(c.data);
        let passaInicio = true;
        let passaFim = true;
        if (filtroDataInicio) passaInicio = dataISO >= filtroDataInicio;
        if (filtroDataFim) passaFim = dataISO <= filtroDataFim;
        return passaInicio && passaFim;
      });
    }

    // 3. Ordena estritamente por DATA (Mais recente no topo)
    filtradas.sort((a, b) => {
      const dataA = converterParaISO(a.data);
      const dataB = converterParaISO(b.data);
      if (dataA > dataB) return -1;
      if (dataA < dataB) return 1;
      return b.id - a.id; // Desempate pelo ID
    });

    return filtradas;
  }, [compras, filtroFornecedor, filtroDataInicio, filtroDataFim]);

  // --- MOTOR DE MÉDIA PONDERADA (FIFO) ---
  const resultadoMedia = useMemo(() => {
    const alvo = Number(estoqueAtualSacas);
    if (!alvo || alvo <= 0 || compras.length === 0) return { media: 0, sacasUsadas: 0, historicoInsuficiente: false };

    // Garante que o cálculo vai pegar sempre as mais recentes primeiro, 
    // mesmo que o usuário tenha esquecido de lançar uma nota e lançado atrasado.
    const comprasOrdenadasParaCalculo = [...compras].sort((a, b) => {
      const dataA = converterParaISO(a.data);
      const dataB = converterParaISO(b.data);
      if (dataA > dataB) return -1;
      if (dataA < dataB) return 1;
      return b.id - a.id;
    });

    let sacasRestantesParaCalculo = alvo;
    let valorAcumulado = 0;
    
    for (let c of comprasOrdenadasParaCalculo) {
      if (sacasRestantesParaCalculo <= 0) break;

      const sacasDaCompra = Number(c.sacas);
      const custoDaSaca = Number(c.custo_final_saca);

      if (sacasDaCompra <= sacasRestantesParaCalculo) {
        valorAcumulado += (sacasDaCompra * custoDaSaca);
        sacasRestantesParaCalculo -= sacasDaCompra;
      } else {
        valorAcumulado += (sacasRestantesParaCalculo * custoDaSaca);
        sacasRestantesParaCalculo = 0;
      }
    }

    const sacasCalculadas = alvo - sacasRestantesParaCalculo;
    const mediaFinal = sacasCalculadas > 0 ? (valorAcumulado / sacasCalculadas) : 0;

    return {
      media: mediaFinal,
      sacasUsadas: sacasCalculadas,
      historicoInsuficiente: sacasRestantesParaCalculo > 0
    };
  }, [estoqueAtualSacas, compras]);


  // --- FORMATADORES ---
  const formatMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatNum = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition">
            <ArrowLeft size={20} /> Voltar ao Painel
          </Link>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Calculator className="text-blue-600" /> Formação de Preço Médio (CMV)
          </h2>
        </div>

        {/* 1. SIMULADOR DE ESTOQUE (MÉDIA) */}
        <div className="bg-slate-900 rounded-xl p-8 shadow-lg text-white grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-300 mb-2 flex items-center gap-2"><Package/> Meu Estoque Atual</h3>
            <p className="text-sm text-slate-400 mb-4">Informe quantas sacas você tem hoje. O sistema pegará as últimas compras para calcular seu custo real.</p>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Ex: 5000"
                value={estoqueAtualSacas}
                onChange={e => setEstoqueAtualSacas(e.target.value)}
                className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-2xl font-bold text-white outline-none focus:border-blue-500 w-full md:w-64"
              />
              <span className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-bold flex items-center">SACAS</span>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={80}/></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Custo Médio Ponderado (Saca)</p>
            <p className="text-5xl font-black text-green-400 mb-2">{formatMoeda(resultadoMedia.media)}</p>
            {resultadoMedia.historicoInsuficiente ? (
              <p className="text-xs font-bold text-yellow-500 bg-yellow-500/10 inline-block px-3 py-1 rounded-full">
                ⚠️ Histórico tem apenas {formatNum(resultadoMedia.sacasUsadas)} sacas. Média parcial.
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-400">Baseado nas últimas {formatNum(resultadoMedia.sacasUsadas)} sacas compradas.</p>
            )}
          </div>
        </div>

        {/* 2. FORMULÁRIO DE NOVA COMPRA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-4 mb-6 flex items-center gap-2">
            <DollarSign className="text-green-600"/> {editando ? 'Editar Compra' : 'Registrar Nova Compra'}
          </h3>
          
          <form onSubmit={handleSalvar} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 uppercase">Data Compra</label>
                <input type="date" required className="border p-3 rounded-lg bg-slate-50 font-medium" value={dataCompra} onChange={e=>setDataCompra(e.target.value)} />
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 uppercase">Fornecedor / Produtor</label>
                <select required className="border p-3 rounded-lg bg-slate-50" value={fornecedor} onChange={e=>setFornecedor(e.target.value)}>
                  <option value="">Selecione...</option>
                  {fornecedores.map(f => <option key={f.nome} value={f.nome}>{f.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 uppercase">Produto</label>
                <select className="border p-3 rounded-lg bg-slate-50" value={produto} onChange={e=>setProduto(e.target.value)}><option>Milho</option><option>Soja</option><option>Sorgo</option></select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 uppercase">Qtd (KG)</label>
                <input type="number" required placeholder="Ex: 30000" className="border p-3 rounded-lg bg-slate-50 font-bold" value={kg} onChange={e=>setKg(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 uppercase">Preço Saca (R$)</label>
                <input type="number" step="0.01" required placeholder="0,00" className="border border-blue-200 p-3 rounded-lg bg-white font-bold text-blue-700 outline-none focus:border-blue-500" value={valorSaca} onChange={e=>setValorSaca(e.target.value)} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1"><Truck size={14}/> Valor Frete (R$)</label>
                <input type="number" step="0.01" placeholder="0,00 (Opcional)" className="border p-3 rounded-lg bg-white" value={frete} onChange={e=>setFrete(e.target.value)} />
              </div>
              
              <div className="flex flex-col justify-end text-right">
                <p className="text-xs font-bold text-gray-400 uppercase">Total da Compra</p>
                <p className="text-xl font-bold text-gray-800">{formatMoeda(totalCompra)}</p>
              </div>
              <div className="flex flex-col justify-end text-right">
                <p className="text-xs font-bold text-gray-400 uppercase">Custo Real p/ Saca</p>
                <p className="text-xl font-black text-blue-600">{formatMoeda(custoFinalSaca)}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {editando && <button type="button" onClick={limparFormulario} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-800">Cancelar</button>}
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md transition">
                <Save size={20}/> {editando ? 'Atualizar Compra' : 'Registrar Compra'}
              </button>
            </div>
          </form>
        </div>

        {/* 3. HISTÓRICO DE COMPRAS COM FILTROS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">Histórico de Aquisições</h3>
            <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{comprasFiltradas.length} registros</span>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="p-4 bg-white border-b flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Filter size={12}/> Data Inicial</label>
              <input type="date" className="border border-gray-200 p-2 rounded-lg text-sm bg-slate-50 outline-none" value={filtroDataInicio} onChange={e=>setFiltroDataInicio(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Filter size={12}/> Data Final</label>
              <input type="date" className="border border-gray-200 p-2 rounded-lg text-sm bg-slate-50 outline-none" value={filtroDataFim} onChange={e=>setFiltroDataFim(e.target.value)} />
            </div>
            <div className="flex flex-col flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Filter size={12}/> Fornecedor</label>
              <select className="border border-gray-200 p-2 rounded-lg text-sm bg-slate-50 outline-none" value={filtroFornecedor} onChange={e=>setFiltroFornecedor(e.target.value)}>
                <option value="">Todos os Fornecedores</option>
                {fornecedores.map(f => <option key={f.nome} value={f.nome}>{f.nome}</option>)}
              </select>
            </div>
            {(filtroDataInicio || filtroDataFim || filtroFornecedor) && (
              <button 
                onClick={() => { setFiltroDataInicio(''); setFiltroDataFim(''); setFiltroFornecedor(''); }} 
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1 border border-transparent hover:border-red-100 transition"
              >
                <X size={14}/> Limpar Filtros
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b">
                <tr>
                  <th className="p-4 font-bold text-gray-500">Data</th>
                  <th className="p-4 font-bold text-gray-500">Fornecedor</th>
                  <th className="p-4 font-bold text-gray-500 text-right">Sacas</th>
                  <th className="p-4 font-bold text-gray-500 text-right">Valor Negociado</th>
                  <th className="p-4 font-bold text-gray-500 text-right">Frete</th>
                  <th className="p-4 font-bold text-blue-600 text-right bg-blue-50/50">Custo Final (Sc)</th>
                  <th className="p-4 font-bold text-gray-500 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.map(c => (
                  <tr key={c.id} className="border-b hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-gray-600">{c.data}</td>
                    <td className="p-4 font-bold text-gray-800">{c.fornecedor}</td>
                    <td className="p-4 text-right font-medium text-gray-600">{formatNum(c.sacas)} sc</td>
                    <td className="p-4 text-right text-gray-600">{formatMoeda(c.valor_saca)}</td>
                    <td className="p-4 text-right text-gray-500">{c.frete_total > 0 ? formatMoeda(c.frete_total) : '-'}</td>
                    <td className="p-4 text-right font-bold text-blue-700 bg-blue-50/30">{formatMoeda(c.custo_final_saca)}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => iniciarEdicao(c)} className="p-2 text-blue-500 hover:bg-blue-100 rounded transition"><Edit size={16}/></button>
                      <button onClick={() => handleExcluir(c.id)} className="p-2 text-red-500 hover:bg-red-100 rounded transition"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                {comprasFiltradas.length === 0 && (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-400">Nenhuma compra encontrada para os filtros atuais.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}