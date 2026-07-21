import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, ArrowLeft, Truck, Scale, Trash2, Edit, Printer, AlertTriangle, 
  ArrowDownCircle, ArrowUpCircle, PackageSearch, Search, Filter, 
  Download, FileSpreadsheet, X, ChevronLeft, ChevronRight, UserSearch, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient'; // ☁️ IMPORTAÇÃO DA NUVEM AQUI

export default function Pesagem() {
  const [abaAtiva, setAbaAtiva] = useState('Nova Pesagem');
  
  // --- ESTADOS: DADOS GERAIS ---
  const [historico, setHistorico] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [listaMotoristas, setListaMotoristas] = useState<any[]>([]);
  const [listaVeiculos, setListaVeiculos] = useState<any[]>([]);
  const [listaSafras, setListaSafras] = useState<string[]>([]);
  
  // --- ESTADOS: NOVA PESAGEM ---
  const [editando, setEditando] = useState<any>(null);
  const [tipoOperacao, setTipoOperacao] = useState('ENTRADA');
  const [fornecedor, setFornecedor] = useState('');
  const [produto, setProduto] = useState('Milho');
  const [safra, setSafra] = useState('');
  const [motorista, setMotorista] = useState('');
  const [placa, setPlaca] = useState('');
  const [pesoEntrada, setPesoEntrada] = useState('');
  const [pesoSaida, setPesoSaida] = useState('');
  const [umidade, setUmidade] = useState('');
  const [impureza, setImpureza] = useState('');
  const [avarias, setAvarias] = useState('');
  const [observacao, setObservacao] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [romaneio, setRomaneio] = useState('');
  const [armazem, setArmazem] = useState('');

  // --- ESTADOS: HISTÓRICO E FILTROS ---
  const [filtroRapido, setFiltroRapido] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('Todos');
  const [filtroProduto, setFiltroProduto] = useState('Todos');
  const [filtroSafra, setFiltroSafra] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [ordenacao, setOrdenacao] = useState('Mais recente');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [pesagemModal, setPesagemModal] = useState<any>(null);

  // --- ESTADOS: CONSULTA DE CLIENTE ---
  const [consultaCliente, setConsultaCliente] = useState('');
  const [consultaSafra, setConsultaSafra] = useState('');

  const ITENS_POR_PAGINA = 20;

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroRapido, dataInicio, dataFim, filtroCliente, filtroProduto, filtroSafra, filtroTipo, buscaTexto, ordenacao]);

  // 🚀 BUSCA TUDO DIRETO DA NUVEM E MANTÉM COMPATIBILIDADE COM SEU SISTEMA
  const carregarTudo = async () => {
    // 1. Carrega as Pessoas/Clientes da nuvem
    const { data: clientesDB } = await supabase.from('pessoas').select('*').order('nome', { ascending: true });
    if (clientesDB) setListaClientes(clientesDB);

    // 2. Carrega as Pesagens da nuvem
    const { data: pesagensDB } = await supabase.from('pesagens').select('*').order('id', { ascending: false });
    if (pesagensDB) {
      const formatadas = pesagensDB.map(p => ({
        ...p,
        id_banco: p.id,
        id: p.ticket
      }));
      setHistorico(formatadas);
    }

    // 3. Carrega Motoristas da nuvem
    const { data: motoristasDB } = await supabase.from('motoristas').select('*').order('nome', { ascending: true });
    if (motoristasDB) setListaMotoristas(motoristasDB);

    // 4. Carrega Veículos (Placas) da nuvem
    const { data: veiculosDB } = await supabase.from('veiculos').select('*').order('placa', { ascending: true });
    if (veiculosDB) setListaVeiculos(veiculosDB);

    setTransferencias(JSON.parse(localStorage.getItem('listaTransferencias') || '[]'));
    setListaSafras(JSON.parse(localStorage.getItem('listaSafras') || '["2025/2026"]'));
  };

  // --- FUNÇÕES UTILITÁRIAS ---
  const formatarPeso = (valor: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0);
  const converterDataBRParaISO = (dataBr: string) => {
    if (!dataBr) return '';
    const [d, m, y] = dataBr.split('/');
    return `${y}-${m}-${d}`;
  };
  const hojeISO = new Date().toISOString().split('T')[0];

  // --- LÓGICA DE CÁLCULO DA NOVA PESAGEM ---
  const pEnt = Number(pesoEntrada) || 0;
  const pSai = Number(pesoSaida) || 0;
  const liquidoBase = pEnt - pSai;
  const magnitude = Math.abs(liquidoBase);

  let percentualDesconto = 0;
  if (produto === 'Milho') {
    const u = Number(umidade) || 0;
    const i = Number(impureza) || 0;
    const a = Number(avarias) || 0;
    let descUmidade = 0;
    if (u > 14 && u <= 18) descUmidade = (u - 14) * 1.4;
    else if (u > 18) descUmidade = (4 * 1.4) + ((u - 18) * 1.5);
    let descImpureza = Math.max(0, i - 1); 
    percentualDesconto = descUmidade + descImpureza + a;
  } else {
    percentualDesconto = (Number(umidade) + Number(impureza) + Number(avarias));
  }

  const liquidoFinalAbs = magnitude - (magnitude * (percentualDesconto / 100));
  const liquidoFinal = tipoOperacao === 'ENTRADA' ? liquidoFinalAbs : -liquidoFinalAbs;

  const saldoAtualCarga = useMemo(() => {
    if (!fornecedor || !safra) return 0;
    let saldo = 0;
    historico.forEach(p => { if (p.status === 'Finalizado' && p.fornecedor === fornecedor && p.safra === safra) saldo += Number(p.saldo); });
    transferencias.forEach(t => {
      if (t.safra === safra) {
        if (t.para === fornecedor) saldo += Number(t.qtd);
        if (t.de === fornecedor) saldo -= Number(t.qtd);
      }
    });
    return saldo;
  }, [historico, transferencias, fornecedor, safra]);
  const avisoSaldoNegativo = tipoOperacao === 'SAIDA' && (saldoAtualCarga - liquidoFinalAbs < 0);

  // --- AÇÕES NOVA PESAGEM ☁️ ---
  const gerarProximoTicket = () => {
    if (historico.length === 0) return 'PES-000001';
    const maxId = historico.reduce((max, p) => Math.max(max, parseInt(p.id?.replace(/\D/g, '') || 0)), 0);
    return 'PES-' + String(maxId + 1).padStart(6, '0');
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safra) return alert('Selecione uma safra!');
    
    const ticketId = editando ? editando.id : gerarProximoTicket();
    
    const novaPesagemParaDB = {
      ticket: ticketId,
      tipo: tipoOperacao, fornecedor, produto, motorista, placa, safra,
      pesoEntrada: pEnt, pesoSaida: pSai, pesoLiquido: liquidoFinalAbs, saldo: liquidoFinal,
      umidade: Number(umidade) || 0, impureza: Number(impureza) || 0, avarias: Number(avarias) || 0,
      status: pSai > 0 ? 'Finalizado' : 'Pendente',
      observacao, notaFiscal, romaneio, armazem,
      data: editando ? editando.data : new Date().toLocaleDateString('pt-BR'),
      hora: editando ? editando.hora : new Date().toLocaleTimeString('pt-BR')
    };

    let erroSupabase;

    if (editando && editando.id_banco) {
      const { error } = await supabase.from('pesagens').update(novaPesagemParaDB).eq('id', editando.id_banco);
      erroSupabase = error;
    } else {
      const { error } = await supabase.from('pesagens').insert([novaPesagemParaDB]);
      erroSupabase = error;
    }

    if (erroSupabase) {
      console.error(erroSupabase);
      return alert(`Erro ao salvar no banco! Detalhe: ${erroSupabase.message}`);
    }

    setEditando(null);
    limparFormulario();
    await carregarTudo();
    alert(`Ticket ${ticketId} salvo na nuvem com sucesso! ☁️`);
  };

  const iniciarEdicao = (item: any) => {
    setAbaAtiva('Nova Pesagem');
    setEditando(item); setTipoOperacao(item.tipo || 'ENTRADA');
    setFornecedor(item.fornecedor); setProduto(item.produto); setSafra(item.safra);
    setMotorista(item.motorista); setPlaca(item.placa);
    setPesoEntrada(item.pesoEntrada); setPesoSaida(item.pesoSaida);
    setUmidade(item.umidade || ''); setImpureza(item.impureza || ''); setAvarias(item.avarias || '');
    setObservacao(item.observacao || ''); setNotaFiscal(item.notaFiscal || ''); 
    setRomaneio(item.romaneio || ''); setArmazem(item.armazem || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limparFormulario = () => {
    setEditando(null); setTipoOperacao('ENTRADA'); setFornecedor(''); setProduto('Milho'); 
    setMotorista(''); setPlaca(''); setSafra(''); setPesoEntrada(''); setPesoSaida(''); 
    setUmidade(''); setImpureza(''); setAvarias(''); setObservacao(''); setNotaFiscal(''); 
    setRomaneio(''); setArmazem('');
  };

  const imprimirTicket = (item: any) => {
    const pEnt = Number(item.pesoEntrada) || 0;
    const pSai = Number(item.pesoSaida) || 0;
    const magnitude = Math.abs(pEnt - pSai);
    const u = Number(item.umidade) || 0;
    const i = Number(item.impureza) || 0;
    const a = Number(item.avarias) || 0;

    let descUmidadePerc = 0;
    let descImpurezaPerc = 0;
    let descAvariasPerc = a;

    if (item.produto === 'Milho') {
      if (u > 14 && u <= 18) descUmidadePerc = (u - 14) * 1.4;
      else if (u > 18) descUmidadePerc = (4 * 1.4) + ((u - 18) * 1.5);
      descImpurezaPerc = Math.max(0, i - 1);
    } else {
      descUmidadePerc = u;
      descImpurezaPerc = i;
    }

    const kgUmidade = magnitude * (descUmidadePerc / 100);
    const kgImpureza = magnitude * (descImpurezaPerc / 100);
    const kgAvarias = magnitude * (descAvariasPerc / 100);

    const w = window.open('', '_blank');
    w?.document.write(`
      <div style="font-family: monospace; padding: 20px; width: 320px; margin: 0 auto; font-size: 12px;">
        <h2 style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; font-size: 14px;">TICKET DE PESAGEM</h2>
        <p><strong>Ticket:</strong> ${item.id}</p>
        <p><strong>Data/Hora:</strong> ${item.data} - ${item.hora}</p>
        <p><strong>Operacao:</strong> ${item.tipo}</p>
        <p><strong>Cliente:</strong> ${item.fornecedor}</p>
        <p><strong>Produto/Safra:</strong> ${item.produto} - ${item.safra}</p>
        <p><strong>Motorista:</strong> ${item.motorista || '-'}</p>
        <p><strong>Placa:</strong> ${item.placa || '-'}</p>
        <hr style="border: 1px dashed #000;" />
        <p><strong>Classificação / Descontos:</strong></p>
        <p>• Umidade: ${u.toFixed(2)}% (Desc: ${descUmidadePerc.toFixed(2)}% | ${formatarPeso(kgUmidade)} kg)</p>
        <p>• Impureza: ${i.toFixed(2)}% (Desc: ${descImpurezaPerc.toFixed(2)}% | ${formatarPeso(kgImpureza)} kg)</p>
        <p>• Avarias: ${a.toFixed(2)}% (Desc: ${descAvariasPerc.toFixed(2)}% | ${formatarPeso(kgAvarias)} kg)</p>
        <hr style="border: 1px dashed #000;" />
        <p><strong>Peso Entrada:</strong> ${formatarPeso(item.pesoEntrada)} kg</p>
        <p><strong>Peso Saida:</strong> ${formatarPeso(item.pesoSaida)} kg</p>
        <h3 style="text-align: center; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; font-size: 14px;">LIQUIDO: ${formatarPeso(item.pesoLiquido)} kg</h3>
      </div>
    `);
    w?.document.close();
    w?.print();
  };

  const exportarExcel = () => {
    let csv = "Ticket;Data;Hora;Tipo;Cliente;Produto;Safra;Entrada;Saida;Liquido;Motorista;Placa;Status\n";
    historicoFiltrado.forEach(p => {
      csv += `${p.id};${p.data};${p.hora};${p.tipo};${p.fornecedor};${p.produto};${p.safra};${p.pesoEntrada};${p.pesoSaida};${p.pesoLiquido};${p.motorista};${p.placa};${p.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', 'historico_pesagens.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const limparFiltros = () => {
    setFiltroRapido('Todos'); setDataInicio(''); setDataFim(''); setFiltroCliente('Todos');
    setFiltroProduto('Todos'); setFiltroSafra('Todas'); setFiltroTipo('Todos'); setBuscaTexto('');
    setOrdenacao('Mais recente');
  };

  const historicoFiltrado = useMemo(() => {
    let filtrado = [...historico];

    const hoje = new Date();
    filtrado = filtrado.filter(p => {
      const dataIso = converterDataBRParaISO(p.data);
      const dataP = new Date(dataIso + 'T12:00:00');

      if (filtroRapido === 'Hoje') return dataIso === hojeISO;
      if (filtroRapido === 'Ontem') {
        const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
        return dataIso === ontem.toISOString().split('T')[0];
      }
      if (filtroRapido === 'Últimos 7 dias') {
        const seteDias = new Date(hoje); seteDias.setDate(seteDias.getDate() - 7);
        return dataP >= seteDias;
      }
      if (filtroRapido === 'Este mês') {
        return dataP.getMonth() === hoje.getMonth() && dataP.getFullYear() === hoje.getFullYear();
      }
      if (dataInicio && dataFim) {
        return dataIso >= dataInicio && dataIso <= dataFim;
      }
      return true;
    });

    if (filtroCliente !== 'Todos') filtrado = filtrado.filter(p => p.fornecedor === filtroCliente);
    if (filtroProduto !== 'Todos') filtrado = filtrado.filter(p => p.produto === filtroProduto);
    if (filtroSafra !== 'Todas') filtrado = filtrado.filter(p => p.safra === filtroSafra);
    if (filtroTipo !== 'Todos') filtrado = filtrado.filter(p => p.tipo === filtroTipo);

    if (buscaTexto) {
      const b = buscaTexto.toLowerCase();
      filtrado = filtrado.filter(p => 
        (p.id && p.id.toLowerCase().includes(b)) || 
        (p.fornecedor && p.fornecedor.toLowerCase().includes(b)) ||
        (p.motorista && p.motorista.toLowerCase().includes(b)) ||
        (p.placa && p.placa.toLowerCase().includes(b)) ||
        (p.notaFiscal && p.notaFiscal.toLowerCase().includes(b))
      );
    }

    filtrado.sort((a, b) => {
      if (ordenacao === 'Mais recente') return (b.id || '').localeCompare(a.id || '');
      if (ordenacao === 'Mais antigo') return (a.id || '').localeCompare(b.id || '');
      if (ordenacao === 'Maior peso') return b.pesoLiquido - a.pesoLiquido;
      if (ordenacao === 'Menor peso') return a.pesoLiquido - b.pesoLiquido;
      if (ordenacao === 'Cliente A-Z') return a.fornecedor.localeCompare(b.fornecedor);
      if (ordenacao === 'Cliente Z-A') return b.fornecedor.localeCompare(a.fornecedor);
      return 0;
    });

    return filtrado;
  }, [historico, filtroRapido, dataInicio, dataFim, filtroCliente, filtroProduto, filtroSafra, filtroTipo, buscaTexto, ordenacao]);

  const paginasTotais = Math.ceil(historicoFiltrado.length / ITENS_POR_PAGINA);
  const itensPaginados = historicoFiltrado.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const stats = useMemo(() => {
    let entradas = 0; let saidas = 0; const clientesSet = new Set();
    historicoFiltrado.forEach(p => {
      if (p.tipo === 'ENTRADA') entradas += p.pesoLiquido;
      if (p.tipo === 'SAIDA') saidas += Math.abs(p.pesoLiquido);
      clientesSet.add(p.fornecedor);
    });
    return { entradas, saidas, saldo: entradas - saidas, qtdClientes: clientesSet.size, total: historicoFiltrado.length };
  }, [historicoFiltrado]);

  const dadosConsulta = useMemo(() => {
    if (!consultaCliente) return null;
    let entradas = 0; let saidas = 0; let ultMov = ''; let extratoList: any[] = [];
    
    historico.forEach(p => {
      if (p.status === 'Finalizado' && p.fornecedor === consultaCliente && (consultaSafra === '' || p.safra === consultaSafra)) {
        if(p.tipo === 'ENTRADA') entradas += p.pesoLiquido;
        if(p.tipo === 'SAIDA') saidas += Math.abs(p.pesoLiquido);
        if(!ultMov || p.data > ultMov) ultMov = p.data;
        extratoList.push({ data: p.data, id: p.id, op: p.tipo === 'ENTRADA' ? 'Pesagem ENTRADA' : 'Pesagem SAÍDA', produto: p.produto, peso: p.saldo });
      }
    });

    transferencias.forEach(t => {
      if (consultaSafra === '' || t.safra === consultaSafra) {
        if (t.para === consultaCliente) {
          entradas += t.qtd;
          extratoList.push({ data: t.data, id: `TR-${t.id}`, op: `Transf. Recebida (${t.de})`, produto: t.produto, peso: t.qtd });
        }
        if (t.de === consultaCliente) {
          saidas += t.qtd;
          extratoList.push({ data: t.data, id: `TR-${t.id}`, op: `Transf. Enviada (${t.para})`, produto: t.produto, peso: -t.qtd });
        }
      }
    });

    const saldo = entradas - saidas;
    extratoList.sort((a,b) => a.id > b.id ? 1 : -1);

    return { saldo, sacas: saldo / 60, entradas, saidas, ultMov, extrato: extratoList };
  }, [consultaCliente, consultaSafra, historico, transferencias]);


  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6 print:w-full print:max-w-none">
        
        <Link to="/" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition print:hidden">
          <ArrowLeft size={20} /> Voltar ao Painel
        </Link>

        <div className="flex gap-4 border-b border-gray-200 print:hidden">
          {['Nova Pesagem', 'Histórico de Pesagens', 'Consulta de Cliente'].map(aba => (
            <button key={aba} onClick={() => {setAbaAtiva(aba); limparFormulario();}} className={`pb-3 font-bold text-lg transition-colors border-b-2 px-4 ${abaAtiva === aba ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-500'}`}>
              {aba}
            </button>
          ))}
        </div>

        {abaAtiva === 'Nova Pesagem' && (
          <div className="space-y-6 animate-fade-in print:hidden">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Truck className="text-blue-600" /> {editando ? `Editando Ticket: ${editando.id}` : 'Balança Rodoviária'}
                </h2>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setTipoOperacao('ENTRADA')} className={`px-6 py-2 rounded-md font-bold text-sm transition ${tipoOperacao === 'ENTRADA' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>ENTRADA</button>
                  <button type="button" onClick={() => setTipoOperacao('SAIDA')} className={`px-6 py-2 rounded-md font-bold text-sm transition ${tipoOperacao === 'SAIDA' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>SAÍDA</button>
                </div>
              </div>

              <form onSubmit={handleSalvar} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6 lg:col-span-2">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Informações da Carga</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <select className="border p-3 rounded-lg md:col-span-2 bg-slate-50 outline-none" value={fornecedor} onChange={e=>setFornecedor(e.target.value)} required>
                      <option value="">Cliente / Fornecedor *</option>
                      {listaClientes.map(c => <option key={c.id || c.nome} value={c.nome}>{c.nome}</option>)}
                    </select>
                    <select className="border p-3 rounded-lg bg-slate-50 outline-none" value={safra} onChange={e=>setSafra(e.target.value)} required>
                      <option value="">Safra *</option>
                      {listaSafras.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="border p-3 rounded-lg bg-slate-50" value={produto} onChange={e=>setProduto(e.target.value)}><option>Milho</option><option>Soja</option><option>Sorgo</option></select>
                    <select className="border p-3 rounded-lg bg-slate-50" value={motorista} onChange={e=>setMotorista(e.target.value)}><option value="">Motorista (Opcional)</option>{listaMotoristas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}</select>
                    <select className="border p-3 rounded-lg bg-slate-50 uppercase font-medium" value={placa} onChange={e=>setPlaca(e.target.value)}><option value="">Placa (Opcional)</option>{listaVeiculos.map(v => <option key={v.id} value={v.placa}>{v.placa}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed">
                    <input className="border p-3 rounded-lg bg-slate-50" placeholder="Nota Fiscal" value={notaFiscal} onChange={e=>setNotaFiscal(e.target.value)} />
                    <input className="border p-3 rounded-lg bg-slate-50" placeholder="Romaneio" value={romaneio} onChange={e=>setRomaneio(e.target.value)} />
                    <input className="border p-3 rounded-lg bg-slate-50" placeholder="Armazém/Silo" value={armazem} onChange={e=>setArmazem(e.target.value)} />
                    <input className="border p-3 rounded-lg bg-slate-50 md:col-span-3" placeholder="Observações" value={observacao} onChange={e=>setObservacao(e.target.value)} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-4 border-t border-dashed">Classificação / Qualidade</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <input className="border p-3 rounded-lg bg-slate-50" placeholder="Umidade (%)" type="number" step="0.01" value={umidade} onChange={e=>setUmidade(e.target.value)} />
                    <input className="border p-3 rounded-lg bg-slate-50" placeholder="Impureza (%)" type="number" step="0.01" value={impureza} onChange={e=>setImpureza(e.target.value)} />
                    <input className="border p-3 rounded-lg bg-slate-50" placeholder="Avarias (%)" type="number" step="0.01" value={avarias} onChange={e=>setAvarias(e.target.value)} />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Scale size={16}/> Pesagem (KG)</h3>
                    <input className="w-full border-2 border-blue-200 p-4 rounded-lg mb-3 text-xl font-bold bg-white focus:border-blue-500 outline-none" placeholder="Peso Entrada" type="number" value={pesoEntrada} onChange={e=>setPesoEntrada(e.target.value)} />
                    <input className="w-full border-2 border-blue-200 p-4 rounded-lg mb-4 text-xl font-bold bg-white focus:border-blue-500 outline-none" placeholder="Peso Saída (Tara)" type="number" value={pesoSaida} onChange={e=>setPesoSaida(e.target.value)} />
                  </div>
                  <div>
                    {avisoSaldoNegativo && (
                      <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm rounded-lg flex items-start gap-2">
                        <AlertTriangle className="shrink-0 mt-0.5" size={18}/>
                        <p>Atenção: A expedição deixará o cliente negativo em <strong>{formatarPeso(saldoAtualCarga - liquidoFinalAbs)} kg</strong>.</p>
                      </div>
                    )}
                    <div className={`p-5 rounded-xl text-center shadow-md border ${tipoOperacao === 'ENTRADA' ? 'bg-blue-600 border-blue-700' : 'bg-orange-600 border-orange-700'}`}>
                      <p className="text-xs text-white uppercase tracking-wider opacity-80">Peso Líquido</p>
                      <p className="text-4xl font-bold text-white tracking-tight">{tipoOperacao === 'ENTRADA' ? '+' : '-'}{formatarPeso(liquidoFinalAbs)} <span className="text-lg font-normal opacity-80">kg</span></p>
                    </div>
                    <button className={`w-full text-white p-4 rounded-lg font-bold mt-4 flex justify-center items-center gap-2 shadow-lg transition-all ${tipoOperacao === 'ENTRADA' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                      <Save size={20} /> Salvar na Nuvem
                    </button>
                    {editando && <button type="button" onClick={limparFormulario} className="w-full mt-2 text-gray-500 hover:text-gray-800 font-bold p-2">Cancelar Edição</button>}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {abaAtiva === 'Histórico de Pesagens' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Pesagens</p><p className="font-bold text-xl">{stats.total}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500"><p className="text-xs font-bold text-gray-400 uppercase">Entradas (KG)</p><p className="font-bold text-xl text-green-600">{formatarPeso(stats.entradas)}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-red-500"><p className="text-xs font-bold text-gray-400 uppercase">Saídas (KG)</p><p className="font-bold text-xl text-red-600">{formatarPeso(stats.saidas)}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-purple-500"><p className="text-xs font-bold text-gray-400 uppercase">Saldo Mov.</p><p className="font-bold text-xl text-purple-700">{formatarPeso(stats.saldo)}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-orange-500"><p className="text-xs font-bold text-gray-400 uppercase">Clientes</p><p className="font-bold text-xl text-orange-600">{stats.qtdClientes}</p></div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 print:hidden">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex gap-2">
                  {['Todos', 'Hoje', 'Ontem', 'Últimos 7 dias', 'Este mês'].map(f => (
                    <button key={f} onClick={() => setFiltroRapido(f)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${filtroRapido === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}>{f}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={limparFiltros} className="text-sm font-bold text-gray-500 hover:text-red-500 flex items-center gap-1"><X size={16}/> Limpar Filtros</button>
                  <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700"><FileSpreadsheet size={16}/> Exportar Excel</button>
                  <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900"><Printer size={16}/> Imprimir</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="flex flex-col"><label className="text-xs font-bold text-gray-500 mb-1">Data Inicial</label><input type="date" className="border p-2 rounded bg-slate-50" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} /></div>
                <div className="flex flex-col"><label className="text-xs font-bold text-gray-500 mb-1">Data Final</label><input type="date" className="border p-2 rounded bg-slate-50" value={dataFim} onChange={e=>setDataFim(e.target.value)} /></div>
                <div className="flex flex-col"><label className="text-xs font-bold text-gray-500 mb-1">Cliente</label><select className="border p-2 rounded bg-slate-50" value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}><option>Todos</option>{listaClientes.map(c=><option key={c.id || c.nome}>{c.nome}</option>)}</select></div>
                <div className="flex flex-col"><label className="text-xs font-bold text-gray-500 mb-1">Safra</label><select className="border p-2 rounded bg-slate-50" value={filtroSafra} onChange={e=>setFiltroSafra(e.target.value)}><option>Todas</option>{listaSafras.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="flex flex-col"><label className="text-xs font-bold text-gray-500 mb-1">Tipo</label><select className="border p-2 rounded bg-slate-50" value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}><option>Todos</option><option>ENTRADA</option><option>SAIDA</option></select></div>
                <div className="flex flex-col"><label className="text-xs font-bold text-gray-500 mb-1">Produto</label><select className="border p-2 rounded bg-slate-50" value={filtroProduto} onChange={e=>setFiltroProduto(e.target.value)}><option>Todos</option><option>Milho</option><option>Soja</option><option>Sorgo</option></select></div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                  <input type="text" placeholder="Pesquisar por Ticket, Cliente, Motorista, Placa ou NF..." className="w-full border p-2 pl-10 rounded-lg bg-slate-50" value={buscaTexto} onChange={e=>setBuscaTexto(e.target.value)} />
                </div>
                <select className="border p-2 rounded-lg bg-slate-50 font-medium w-48" value={ordenacao} onChange={e=>setOrdenacao(e.target.value)}>
                  <option>Mais recente</option><option>Mais antigo</option><option>Maior peso</option><option>Menor peso</option><option>Cliente A-Z</option><option>Cliente Z-A</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-bold text-slate-600">Ticket</th><th className="p-4 font-bold text-slate-600">Data/Hora</th>
                      <th className="p-4 font-bold text-slate-600">Cliente</th><th className="p-4 font-bold text-slate-600">Produto</th>
                      <th className="p-4 font-bold text-slate-600">Safra</th><th className="p-4 font-bold text-slate-600 text-center">Tipo</th>
                      <th className="p-4 font-bold text-slate-600 text-right">Peso Líquido</th><th className="p-4 font-bold text-slate-600 text-center">Status</th>
                      <th className="p-4 font-bold text-slate-600 text-center print:hidden">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensPaginados.map(p => (
                      <tr key={p.id_banco || p.id} className="border-b hover:bg-slate-50 cursor-pointer transition" onClick={() => setPesagemModal(p)}>
                        <td className="p-4 font-bold text-blue-700">{p.id}</td>
                        <td className="p-4 text-gray-600">{p.data} <span className="text-xs text-gray-400">{p.hora}</span></td>
                        <td className="p-4 font-medium text-gray-800">{p.fornecedor}</td>
                        <td className="p-4 text-gray-600">{p.produto}</td>
                        <td className="p-4 text-gray-600">{p.safra}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.tipo}</span>
                        </td>
                        <td className={`p-4 font-bold text-right ${p.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                          {p.tipo === 'ENTRADA' ? '+' : '-'}{formatarPeso(p.pesoLiquido)} kg
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Finalizado' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                        </td>
                        <td className="p-4 flex gap-2 justify-center print:hidden" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => imprimirTicket(p)} className="p-2 text-gray-500 hover:bg-gray-200 rounded"><Printer size={16}/></button>
                          <button onClick={() => iniciarEdicao(p)} className="p-2 text-blue-500 hover:bg-blue-100 rounded"><Edit size={16}/></button>
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            if(window.confirm('Excluir ticket definitivamente da nuvem?')) {
                              await supabase.from('pesagens').delete().eq('id', p.id_banco); 
                              carregarTudo();
                            }
                          }} className="p-2 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {itensPaginados.length === 0 && <tr><td colSpan={9} className="p-12 text-center text-gray-400"><Filter size={48} className="mx-auto mb-4 opacity-50"/>Nenhuma pesagem encontrada para os filtros atuais.</td></tr>}
                  </tbody>
                </table>
              </div>
              
              {paginasTotais > 1 && (
                <div className="bg-slate-50 p-4 border-t flex items-center justify-between print:hidden">
                  <p className="text-sm text-gray-500">Mostrando {(paginaAtual - 1) * ITENS_POR_PAGINA + 1} a {Math.min(paginaAtual * ITENS_POR_PAGINA, historicoFiltrado.length)} de {historicoFiltrado.length} registros</p>
                  <div className="flex gap-1">
                    <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))} disabled={paginaAtual === 1} className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-slate-100"><ChevronLeft size={18}/></button>
                    {Array.from({length: paginasTotais}, (_, i) => (
                      <button key={i+1} onClick={() => setPaginaAtual(i+1)} className={`px-4 py-2 border rounded font-bold ${paginaAtual === i+1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-slate-100'}`}>{i+1}</button>
                    ))}
                    <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, paginasTotais))} disabled={paginaAtual === paginasTotais} className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-slate-100"><ChevronRight size={18}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'Consulta de Cliente' && (
          <div className="space-y-6 animate-fade-in print:hidden">
            <div className="bg-white p-6 rounded-xl shadow-sm border flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-500 mb-2">Selecione o Cliente</label>
                <select className="border p-3 rounded-lg w-full bg-slate-50 font-medium" value={consultaCliente} onChange={e=>setConsultaCliente(e.target.value)}>
                  <option value="">-- Buscar Cliente --</option>
                  {listaClientes.map(c=><option key={c.id || c.nome} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-bold text-gray-500 mb-2">Filtrar Safra</label>
                <select className="border p-3 rounded-lg w-full bg-slate-50 font-medium" value={consultaSafra} onChange={e=>setConsultaSafra(e.target.value)}>
                  <option value="">Todas as Safras</option>
                  {listaSafras.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {dadosConsulta && consultaCliente && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md"><p className="text-blue-100 text-sm font-bold mb-1">Saldo Atual</p><p className="text-3xl font-bold">{formatarPeso(dadosConsulta.saldo)} <span className="text-sm font-normal">kg</span></p></div>
                  <div className="bg-green-600 text-white p-6 rounded-xl shadow-md"><p className="text-green-100 text-sm font-bold mb-1">Equivalente a</p><p className="text-3xl font-bold">{formatarPeso(dadosConsulta.sacas)} <span className="text-sm font-normal">scs</span></p></div>
                  <div className="bg-white border p-6 rounded-xl shadow-sm"><p className="text-gray-400 text-sm font-bold mb-1">Total Entradas (kg)</p><p className="text-2xl font-bold text-gray-800">{formatarPeso(dadosConsulta.entradas)}</p></div>
                  <div className="bg-white border p-6 rounded-xl shadow-sm"><p className="text-gray-400 text-sm font-bold mb-1">Total Saídas (kg)</p><p className="text-2xl font-bold text-gray-800">{formatarPeso(dadosConsulta.saidas)}</p></div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="text-blue-600"/> Extrato Rápido</h3>
                    <p className="text-sm text-gray-500">Última movimentação: <strong className="text-gray-800">{dadosConsulta.ultMov || 'Nenhuma'}</strong></p>
                  </div>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-3">Data</th><th className="p-3">Registro</th><th className="p-3">Operação</th><th className="p-3">Produto</th><th className="p-3 text-right">Peso</th></tr></thead>
                    <tbody>
                      {dadosConsulta.extrato.map((m:any, i:number) => (
                        <tr key={i} className="border-b"><td className="p-3">{m.data}</td><td className="p-3 font-mono">{m.id}</td><td className="p-3 font-medium">{m.op}</td><td className="p-3">{m.produto}</td><td className={`p-3 text-right font-bold ${m.peso >= 0 ? 'text-green-600' : 'text-red-600'}`}>{m.peso >= 0 ? '+' : ''}{formatarPeso(m.peso)} kg</td></tr>
                      ))}
                      {dadosConsulta.extrato.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhum registro encontrado.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!consultaCliente && (
              <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center">
                <UserSearch size={48} className="text-gray-300 mb-4"/>
                <p className="text-gray-500 font-medium">Selecione um cliente acima para visualizar o balanço completo.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {pesagemModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 print:hidden" onClick={() => setPesagemModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">Ticket: {pesagemModal.id}</h2>
                <p className="text-slate-300 text-sm mt-1">{pesagemModal.data} às {pesagemModal.hora}</p>
              </div>
              <button onClick={() => setPesagemModal(null)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition"><X size={20}/></button>
            </div>
            
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="col-span-2"><p className="text-sm font-bold text-gray-400">Cliente / Fornecedor</p><p className="font-bold text-lg text-gray-800">{pesagemModal.fornecedor}</p></div>
              <div><p className="text-sm font-bold text-gray-400">Safra</p><p className="font-bold text-lg text-gray-800">{pesagemModal.safra}</p></div>
              <div><p className="text-sm font-bold text-gray-400">Produto</p><p className="font-bold text-lg text-gray-800">{pesagemModal.produto}</p></div>
              
              <div><p className="text-sm font-bold text-gray-400">Motorista</p><p className="font-medium text-gray-800">{pesagemModal.motorista || '-'}</p></div>
              <div><p className="text-sm font-bold text-gray-400">Placa</p><p className="font-medium text-gray-800">{pesagemModal.placa || '-'}</p></div>
              <div><p className="text-sm font-bold text-gray-400">Nota Fiscal</p><p className="font-medium text-gray-800">{pesagemModal.notaFiscal || '-'}</p></div>
              <div><p className="text-sm font-bold text-gray-400">Romaneio</p><p className="font-medium text-gray-800">{pesagemModal.romaneio || '-'}</p></div>

              <div className="col-span-full border-t pt-4 grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border text-center"><p className="text-xs font-bold text-gray-500 uppercase">Peso Entrada</p><p className="text-xl font-bold text-gray-800">{formatarPeso(pesagemModal.pesoEntrada)} kg</p></div>
                <div className="bg-slate-50 p-4 rounded-lg border text-center"><p className="text-xs font-bold text-gray-500 uppercase">Peso Saída (Tara)</p><p className="text-xl font-bold text-gray-800">{formatarPeso(pesagemModal.pesoSaida)} kg</p></div>
                <div className={`p-4 rounded-lg border text-center text-white ${pesagemModal.tipo === 'ENTRADA' ? 'bg-green-600 border-green-700' : 'bg-orange-600 border-orange-700'}`}><p className="text-xs font-bold uppercase opacity-90">Peso Líquido ({pesagemModal.tipo})</p><p className="text-2xl font-bold">{formatarPeso(pesagemModal.pesoLiquido)} kg</p></div>
              </div>

              <div className="col-span-full grid grid-cols-3 gap-4 border-t pt-4">
                <div><p className="text-sm font-bold text-gray-400">Umidade</p><p className="font-medium text-gray-800">{pesagemModal.umidade || '0'} %</p></div>
                <div><p className="text-sm font-bold text-gray-400">Impureza</p><p className="font-medium text-gray-800">{pesagemModal.impureza || '0'} %</p></div>
                <div><p className="text-sm font-bold text-gray-400">Avarias</p><p className="font-medium text-gray-800">{pesagemModal.avarias || '0'} %</p></div>
              </div>

              {pesagemModal.observacao && (
                <div className="col-span-full border-t pt-4">
                  <p className="text-sm font-bold text-gray-400">Observações</p>
                  <p className="font-medium text-gray-800 bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-1">{pesagemModal.observacao}</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-6 flex justify-end gap-4 border-t">
              <button onClick={() => setPesagemModal(null)} className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Fechar</button>
              <button onClick={() => imprimirTicket(pesagemModal)} className="px-6 py-2 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-700 flex items-center gap-2"><Printer size={18}/> Imprimir Ticket</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}