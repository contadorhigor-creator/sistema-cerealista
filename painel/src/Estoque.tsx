import { supabase } from './supabaseClient';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRightLeft, Printer, Package, Scale, Users, 
  AlertTriangle, Database, FileSpreadsheet, Settings, 
  Search, PackageSearch, Save, Edit, Trash2, Eye, X, 
  ChevronLeft, ChevronRight, Filter, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Estoque() {
  const [abaAtiva, setAbaAtiva] = useState('Silo');
  
  // --- DADOS ---
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [listaSafras, setListaSafras] = useState<string[]>([]);
  const [pesagens, setPesagens] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [capacidadeSilo, setCapacidadeSilo] = useState(1500000); 
  const [editandoCapacidade, setEditandoCapacidade] = useState(false);

  // --- ESTADOS: FILTROS E BUSCAS SILO/EXTRATO ---
  const [buscaSilo, setBuscaSilo] = useState('');
  const [ordenacao, setOrdenacao] = useState('Maior saldo');
  const [extCliente, setExtCliente] = useState('');
  const [extSafra, setExtSafra] = useState('');
  const [extProduto, setExtProduto] = useState('Milho');

  // --- ESTADOS: TRANSFERÊNCIAS (GERENCIAMENTO) ---
  const [editandoTrans, setEditandoTrans] = useState<any>(null);
  const [transModal, setTransModal] = useState<any>(null); // Visualizar
  const [trans, setTrans] = useState({ 
    de: '', para: '', produto: 'Milho', qtd: 0, safra: '', observacao: '', responsavel: '' 
  });
  
  // Filtros Transferências
  const [filtroRapidoTrans, setFiltroRapidoTrans] = useState('Todos');
  const [dataInicioTrans, setDataInicioTrans] = useState('');
  const [dataFimTrans, setDataFimTrans] = useState('');
  const [buscaTextoTrans, setBuscaTextoTrans] = useState('');
  const [ordenacaoTrans, setOrdenacaoTrans] = useState('Mais recente');
  const [paginaTrans, setPaginaTrans] = useState(1);
  const ITENS_POR_PAGINA = 20;

  useEffect(() => { carregarDados(); }, []);

  // 🚀 FUNÇÃO ATUALIZADA PARA BUSCAR TUDO DA NUVEM (INCLUSIVE TRANSFERÊNCIAS)
  const carregarDados = async () => {
    // 1. Busca Clientes da Nuvem
    const { data: clientesData } = await supabase.from('pessoas').select('*');
    if (clientesData) setListaClientes(clientesData);

    // 2. Busca Safras da Nuvem 
    const { data: safrasData } = await supabase.from('safras').select('*');
    if (safrasData && safrasData.length > 0) {
      setListaSafras(safrasData.map((s: any) => s.nome));
    } else {
      setListaSafras(['2025/2026']);
    }

    // 3. Busca Pesagens da Nuvem
    const { data: pesagensData } = await supabase.from('pesagens').select('*');
    if (pesagensData) setPesagens(pesagensData);

    // 4. Busca Transferências da Nuvem
    const { data: transfData } = await supabase.from('transferencias').select('*').order('id', { ascending: false });
    if (transfData) setTransferencias(transfData);

    // Capacidade mantida localmente pois é configuração do PC/Silo
    const cap = localStorage.getItem('capacidadeSilo');
    if(cap) setCapacidadeSilo(Number(cap));
  };

  const salvarCapacidade = (val: number) => {
    setCapacidadeSilo(val);
    localStorage.setItem('capacidadeSilo', String(val));
    setEditandoCapacidade(false);
  };

  // --- TRAVA DE SEGURANÇA COM SENHA ---
  const verificarSenhaAdmin = () => {
    const senha = window.prompt("⚠️ AÇÃO RESTRITA\n\nDigite a senha de administrador para excluir:");
    if (senha === 'n1th1l31') return true;
    if (senha !== null) alert("❌ Senha incorreta! A exclusão foi cancelada.");
    return false;
  };

  // --- FUNÇÕES UTILITÁRIAS ---
  const formatarPeso = (valor: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0);
  const kgParaSacas = (valor: number) => (valor || 0) / 60;
  const safeDateISO = (data: any) => {
    if (typeof data === 'string' && data.includes('/')) {
       const partes = data.split('/');
       if(partes.length === 3) return `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  // ============================================================================
  // MOTOR CENTRAL: MOVIMENTAÇÕES UNIFICADAS
  // ============================================================================
  const movimentacoes = useMemo(() => {
    let movs: any[] = [];

    pesagens.forEach(p => {
      if (p.status !== 'Finalizado') return;
      const dataStr = p.data ? p.data.split('/').reverse().join('-') : '2020-01-01';
      const hora = p.hora || '00:00:00';
      movs.push({
        idOriginal: p.id, timestamp: `${dataStr}T${hora}`, data: p.data || '-', hora,
        cliente: p.fornecedor || 'Desconhecido', produto: p.produto || 'Milho', safra: p.safra || 'S/N',
        tipo: p.tipo || 'ENTRADA',
        entrada: p.tipo === 'ENTRADA' ? Number(p.pesoLiquido || p.liquido || 0) : 0,
        saida: p.tipo === 'SAIDA' ? Math.abs(Number(p.pesoLiquido || 0)) : 0,
        saldoOperacao: Number(p.saldo || p.liquido || 0), 
        observacao: p.observacao || `Ticket ${p.id}`
      });
    });

    transferencias.forEach(t => {
      const dataStr = t.data ? t.data.split('/').reverse().join('-') : '2020-01-01';
      const hora = t.hora || '00:00:00';
      const qtd = Number(t.qtd || 0);
      
      movs.push({
        idOriginal: `TR-${t.id}-S`, timestamp: `${dataStr}T${hora}`, data: t.data || '-', hora,
        cliente: t.de, produto: t.produto || 'Milho', safra: t.safra,
        tipo: `TRANSF. SAÍDA`, entrada: 0, saida: qtd, saldoOperacao: -qtd,
        observacao: `Para: ${t.para} | Resp: ${t.responsavel || '-'} | Obs: ${t.observacao || ''}`
      });

      movs.push({
        idOriginal: `TR-${t.id}-E`, timestamp: `${dataStr}T${hora}`, data: t.data || '-', hora,
        cliente: t.para, produto: t.produto || 'Milho', safra: t.safra,
        tipo: `TRANSF. ENTRADA`, entrada: qtd, saida: 0, saldoOperacao: qtd,
        observacao: `De: ${t.de} | Resp: ${t.responsavel || '-'} | Obs: ${t.observacao || ''}`
      });
    });

    return movs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [pesagens, transferencias]);

  // ============================================================================
  // CÁLCULO DE SALDOS (Usado pelo Silo e pelas Transferências)
  // ============================================================================
  const saldosProcessados = useMemo(() => {
    const mapa: any = {};
    movimentacoes.forEach(m => {
      const chave = `${m.cliente}|${m.produto}|${m.safra}`;
      if (!mapa[chave]) {
        mapa[chave] = { cliente: m.cliente, produto: m.produto, safra: m.safra, saldoKg: 0, ultimaMov: '' };
      }
      mapa[chave].saldoKg += m.saldoOperacao;
      if (m.timestamp > mapa[chave].ultimaMov) mapa[chave].ultimaMov = `${m.data} ${m.hora}`;
    });

    let lista = Object.values(mapa);
    
    // 🚀 FILTRO ADICIONADO AQUI: Remove clientes com saldo zero (usa limite de 0.01 para evitar dízimas de computador)
    lista = lista.filter((s:any) => Math.abs(s.saldoKg) >= 0.01);

    if(buscaSilo) {
      const b = buscaSilo.toLowerCase();
      lista = lista.filter((s:any) => s.cliente.toLowerCase().includes(b) || s.produto.toLowerCase().includes(b) || s.safra.toLowerCase().includes(b));
    }
    lista.sort((a:any, b:any) => {
      if (ordenacao === 'Maior saldo') return b.saldoKg - a.saldoKg;
      if (ordenacao === 'Menor saldo') return a.saldoKg - b.saldoKg;
      if (ordenacao === 'Cliente') return a.cliente.localeCompare(b.cliente);
      if (ordenacao === 'Produto') return a.produto.localeCompare(b.produto);
      if (ordenacao === 'Safra') return a.safra.localeCompare(b.safra);
      return 0;
    });

    return lista;
  }, [movimentacoes, buscaSilo, ordenacao]);

  const stats = useMemo(() => {
    let entradasHoje = 0, saidasHoje = 0, transfHoje = 0;
    const hoje = new Date().toLocaleDateString('pt-BR');

    movimentacoes.forEach(m => {
      if (m.data === hoje) {
        if (m.tipo === 'ENTRADA') entradasHoje += m.entrada;
        if (m.tipo === 'SAIDA') saidasHoje += m.saida;
        if (m.tipo === 'TRANSF. SAÍDA') transfHoje += m.saida;
      }
    });

    const totalKGArmazenado = saldosProcessados.reduce((acc, curr:any) => acc + curr.saldoKg, 0);
    return { entradasHoje, saidasHoje, transfHoje, totalKGArmazenado };
  }, [movimentacoes, saldosProcessados]);

  const percOcupacao = Math.min((stats.totalKGArmazenado / capacidadeSilo) * 100, 100) || 0;

  // ============================================================================
  // EXTRATO DETALHADO
  // ============================================================================
  const extratoDetalhado = useMemo(() => {
    if (!extCliente || !extSafra || !extProduto) return [];
    const movsCliente = movimentacoes.filter(m => m.cliente === extCliente && m.safra === extSafra && m.produto === extProduto);
    let saldoMovel = 0;
    const extratoComSaldo = movsCliente.map(m => {
      saldoMovel += m.saldoOperacao;
      return { ...m, saldoMomento: saldoMovel };
    });
    return extratoComSaldo.reverse();
  }, [movimentacoes, extCliente, extSafra, extProduto]);


  // ============================================================================
  // MÓDULO DE TRANSFERÊNCIAS (BANCÁRIO) NA NUVEM
  // ============================================================================
  
  // 1. Simulação em Tempo Real (O "Preview Bancário")
  const prevTransf = useMemo(() => {
    let orig = 0, dest = 0;
    
    if (trans.produto && trans.safra) {
      const sOrig = saldosProcessados.find((s:any) => s.cliente === trans.de && s.produto === trans.produto && s.safra === trans.safra);
      const sDest = saldosProcessados.find((s:any) => s.cliente === trans.para && s.produto === trans.produto && s.safra === trans.safra);
      if (sOrig) orig = sOrig.saldoKg;
      if (sDest) dest = sDest.saldoKg;
    }

    if (editandoTrans) {
      orig += Number(editandoTrans.qtd);
      dest -= Number(editandoTrans.qtd);
    }

    const projetadoOrigem = orig - Number(trans.qtd || 0);
    const projetadoDestino = dest + Number(trans.qtd || 0);

    return { orig, dest, projetadoOrigem, projetadoDestino };
  }, [trans, saldosProcessados, editandoTrans]);

  // 2. Filtros e Motor da Tabela de Transferências
  const transfFiltradas = useMemo(() => {
    let filtrado = [...transferencias];
    const hojeIso = new Date().toISOString().split('T')[0];
    const hojeObj = new Date();

    // Filtros Rápidos
    filtrado = filtrado.filter(t => {
      const dIso = safeDateISO(t.data);
      const dObj = new Date(dIso + 'T12:00:00');
      if (filtroRapidoTrans === 'Hoje') return dIso === hojeIso;
      if (filtroRapidoTrans === 'Ontem') {
        const ontem = new Date(hojeObj); ontem.setDate(ontem.getDate() - 1);
        return dIso === ontem.toISOString().split('T')[0];
      }
      if (filtroRapidoTrans === 'Últimos 7 dias') {
        const sete = new Date(hojeObj); sete.setDate(sete.getDate() - 7);
        return dObj >= sete;
      }
      if (filtroRapidoTrans === 'Este mês') return dObj.getMonth() === hojeObj.getMonth() && dObj.getFullYear() === hojeObj.getFullYear();
      if (dataInicioTrans && dataFimTrans) return dIso >= dataInicioTrans && dIso <= dataFimTrans;
      return true;
    });

    // Pesquisa
    if (buscaTextoTrans) {
      const b = buscaTextoTrans.toLowerCase();
      filtrado = filtrado.filter(t => 
        (t.de && t.de.toLowerCase().includes(b)) || 
        (t.para && t.para.toLowerCase().includes(b)) || 
        (t.produto && t.produto.toLowerCase().includes(b)) ||
        (t.safra && t.safra.toLowerCase().includes(b)) ||
        (t.responsavel && t.responsavel.toLowerCase().includes(b))
      );
    }

    // Ordenação
    filtrado.sort((a, b) => {
      if (ordenacaoTrans === 'Mais recente') return b.id - a.id;
      if (ordenacaoTrans === 'Mais antigo') return a.id - b.id;
      if (ordenacaoTrans === 'Maior quantidade') return b.qtd - a.qtd;
      if (ordenacaoTrans === 'Menor quantidade') return a.qtd - b.qtd;
      if (ordenacaoTrans === 'Origem A-Z') return a.de.localeCompare(b.de);
      if (ordenacaoTrans === 'Destino A-Z') return a.para.localeCompare(b.para);
      return 0;
    });

    return filtrado;
  }, [transferencias, filtroRapidoTrans, dataInicioTrans, dataFimTrans, buscaTextoTrans, ordenacaoTrans]);

  // Paginação e Estatísticas Transf.
  const paginasTransTotais = Math.ceil(transfFiltradas.length / ITENS_POR_PAGINA);
  const transfPaginadas = transfFiltradas.slice((paginaTrans - 1) * ITENS_POR_PAGINA, paginaTrans * ITENS_POR_PAGINA);
  
  const statsTransf = useMemo(() => {
    let hojeQtd = 0, mesQtd = 0, hojeCount = 0, mesCount = 0;
    const hj = new Date().toLocaleDateString('pt-BR');
    const mesAtual = new Date().getMonth();
    
    transferencias.forEach(t => {
      if (t.data === hj) { hojeQtd += Number(t.qtd); hojeCount++; }
      const dObj = new Date(safeDateISO(t.data) + 'T12:00:00');
      if (dObj.getMonth() === mesAtual) { mesQtd += Number(t.qtd); mesCount++; }
    });
    return { hojeQtd, mesQtd, hojeCount, mesCount };
  }, [transferencias]);

  // 🚀 3. AÇÕES NA NUVEM (INCLUIR/ALTERAR/EXCLUIR)
  const handleSalvarTransferencia = async () => {
    if (!trans.de || !trans.para || trans.qtd <= 0 || !trans.safra || !trans.produto) {
      return alert('Preencha os campos obrigatórios (Origem, Destino, Produto, Safra e Qtd > 0).');
    }
    if (trans.de === trans.para) return alert('A origem e o destino não podem ser iguais!');

    if (prevTransf.projetadoOrigem < 0) {
      const conf = window.confirm(`⚠️ ATENÇÃO: O saldo de ${trans.de} ficará negativo (${formatarPeso(prevTransf.projetadoOrigem)} kg).\nDeseja confirmar a transferência mesmo assim?`);
      if (!conf) return;
    }

    const agoraData = new Date().toLocaleDateString('pt-BR');
    const agoraHora = new Date().toLocaleTimeString('pt-BR').substring(0,5);

    let historico_edicoes = editandoTrans && editandoTrans.historico_edicoes ? [...editandoTrans.historico_edicoes] : [];
    if (editandoTrans) {
      historico_edicoes.push(`Alterado em ${agoraData} às ${agoraHora} por ${trans.responsavel || 'Usuário'}`);
    } else {
      historico_edicoes.push(`Criado em ${agoraData} às ${agoraHora} por ${trans.responsavel || 'Usuário'}`);
    }

    const novaTrans = {
      de: trans.de, 
      para: trans.para, 
      produto: trans.produto, 
      qtd: trans.qtd, 
      safra: trans.safra, 
      observacao: trans.observacao, 
      responsavel: trans.responsavel,
      data: editandoTrans ? editandoTrans.data : agoraData,
      hora: editandoTrans ? editandoTrans.hora : agoraHora,
      editado_em: editandoTrans ? `${agoraData} ${agoraHora}` : null,
      historico_edicoes
    };

    if (editandoTrans) {
      const { error } = await supabase.from('transferencias').update(novaTrans).eq('id', editandoTrans.id);
      if (error) return alert(`Erro ao atualizar: ${error.message}`);
      alert('Transferência atualizada com sucesso!');
    } else {
      const { error } = await supabase.from('transferencias').insert([novaTrans]);
      if (error) return alert(`Erro ao salvar: ${error.message}`);
      alert('Transferência realizada com sucesso!');
    }

    limparFormularioTransf();
    await carregarDados(); // Recarrega da nuvem
  };

  const iniciarEdicaoTransf = (t: any) => {
    setEditandoTrans(t);
    setTrans({ de: t.de, para: t.para, produto: t.produto, qtd: t.qtd, safra: t.safra, observacao: t.observacao || '', responsavel: t.responsavel || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const excluirTransferencia = async (id: number) => {
    if (!verificarSenhaAdmin()) return;

    const conf = window.confirm('Excluir permanentemente esta transferência da nuvem?\nIsso reverterá os saldos dos clientes afetados imediatamente.');
    if (!conf) return;

    const { error } = await supabase.from('transferencias').delete().eq('id', id);
    if (error) return alert(`Erro ao excluir: ${error.message}`);
    
    await carregarDados(); // Recarrega da nuvem atualizando os saldos
  };

  const limparFormularioTransf = () => {
    setEditandoTrans(null);
    setTrans({ de: '', para: '', produto: 'Milho', qtd: 0, safra: '', observacao: '', responsavel: '' });
  };

  const exportarExcelSilo = () => {
    let csv = "Cliente;Produto;Safra;Saldo (KG);Saldo (Sacas);Ultima Movimentacao\n";
    saldosProcessados.forEach((s:any) => { csv += `${s.cliente};${s.produto};${s.safra};${s.saldoKg};${kgParaSacas(s.saldoKg).toFixed(2)};${s.ultimaMov}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.setAttribute('download', 'estoque_silo.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportarExcelTransferencias = () => {
    let csv = "ID;Data;Hora;Origem;Destino;Produto;Safra;Qtd(KG);Responsavel;Status Edicao\n";
    transfFiltradas.forEach(t => { csv += `${t.id};${t.data};${t.hora};${t.de};${t.para};${t.produto};${t.safra};${t.qtd};${t.responsavel};${t.editado_em ? 'Editado' : 'Original'}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.setAttribute('download', 'historico_transferencias.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6 print:w-full print:max-w-none">
        
        <div className="flex justify-between items-center print:hidden">
          <Link to="/" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition">
            <ArrowLeft size={20} /> Voltar ao Painel
          </Link>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex gap-4 border-b border-gray-200 print:hidden">
          {['Silo', 'Extrato Detalhado', 'Transferências'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} className={`pb-3 font-bold text-lg transition-colors border-b-2 px-4 ${abaAtiva === aba ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-500'}`}>
              {aba}
            </button>
          ))}
        </div>

        {/* =========================================
            ABA 1: SILO (DASHBOARD GERAL)
        ============================================= */}
        {abaAtiva === 'Silo' && (
          <div className="space-y-6 animate-fade-in">
            {/* Capacidade */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:hidden">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Database className="text-blue-600"/> Capacidade Total do Silo</h3>
                  {editandoCapacidade ? (
                     <div className="flex gap-2 mt-2">
                       <input type="number" className="border p-1 rounded" defaultValue={capacidadeSilo} id="capInput" />
                       <button onClick={() => salvarCapacidade(Number((document.getElementById('capInput') as HTMLInputElement).value))} className="bg-green-600 text-white px-2 rounded text-xs font-bold">Salvar</button>
                     </div>
                  ) : (
                    <p className="text-sm text-gray-500 flex items-center gap-2">Máximo: {formatarPeso(capacidadeSilo)} kg <button onClick={()=>setEditandoCapacidade(true)} className="text-blue-500 hover:text-blue-700"><Settings size={14}/></button></p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700">{formatarPeso(stats.totalKGArmazenado)} <span className="text-sm font-normal text-gray-500">kg ocupados</span></p>
                  <p className="text-sm font-bold text-gray-500">{percOcupacao.toFixed(1)}% da capacidade</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className={`h-4 rounded-full transition-all duration-1000 ${percOcupacao > 90 ? 'bg-red-500' : percOcupacao > 70 ? 'bg-yellow-500' : 'bg-blue-600'}`} style={{ width: `${percOcupacao}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><PackageSearch className="text-blue-600"/> Posição de Estoque</h3>
                <div className="flex gap-2 w-full md:w-auto">
                  <input className="border p-2 rounded-lg bg-slate-50 flex-1 md:w-64" placeholder="Buscar cliente, produto..." value={buscaSilo} onChange={e => setBuscaSilo(e.target.value)} />
                  <select className="border p-2 rounded-lg bg-slate-50 font-medium" value={ordenacao} onChange={e => setOrdenacao(e.target.value)}>
                    <option>Maior saldo</option><option>Menor saldo</option><option>Cliente</option><option>Produto</option><option>Safra</option>
                  </select>
                  <button onClick={exportarExcelSilo} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition" title="Exportar Excel"><FileSpreadsheet size={20}/></button>
                  <button onClick={() => window.print()} className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition" title="Imprimir"><Printer size={20}/></button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr><th className="p-4 font-bold text-slate-600">Cliente</th><th className="p-4 font-bold text-slate-600">Produto</th><th className="p-4 font-bold text-slate-600">Safra</th><th className="p-4 font-bold text-slate-600 text-right">Saldo (KG)</th><th className="p-4 font-bold text-slate-600 text-right">Saldo (Sacas)</th><th className="p-4 font-bold text-slate-600 text-center">Última Mov.</th></tr>
                  </thead>
                  <tbody>
                    {saldosProcessados.map((s:any, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-gray-800">{s.cliente}</td>
                        <td className="p-4 text-gray-600">{s.produto}</td>
                        <td className="p-4 text-gray-600">{s.safra}</td>
                        <td className="p-4 text-right">
                          <span className={`px-3 py-1 rounded font-bold flex items-center justify-end gap-1 ${s.saldoKg >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                            {s.saldoKg < 0 && <AlertTriangle size={14} className="shrink-0"/>}
                            {formatarPeso(s.saldoKg)}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium text-gray-600">{formatarPeso(kgParaSacas(s.saldoKg))}</td>
                        <td className="p-4 text-center text-gray-500 text-xs">{s.ultimaMov || '-'}</td>
                      </tr>
                    ))}
                    {saldosProcessados.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum estoque encontrado.</td></tr>}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-200">
                    <tr><td className="p-4 text-gray-800" colSpan={3}>TOTAL DO SILO</td><td className="p-4 text-right text-blue-700 text-lg">{formatarPeso(stats.totalKGArmazenado)} kg</td><td className="p-4 text-right text-blue-700 text-lg">{formatarPeso(kgParaSacas(stats.totalKGArmazenado))} scs</td><td></td></tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            ABA 2: EXTRATO DETALHADO
        ============================================= */}
        {abaAtiva === 'Extrato Detalhado' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
              <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cliente</label><select className="border p-3 rounded-lg w-full bg-slate-50" value={extCliente} onChange={e => setExtCliente(e.target.value)}><option value="">Selecione...</option>{listaClientes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Produto</label><select className="border p-3 rounded-lg w-full bg-slate-50" value={extProduto} onChange={e => setExtProduto(e.target.value)}><option>Milho</option><option>Soja</option><option>Sorgo</option></select></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Safra</label><select className="border p-3 rounded-lg w-full bg-slate-50" value={extSafra} onChange={e => setExtSafra(e.target.value)}><option value="">Selecione...</option>{listaSafras.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>

            {extCliente && extSafra && extProduto && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div><h3 className="font-bold text-2xl text-gray-800">Extrato de Movimentação</h3><p className="text-gray-500">{extCliente} | {extProduto} | Safra {extSafra}</p></div>
                  <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-bold transition print:hidden"><Printer size={18}/> Imprimir Extrato</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr><th className="p-3 font-bold text-slate-600">Data/Hora</th><th className="p-3 font-bold text-slate-600">Operação</th><th className="p-3 font-bold text-slate-600">Documento / Obs</th><th className="p-3 font-bold text-slate-600 text-right">Entrada</th><th className="p-3 font-bold text-slate-600 text-right">Saída</th><th className="p-3 font-bold text-slate-600 text-right bg-blue-50">Saldo</th></tr>
                    </thead>
                    <tbody>
                      {extratoDetalhado.map((m, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="p-3 text-gray-600">{m.data} <span className="text-xs text-gray-400 block">{m.hora}</span></td>
                          <td className="p-3 font-bold text-gray-800">{m.tipo}</td>
                          <td className="p-3 text-gray-500 text-xs truncate max-w-[200px]">{m.observacao}</td>
                          <td className="p-3 text-right text-green-600 font-bold">{m.entrada > 0 ? `+ ${formatarPeso(m.entrada)}` : '-'}</td>
                          <td className="p-3 text-right text-red-600 font-bold">{m.saida > 0 ? `- ${formatarPeso(m.saida)}` : '-'}</td>
                          <td className={`p-3 text-right font-bold bg-blue-50/30 ${m.saldoMomento >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{formatarPeso(m.saldoMomento)} kg</td>
                        </tr>
                      ))}
                      {extratoDetalhado.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma movimentação para este filtro.</td></tr>}
                    </tbody>
                    {extratoDetalhado.length > 0 && (
                      <tfoot className="bg-slate-800 text-white font-bold">
                        <tr><td className="p-4" colSpan={3}>SALDO FINAL ATUAL</td><td className="p-4 text-right text-green-400" colSpan={2}>Equivalente: {formatarPeso(kgParaSacas(extratoDetalhado[0].saldoMomento))} sacas</td><td className={`p-4 text-right text-xl ${extratoDetalhado[0].saldoMomento >= 0 ? 'text-white' : 'text-red-400'}`}>{formatarPeso(extratoDetalhado[0].saldoMomento)} kg</td></tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            ABA 3: GERENCIAMENTO DE TRANSFERÊNCIAS
        ============================================= */}
        {abaAtiva === 'Transferências' && (
          <div className="space-y-6 animate-fade-in print:hidden">
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-purple-500"><p className="text-xs font-bold text-gray-400 uppercase">Transferências Hoje</p><p className="font-bold text-xl">{statsTransf.hojeCount}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-purple-400"><p className="text-xs font-bold text-gray-400 uppercase">KG Transf. Hoje</p><p className="font-bold text-xl text-purple-600">{formatarPeso(statsTransf.hojeQtd)}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Transferências Mês</p><p className="font-bold text-xl">{statsTransf.mesCount}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-400"><p className="text-xs font-bold text-gray-400 uppercase">KG Transf. Mês</p><p className="font-bold text-xl text-blue-600">{formatarPeso(statsTransf.mesQtd)}</p></div>
            </div>

            {/* FORMULÁRIO BANCÁRIO DE TRANSFERÊNCIA */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative">
              {editandoTrans && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                  <Edit size={14}/> Modo Edição (ID: {editandoTrans.id})
                  <button onClick={limparFormularioTransf} className="ml-2 bg-yellow-200 hover:bg-yellow-300 p-1 rounded-full"><X size={12}/></button>
                </div>
              )}
              <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2 border-b pb-4 mb-6"><ArrowRightLeft className="text-purple-600"/> {editandoTrans ? 'Atualizar Transferência' : 'Nova Transferência Interna'}</h3>
              
              {/* Lado Esquerdo - Info Comum */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-dashed pb-6 mb-6">
                <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Produto *</label><select className="border p-3 rounded-lg w-full bg-slate-50" value={trans.produto} onChange={e => setTrans({...trans, produto: e.target.value})}><option>Milho</option><option>Soja</option><option>Sorgo</option></select></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Safra *</label><select className="border p-3 rounded-lg w-full bg-slate-50" value={trans.safra} onChange={e => setTrans({...trans, safra: e.target.value})}><option value="">Selecione...</option>{listaSafras.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Quantidade (KG) *</label><input type="number" className="border-2 border-purple-200 p-3 rounded-lg w-full bg-white text-xl font-bold focus:border-purple-500 outline-none text-purple-700" placeholder="0.00" value={trans.qtd || ''} onChange={e => setTrans({...trans, qtd: Number(e.target.value)})} /></div>
              </div>

              {/* Lado a Lado: Origem vs Destino (Estilo Banco) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 relative">
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 p-3 rounded-full shadow-sm z-10 text-purple-500"><ArrowRightLeft size={24}/></div>
                
                {/* ORIGEM */}
                <div className="bg-red-50/50 p-6 rounded-xl border border-red-100 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-red-800 uppercase text-xs mb-4">(-) Conta Origem</h4>
                    <select className="border p-3 rounded-lg w-full bg-white mb-4 outline-none focus:border-red-400" value={trans.de} onChange={e => setTrans({...trans, de: e.target.value})}>
                      <option value="">Selecione quem transfere...</option>
                      {listaClientes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                  {trans.de && trans.produto && trans.safra && (
                    <div className="bg-white p-4 rounded-lg border border-red-100">
                      <div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-500">Saldo Atual</span> <span className="font-bold">{formatarPeso(prevTransf.orig)} kg</span></div>
                      <div className="flex justify-between items-center border-t pt-2 mt-2"><span className="text-xs font-bold text-red-600">Saldo Projetado</span> <span className={`font-bold ${prevTransf.projetadoOrigem < 0 ? 'text-red-600' : 'text-gray-800'}`}>{formatarPeso(prevTransf.projetadoOrigem)} kg</span></div>
                    </div>
                  )}
                </div>

                {/* DESTINO */}
                <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-green-800 uppercase text-xs mb-4">(+) Conta Destino</h4>
                    <select className="border p-3 rounded-lg w-full bg-white mb-4 outline-none focus:border-green-400" value={trans.para} onChange={e => setTrans({...trans, para: e.target.value})}>
                      <option value="">Selecione quem recebe...</option>
                      {listaClientes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                  {trans.para && trans.produto && trans.safra && (
                    <div className="bg-white p-4 rounded-lg border border-green-100">
                      <div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-500">Saldo Atual</span> <span className="font-bold">{formatarPeso(prevTransf.dest)} kg</span></div>
                      <div className="flex justify-between items-center border-t pt-2 mt-2"><span className="text-xs font-bold text-green-600">Saldo Projetado</span> <span className="font-bold text-gray-800">{formatarPeso(prevTransf.projetadoDestino)} kg</span></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Responsável</label><input type="text" className="border p-3 rounded-lg w-full bg-slate-50" placeholder="Seu nome" value={trans.responsavel} onChange={e => setTrans({...trans, responsavel: e.target.value})} /></div>
                 <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Observação</label><input type="text" className="border p-3 rounded-lg w-full bg-slate-50" placeholder="Motivo da transferência" value={trans.observacao} onChange={e => setTrans({...trans, observacao: e.target.value})} /></div>
              </div>

              <button onClick={handleSalvarTransferencia} className="bg-purple-600 hover:bg-purple-700 transition text-white w-full py-4 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2">
                <Save size={20}/> {editandoTrans ? 'Atualizar Transferência na Nuvem' : 'Confirmar Transferência na Nuvem'}
              </button>
            </div>

            {/* TABELA COMPLETA (HISTÓRICO) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><Clock className="text-blue-600"/> Histórico de Transferências</h3>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-lg border">
                <div className="flex flex-wrap gap-2 flex-1">
                  {['Todos', 'Hoje', 'Ontem', 'Últimos 7 dias', 'Este mês'].map(f => (
                    <button key={f} onClick={() => setFiltroRapidoTrans(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${filtroRapidoTrans === f ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>{f}</button>
                  ))}
                  <input type="date" className="border px-2 py-1 rounded text-xs" value={dataInicioTrans} onChange={e=>setDataInicioTrans(e.target.value)} title="Data Inicial" />
                  <input type="date" className="border px-2 py-1 rounded text-xs" value={dataFimTrans} onChange={e=>setDataFimTrans(e.target.value)} title="Data Final" />
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2 text-gray-400" size={16}/>
                    <input type="text" placeholder="Pesquisar..." className="border p-1.5 pl-9 rounded text-sm w-48" value={buscaTextoTrans} onChange={e=>setBuscaTextoTrans(e.target.value)} />
                  </div>
                  <button onClick={exportarExcelTransferencias} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 hover:bg-green-700" title="Exportar Excel"><FileSpreadsheet size={16}/></button>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 border-b">
                    <tr><th className="p-3 font-bold text-slate-600">ID</th><th className="p-3 font-bold text-slate-600">Data/Hora</th><th className="p-3 font-bold text-slate-600">Origem</th><th className="p-3 font-bold text-slate-600">Destino</th><th className="p-3 font-bold text-slate-600">Produto/Safra</th><th className="p-3 font-bold text-slate-600 text-right">Quantidade</th><th className="p-3 font-bold text-slate-600 text-center">Status</th><th className="p-3 font-bold text-slate-600 text-center">Ações</th></tr>
                  </thead>
                  <tbody>
                    {transfPaginadas.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-slate-50 transition">
                        <td className="p-3 font-mono text-xs text-gray-500">{String(t.id).slice(-6)}</td>
                        <td className="p-3 text-gray-600">{t.data} <span className="text-xs text-gray-400">{t.hora}</span></td>
                        <td className="p-3 font-medium text-red-600">{t.de}</td>
                        <td className="p-3 font-medium text-green-600">{t.para}</td>
                        <td className="p-3 text-gray-600">{t.produto} <span className="text-xs text-gray-400">({t.safra})</span></td>
                        <td className="p-3 text-right font-bold text-purple-700">{formatarPeso(t.qtd)} kg</td>
                        <td className="p-3 text-center">{t.editado_em ? <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold" title={t.editado_em}>Editado</span> : <span className="text-[10px] text-gray-400">Original</span>}</td>
                        <td className="p-3 flex gap-2 justify-center">
                          <button onClick={() => setTransModal(t)} className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded transition" title="Visualizar"><Eye size={16}/></button>
                          <button onClick={() => iniciarEdicaoTransf(t)} className="p-1.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded transition" title="Editar"><Edit size={16}/></button>
                          <button onClick={() => excluirTransferencia(t.id)} className="p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 rounded transition" title="Excluir"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {transfPaginadas.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400"><Filter size={32} className="mx-auto mb-2 opacity-50"/>Nenhuma transferência encontrada para os filtros.</td></tr>}
                  </tbody>
                </table>
              </div>

              {paginasTransTotais > 1 && (
                <div className="bg-slate-50 p-4 border-t flex items-center justify-between rounded-b-lg">
                  <p className="text-sm text-gray-500">Página {paginaTrans} de {paginasTransTotais}</p>
                  <div className="flex gap-1">
                    <button onClick={() => setPaginaTrans(p => Math.max(p - 1, 1))} disabled={paginaTrans === 1} className="p-1.5 border rounded bg-white disabled:opacity-50"><ChevronLeft size={18}/></button>
                    <button onClick={() => setPaginaTrans(p => Math.min(p + 1, paginasTransTotais))} disabled={paginaTrans === paginasTransTotais} className="p-1.5 border rounded bg-white disabled:opacity-50"><ChevronRight size={18}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL VISUALIZAR TRANSFERÊNCIA */}
      {transModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 print:hidden" onClick={() => setTransModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <div><h2 className="text-xl font-bold flex items-center gap-2">Transferência: TR-{String(transModal.id).slice(-6)}</h2><p className="text-slate-300 text-sm mt-1">{transModal.data} às {transModal.hora}</p></div>
              <button onClick={() => setTransModal(null)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border">
                <div className="text-center flex-1"><p className="text-xs font-bold text-gray-400 uppercase">Origem</p><p className="font-bold text-lg text-red-700">{transModal.de}</p></div>
                <div className="text-purple-400 px-4"><ArrowRightLeft size={24}/></div>
                <div className="text-center flex-1"><p className="text-xs font-bold text-gray-400 uppercase">Destino</p><p className="font-bold text-lg text-green-700">{transModal.para}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t pt-6">
                <div><p className="text-xs font-bold text-gray-400 uppercase">Produto / Safra</p><p className="font-bold text-gray-800">{transModal.produto} ({transModal.safra})</p></div>
                <div><p className="text-xs font-bold text-gray-400 uppercase">Quantidade</p><p className="font-bold text-xl text-purple-700">{formatarPeso(transModal.qtd)} kg</p></div>
                <div><p className="text-xs font-bold text-gray-400 uppercase">Responsável</p><p className="font-bold text-gray-800">{transModal.responsavel || '-'}</p></div>
              </div>
              {transModal.observacao && <div><p className="text-xs font-bold text-gray-400 uppercase">Observações</p><p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border mt-1">{transModal.observacao}</p></div>}
              
              {/* Auditoria */}
              {transModal.historico_edicoes && transModal.historico_edicoes.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Histórico de Alterações</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {transModal.historico_edicoes.map((ed:string, idx:number) => <li key={idx} className="flex items-center gap-1"><Clock size={12}/> {ed}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-6 flex justify-end border-t"><button onClick={() => setTransModal(null)} className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Fechar</button></div>
          </div>
        </div>
      )}

    </div>
  );
}