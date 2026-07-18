import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Package, Scale, Truck, ArrowDownRight, ArrowUpRight, ArrowRightLeft,
  AlertTriangle, Clock, LayoutDashboard, FileText, Settings, 
  DollarSign, Newspaper, Calendar as CalendarIcon, TrendingUp, TrendingDown, 
  RefreshCw, ExternalLink, Database, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- COMPONENTES VISUAIS ---
const ResumoCard = ({ titulo, valor, subtitulo, icone: Icone, cor, bgIcone }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition">
    <div>
      <p className="text-gray-500 text-sm font-bold mb-1 uppercase">{titulo}</p>
      <h3 className="text-2xl font-bold text-gray-800">{valor}</h3>
      <p className="text-xs text-gray-400 mt-2 font-medium">{subtitulo}</p>
    </div>
    <div className={`p-3 rounded-xl ${bgIcone || 'bg-gray-100'}`}>
      <Icone className={`w-6 h-6 ${cor || 'text-gray-500'}`} />
    </div>
  </div>
);

export default function Dashboard() {
  // --- ESTADOS DE DADOS INTERNOS ---
  const [pesagens, setPesagens] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [capacidadeSilo, setCapacidadeSilo] = useState(1500000);
  const [diasGrafico, setDiasGrafico] = useState(7);

  // --- ESTADOS DO MERCADO (Simulação de API) ---
  const [loadingMercado, setLoadingMercado] = useState(false);
  const [erroMercado, setErroMercado] = useState(false);
  const [cotacaoMilho, setCotacaoMilho] = useState<any>(null);
  const [cotacaoSoja, setCotacaoSoja] = useState<any>(null);
  const [mercadoFuturo, setMercadoFuturo] = useState<any[]>([]);
  const [noticias, setNoticias] = useState<any[]>([]);

  useEffect(() => {
    carregarDadosInternos();
    atualizarMercado();
  }, []);

  const getSafeArray = (key: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const carregarDadosInternos = () => {
    setPesagens(getSafeArray('listaPesagens'));
    setTransferencias(getSafeArray('listaTransferencias'));
    const cap = localStorage.getItem('capacidadeSilo');
    if(cap) setCapacidadeSilo(Number(cap));
  };

  // ============================================================================
  // SERVIÇOS DE INTEGRAÇÃO (Prontos para conectar com Backend/API)
  // ============================================================================
  const buscarCotacaoMilho = async () => {
    return { preco: 64.51, variacao: 0.22, data: '10/07/2026', tendencia: 'ALTA' };
  };

  const buscarCotacaoSoja = async () => {
    return { preco: 132.58, variacao: -0.08, data: '10/07/2026', tendencia: 'BAIXA' };
  };

  const buscarMercadoFuturo = async () => {
    return [
      { contrato: 'Jul/26', preco: 64.72, variacao: 0.15 },
      { contrato: 'Set/26', preco: 67.25, variacao: 0.30 },
      { contrato: 'Jan/27', preco: 73.60, variacao: -0.10 },
      { contrato: 'Mar/27', preco: 75.40, variacao: 0.45 },
      { contrato: 'Mai/27', preco: 74.62, variacao: -0.20 },
      { contrato: 'Jul/27', preco: 71.00, variacao: 0.00 },
    ];
  };

  const buscarNoticias = async () => {
    return [
      { id: 1, titulo: 'Safra americana pressiona preços globais', resumo: 'Aumento na estimativa de colheita nos EUA faz mercado futuro reagir com cautela nesta semana.', fonte: 'Notícias Agrícolas', data: 'Hoje', url: 'https://www.noticiasagricolas.com.br' },
      { id: 2, titulo: 'Exportações brasileiras crescem no semestre', resumo: 'Volume de grãos escoados pelos portos do Arco Norte bate novo recorde histórico.', fonte: 'Canal Rural', data: 'Ontem', url: 'https://www.canalrural.com.br' },
      { id: 3, titulo: 'Mercado acompanha dólar e clima na América do Sul', resumo: 'Volatilidade cambial e previsões de tempo seco nas próximas semanas direcionam as cotações.', fonte: 'Notícias Agrícolas', data: 'Ontem', url: 'https://www.noticiasagricolas.com.br' },
    ];
  };

  const atualizarMercado = async () => {
    setLoadingMercado(true);
    setErroMercado(false);
    try {
      // Simula o tempo de resposta da rede
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const milho = await buscarCotacaoMilho();
      const soja = await buscarCotacaoSoja();
      const futuro = await buscarMercadoFuturo();
      const news = await buscarNoticias();

      setCotacaoMilho(milho);
      setCotacaoSoja(soja);
      setMercadoFuturo(futuro);
      setNoticias(news);
    } catch (error) {
      setErroMercado(true);
    } finally {
      setLoadingMercado(false);
    }
  };

  // --- FUNÇÕES UTILITÁRIAS ---
  const formatarPeso = (valor: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0);
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  const kgParaSacas = (valor: number) => (valor || 0) / 60;
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  const safeDateISO = (data: any) => {
    if (typeof data === 'string' && data.includes('/')) {
       const partes = data.split('/');
       if(partes.length === 3) return `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  // ============================================================================
  // MOTOR DE CÁLCULOS DO ARMAZÉM
  // ============================================================================
  const saldos = useMemo(() => {
    const mapa: any = {};
    pesagens.filter(p => p && p.status === 'Finalizado').forEach(p => {
      const chave = `${p.fornecedor || 'Sem Nome'}|${p.produto || 'Milho'}|${p.safra || 'S/N'}`;
      if (!mapa[chave]) mapa[chave] = { cliente: p.fornecedor, produto: p.produto, safra: p.safra, kg: 0 };
      mapa[chave].kg += Number(p.saldo || p.liquido || p.pesoLiquido || 0);
    });
    transferencias.forEach(t => {
      const chaveDe = `${t.de}|${t.produto}|${t.safra}`;
      const chavePara = `${t.para}|${t.produto}|${t.safra}`;
      if (!mapa[chaveDe]) mapa[chaveDe] = { cliente: t.de, produto: t.produto, safra: t.safra, kg: 0 };
      if (!mapa[chavePara]) mapa[chavePara] = { cliente: t.para, produto: t.produto, safra: t.safra, kg: 0 };
      mapa[chaveDe].kg -= Number(t.qtd || 0);
      mapa[chavePara].kg += Number(t.qtd || 0);
    });
    return Object.values(mapa);
  }, [pesagens, transferencias]);

  const dashboard = useMemo(() => {
    let totalSilo = 0, totalMilho = 0, totalSoja = 0, totalSorgo = 0;
    const negativos: any[] = [];
    const ranking: any[] = [...saldos];

    saldos.forEach((s: any) => {
      if (s.kg < 0) negativos.push(s);
      totalSilo += s.kg;
      if (s.produto === 'Milho') totalMilho += s.kg;
      if (s.produto === 'Soja') totalSoja += s.kg;
      if (s.produto === 'Sorgo') totalSorgo += s.kg;
    });

    ranking.sort((a, b) => b.kg - a.kg);

    let entradasHoje = 0, saidasHoje = 0, caminhoesHoje = new Set();
    pesagens.forEach(p => {
      if (p && p.data === dataHoje) {
        if (p.tipo === 'ENTRADA') entradasHoje += Number(p.pesoLiquido || p.liquido || 0);
        if (p.tipo === 'SAIDA') saidasHoje += Math.abs(Number(p.pesoLiquido || p.liquido || 0));
        if (p.id) caminhoesHoje.add(p.id);
      }
    });

    return {
      totalSilo, totalMilho, totalSoja, totalSorgo,
      negativos, rankingTop10: ranking.slice(0, 10),
      entradasHoje, saidasHoje,
      caminhoesHoje: caminhoesHoje.size
    };
  }, [saldos, pesagens, transferencias, dataHoje]);

  const dadosGraficoMov = useMemo(() => {
    const dados: any = {};
    const hoje = new Date();
    for (let i = diasGrafico - 1; i >= 0; i--) {
      const d = new Date(hoje); d.setDate(d.getDate() - i);
      const dataIso = d.toISOString().split('T')[0];
      dados[dataIso] = { data: d.toLocaleDateString('pt-BR').substring(0,5), entradas: 0, saidas: 0 };
    }
    pesagens.forEach(p => {
      if (p && p.status === 'Finalizado' && p.data) {
        const dataIso = safeDateISO(p.data);
        if (dados[dataIso]) {
          if (p.tipo === 'ENTRADA') dados[dataIso].entradas += Number(p.pesoLiquido || p.liquido || 0) / 1000;
          if (p.tipo === 'SAIDA') dados[dataIso].saidas += Math.abs(Number(p.pesoLiquido || p.liquido || 0)) / 1000;
        }
      }
    });
    return Object.values(dados);
  }, [pesagens, diasGrafico]);

  const dadosPizzaSeguros = [
    { name: 'Milho', value: dashboard.totalMilho, color: '#F59E0B' },
    { name: 'Soja', value: dashboard.totalSoja, color: '#10B981' },
    { name: 'Sorgo', value: dashboard.totalSorgo, color: '#8B5CF6' }
  ].filter(d => d.value > 0);

  if (dadosPizzaSeguros.length === 0) dadosPizzaSeguros.push({ name: 'Silo Vazio', value: 1, color: '#E2E8F0' });

  const ocupacaoPerc = Math.min((dashboard.totalSilo / capacidadeSilo) * 100, 100) || 0;
  const corProgress = ocupacaoPerc > 90 ? 'bg-red-500' : ocupacaoPerc > 70 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* MENU LATERAL */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex h-full shadow-xl z-10">
        <div className="p-6 flex items-center gap-3 text-white font-bold text-2xl tracking-wide border-b border-slate-800">
          <Scale size={32} className="text-blue-500" /> AgroERP
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link to="/" className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-md"><LayoutDashboard size={20} /> Painel BI</Link>
          <Link to="/cadastro" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-lg transition"><FileText size={20} /> Cadastros</Link>
          <Link to="/pesagem" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-lg transition"><Truck size={20} /> Balança / Pesagem</Link>
          <Link to="/estoque" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-lg transition"><Package size={20} /> Estoque / Silo</Link>
          <Link to="/configuracoes" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-lg transition"><Settings size={20} /> Configurações</Link>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        
        <header className="bg-white p-6 shadow-sm flex justify-between items-center border-b border-gray-200 sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Centro de Inteligência</h2>
            <p className="text-sm font-medium text-gray-500">{dataHoje} • Visão estratégica do armazém</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-500"/>
              <span className="text-sm font-bold text-slate-700">Safra Atual</span>
            </div>
            <button 
              onClick={atualizarMercado} 
              disabled={loadingMercado}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition disabled:opacity-50"
            >
              <RefreshCw size={18} className={loadingMercado ? 'animate-spin' : ''}/>
              Atualizar Mercado
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
          
          {/* CARDS ESTOQUE (Focado puramente no físico) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ResumoCard 
              titulo="🌽 Milho Armazenado" 
              valor={`${formatarPeso(dashboard.totalMilho)} kg`} 
              subtitulo={`${formatarPeso(kgParaSacas(dashboard.totalMilho))} sacas`} 
              icone={Package} cor="text-yellow-600" bgIcone="bg-yellow-100" 
            />
            <ResumoCard 
              titulo="🌱 Soja Armazenada" 
              valor={`${formatarPeso(dashboard.totalSoja)} kg`} 
              subtitulo={`${formatarPeso(kgParaSacas(dashboard.totalSoja))} sacas`} 
              icone={Package} cor="text-emerald-600" bgIcone="bg-emerald-100" 
            />
            <ResumoCard 
              titulo="🌾 Sorgo Armazenado" 
              valor={`${formatarPeso(dashboard.totalSorgo)} kg`} 
              subtitulo={`${formatarPeso(kgParaSacas(dashboard.totalSorgo))} sacas`} 
              icone={Package} cor="text-purple-600" bgIcone="bg-purple-100" 
            />
            <ResumoCard 
              titulo="Movimentação Hoje" 
              valor={`${formatarPeso(dashboard.entradasHoje - dashboard.saidasHoje)} kg`} 
              subtitulo={`${dashboard.caminhoesHoje} caminhões atendidos`} 
              icone={Truck} cor="text-blue-600" bgIcone="bg-blue-100" 
            />
          </div>

          {/* PAINEL DE MERCADO E NOTÍCIAS (Estilo TradingView) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Mercado Agro */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold uppercase text-sm tracking-wider flex items-center gap-2"><DollarSign size={18} className="text-green-400"/> Mercado Agro</h3>
                <span className="text-xs text-slate-400">Fonte: Notícias Agrícolas / CEPEA</span>
              </div>
              
              {erroMercado ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <AlertTriangle size={40} className="text-red-400 mb-3"/>
                  <p className="font-bold text-gray-700">Não foi possível atualizar as cotações.</p>
                  <p className="text-sm text-gray-500">Verifique sua conexão com a internet.</p>
                </div>
              ) : loadingMercado ? (
                <div className="flex-1 flex items-center justify-center p-12 text-gray-400 font-bold"><RefreshCw size={24} className="animate-spin mr-2"/> Atualizando Mercado...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  
                  {/* Milho e B3 */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">🌽 Milho (Indicador CEPEA)</h4>
                      <div className="flex items-end gap-3">
                        <p className="text-4xl font-black text-gray-800">{formatarMoeda(cotacaoMilho?.preco)}<span className="text-lg text-gray-500 font-medium">/sc</span></p>
                        <div className={`flex items-center gap-1 mb-1 font-bold ${cotacaoMilho?.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {cotacaoMilho?.variacao >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                          {cotacaoMilho?.variacao >= 0 ? '+' : ''}{cotacaoMilho?.variacao}%
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Atualizado: {cotacaoMilho?.data}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-2">Mercado Futuro (B3)</h4>
                      <div className="space-y-2">
                        {mercadoFuturo.map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-sm hover:bg-slate-50 p-1 rounded">
                            <span className="font-bold text-gray-700">{f.contrato}</span>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{formatarMoeda(f.preco)}</span>
                              <span className={`flex items-center justify-end w-16 font-bold ${f.variacao > 0 ? 'text-green-600' : f.variacao < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {f.variacao > 0 ? '▲' : f.variacao < 0 ? '▼' : '-'} {Math.abs(f.variacao).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Soja e Info */}
                  <div className="p-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">🌱 Soja (Indicador CEPEA)</h4>
                      <div className="flex items-end gap-3">
                        <p className="text-4xl font-black text-gray-800">{formatarMoeda(cotacaoSoja?.preco)}<span className="text-lg text-gray-500 font-medium">/sc</span></p>
                        <div className={`flex items-center gap-1 mb-1 font-bold ${cotacaoSoja?.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {cotacaoSoja?.variacao >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                          {cotacaoSoja?.variacao >= 0 ? '+' : ''}{cotacaoSoja?.variacao}%
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Atualizado: {cotacaoSoja?.data}</p>
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                       <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Tendência Automática</h4>
                       <div className="flex items-center gap-2">
                         {cotacaoMilho?.tendencia === 'ALTA' ? (
                           <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-bold text-sm flex items-center gap-1"><TrendingUp size={16}/> Alta (Milho)</span>
                         ) : (
                           <span className="bg-red-100 text-red-800 px-3 py-1 rounded font-bold text-sm flex items-center gap-1"><TrendingDown size={16}/> Baixa (Milho)</span>
                         )}
                         {cotacaoSoja?.tendencia === 'ALTA' ? (
                           <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-bold text-sm flex items-center gap-1"><TrendingUp size={16}/> Alta (Soja)</span>
                         ) : (
                           <span className="bg-red-100 text-red-800 px-3 py-1 rounded font-bold text-sm flex items-center gap-1"><TrendingDown size={16}/> Baixa (Soja)</span>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Painel de Notícias */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wider flex items-center gap-2"><Newspaper size={18} className="text-blue-600"/> Últimas Notícias</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {erroMercado ? (
                  <p className="text-sm text-gray-400 text-center py-8">Não foi possível carregar as notícias.</p>
                ) : loadingMercado ? (
                  <p className="text-sm text-gray-400 text-center py-8">Buscando radar do agronegócio...</p>
                ) : (
                  noticias.map((n: any) => (
                    <div 
                      key={n.id} 
                      onClick={() => window.open(n.url, '_blank')}
                      className="p-4 border-b last:border-0 hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <h4 className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition flex justify-between items-start gap-2">
                        {n.titulo} <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 text-blue-500 shrink-0 mt-0.5"/>
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.resumo}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{n.fonte}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{n.data}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* GRÁFICOS E CAPACIDADE FÍSICA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Fluxo de Operações (Toneladas)</h3>
                <select className="border p-1.5 rounded-lg text-sm font-bold bg-slate-50 outline-none text-gray-600" value={diasGrafico} onChange={e=>setDiasGrafico(Number(e.target.value))}>
                  <option value={7}>Últimos 7 dias</option>
                  <option value={30}>Últimos 30 dias</option>
                </select>
              </div>
              <div className="h-72 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoMov} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                    <Bar dataKey="entradas" name="Entradas (TON)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="saidas" name="Saídas (TON)" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={100}/></div>
                <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider relative z-10">Ocupação da Planta</h3>
                <div className="flex justify-between items-end relative z-10 mb-2">
                  <p className="text-3xl font-black">{ocupacaoPerc.toFixed(1)}%</p>
                  <p className="text-sm text-slate-300 font-medium">Livre: {formatarPeso(Math.max(capacidadeSilo - dashboard.totalSilo, 0))} kg</p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 mb-2 relative z-10">
                  <div className={`h-3 rounded-full transition-all duration-1000 ${corProgress}`} style={{ width: `${ocupacaoPerc}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 text-right relative z-10">Cap. Máxima: {formatarPeso(capacidadeSilo)} kg</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider w-full text-left">Distribuição Física</h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dadosPizzaSeguros} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                        {dadosPizzaSeguros.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${formatarPeso(value)} kg`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* RANKING E ALERTAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden">
              <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wider">Top 10 Maiores Estoques</h3>
                <Link to="/estoque" className="text-xs font-bold text-blue-600 hover:text-blue-800">Ir para Estoque</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b">
                    <tr><th className="p-4 font-bold text-gray-500">Cliente</th><th className="p-4 font-bold text-gray-500">Produto/Safra</th><th className="p-4 font-bold text-gray-500 text-right">KG</th><th className="p-4 font-bold text-gray-500 text-right">Sacas</th></tr>
                  </thead>
                  <tbody>
                    {dashboard.rankingTop10.map((s:any, i:number) => (
                      <tr key={i} className="border-b hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-5 text-center text-xs font-bold text-gray-400">{i+1}º</span> {s.cliente}
                        </td>
                        <td className="p-4 text-gray-600">{s.produto} <span className="text-xs text-gray-400 ml-1">{s.safra}</span></td>
                        <td className="p-4 text-right font-bold text-blue-700">{formatarPeso(s.kg)}</td>
                        <td className="p-4 text-right font-medium text-gray-600">{formatarPeso(kgParaSacas(s.kg))}</td>
                      </tr>
                    ))}
                    {dashboard.rankingTop10.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum estoque registrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b bg-slate-50">
                <h3 className="font-bold text-gray-800 uppercase text-sm tracking-wider flex items-center gap-2"><AlertTriangle className="text-red-500 w-4 h-4"/> Centro de Alertas</h3>
              </div>
              <div className="p-6 flex-1 bg-white space-y-4 overflow-y-auto">
                {pesagens.filter(p => p && p.status === 'Pendente').length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-bold text-yellow-800 flex items-center gap-2"><Clock size={16}/> Caminhões no Pátio</p>
                    <p className="text-xs text-yellow-700 mt-1">Existem {pesagens.filter(p => p.status === 'Pendente').length} pesagens aguardando tara de saída.</p>
                  </div>
                )}
                
                {dashboard.negativos.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={16}/> Descoberto (Saldos Negativos)</p>
                    <div className="space-y-1 mt-2">
                      {dashboard.negativos.slice(0,3).map((n:any, i:number) => (
                        <div key={i} className="flex justify-between text-xs font-bold text-red-900 bg-red-100 px-2 py-1 rounded"><span>{n.cliente}</span> <span>{formatarPeso(n.kg)} kg</span></div>
                      ))}
                      {dashboard.negativos.length > 3 && <p className="text-xs font-bold text-red-500 mt-1">+ {dashboard.negativos.length - 3} outros...</p>}
                    </div>
                  </div>
                )}

                {pesagens.filter(p => p && p.status === 'Pendente').length === 0 && dashboard.negativos.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                    <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2"><Scale size={24}/></div>
                    <p className="text-sm font-bold text-gray-500">Operação Normal</p>
                    <p className="text-xs text-gray-400">Nenhuma pendência no pátio ou saldos descobertos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}