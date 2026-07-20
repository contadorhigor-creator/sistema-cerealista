import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Save, Trash2, Edit, Eye, Search, Plus, 
  MapPin, Briefcase, FileText, Phone, CreditCard, 
  Tractor, X, Filter, FileSpreadsheet, Printer, ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient'; // 🚀 IMPORTAÇÃO DO SUPABASE ADICIONADA AQUI

// ============================================================================
// SERVIÇOS DE INTEGRAÇÃO (Simulando a pasta /services)
// Usando APIs públicas reais para CNPJ e CEP
// ============================================================================
const CepService = {
  buscarCEP: async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) throw new Error("CEP inválido");
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await res.json();
    if (data.erro) throw new Error("CEP não encontrado");
    return data;
  }
};

const CnpjService = {
  buscarCNPJ: async (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) throw new Error("CNPJ inválido");
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    if (res.status !== 200) throw new Error("CNPJ não localizado ou API indisponível");
    const data = await res.json();
    return data;
  }
};

export default function CadastroPessoa() {
  const [abaAtiva, setAbaAtiva] = useState('Pessoas');
  
  // --- ESTADOS: DADOS DO SISTEMA ---
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [motoristas, setListaMotoristas] = useState<any[]>([]);
  const [veiculos, setListaVeiculos] = useState<any[]>([]);
  const [safras, setListaSafras] = useState<string[]>([]);
  
  // Para verificação de exclusão
  const [pesagens, setPesagens] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);

  // --- ESTADOS: LISTAGEM DE PESSOAS ---
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState('Nome A-Z');
  const [pessoaModal, setPessoaModal] = useState<any>(null); // Modal de Visualização

  // --- ESTADOS: FORMULÁRIO DE PESSOA ---
  const [modoFormulario, setModoFormulario] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);
  
  const formInicial = {
    id: null, codigo: '', tipoCadastro: 'Cliente', tipoPessoa: 'PF', status: 'Ativo',
    nome: '', nomeFantasia: '', razaoSocial: '', documento: '', inscricaoEstadual: '', inscricaoMunicipal: '',
    produtorRural: 'Não', telefone: '', celular: '', whatsapp: '', email: '', site: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', pais: 'Brasil', ibge: '',
    categoria: 'Cliente Final', vendedor: '', regiao: '', produtosAutorizados: ['Milho'], limiteArmazenagem: 0,
    limiteCredito: 0, banco: '', agencia: '', conta: '', pix: '', observacoes: '', dataCadastro: ''
  };
  const [form, setForm] = useState<any>(formInicial);

  // --- ESTADOS: OUTRAS ABAS ---
  const [auxMot, setAuxMot] = useState({ nome: '', cnh: '' });
  const [auxVei, setAuxVei] = useState({ placa: '', descricao: '' });
  const [auxSafra, setAuxSafra] = useState('');

  useEffect(() => { carregarDados(); }, []);

  // 🚀 FUNÇÃO REESCRITA PARA BUSCAR DA NUVEM (SUPABASE)
  const carregarDados = async () => {
    // Busca as Pessoas do Supabase
    const { data, error } = await supabase.from('pessoas').select('*');
    
    if (error) {
      console.error("Erro ao buscar pessoas do banco:", error);
    } else if (data) {
      setPessoas(data);
    }

    // Por enquanto, mantemos as abas secundárias no local para não quebrar seu sistema 
    // até criarmos as tabelas delas no Supabase futuramente.
    setListaMotoristas(JSON.parse(localStorage.getItem('listaMotoristas') || '[]'));
    setListaVeiculos(JSON.parse(localStorage.getItem('listaVeiculos') || '[]'));
    setListaSafras(JSON.parse(localStorage.getItem('listaSafras') || '["2025/2026"]'));
    setPesagens(JSON.parse(localStorage.getItem('listaPesagens') || '[]'));
    setTransferencias(JSON.parse(localStorage.getItem('listaTransferencias') || '[]'));
  };

  // ============================================================================
  // INTEGRAÇÕES DE API (CNPJ e CEP)
  // ============================================================================
  const handleBuscarCNPJ = async () => {
    if (form.documento.replace(/\D/g, '').length !== 14) return;
    setLoadingApi(true);
    try {
      const data = await CnpjService.buscarCNPJ(form.documento);
      setForm((prev: any) => ({
        ...prev,
        razaoSocial: prev.razaoSocial || data.razao_social,
        nomeFantasia: prev.nomeFantasia || data.nome_fantasia || data.razao_social,
        nome: prev.nome || data.nome_fantasia || data.razao_social,
        cep: prev.cep || data.cep,
        logradouro: prev.logradouro || data.logradouro,
        numero: prev.numero || data.numero,
        complemento: prev.complemento || data.complemento,
        bairro: prev.bairro || data.bairro,
        cidade: prev.cidade || data.municipio,
        estado: prev.estado || data.uf,
        telefone: prev.telefone || data.ddd_telefone_1,
        email: prev.email || data.email,
        ibge: prev.ibge || data.codigo_municipio_ibge
      }));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingApi(false);
    }
  };

  const handleBuscarCEP = async () => {
    if (form.cep.replace(/\D/g, '').length !== 8) return;
    setLoadingApi(true);
    try {
      const data = await CepService.buscarCEP(form.cep);
      setForm((prev: any) => ({
        ...prev,
        logradouro: prev.logradouro || data.logradouro,
        bairro: prev.bairro || data.bairro,
        cidade: prev.cidade || data.localidade,
        estado: prev.estado || data.uf,
        ibge: prev.ibge || data.ibge
      }));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingApi(false);
    }
  };

  // ============================================================================
  // CRUD PESSOAS - 🚀 CONECTADO AO SUPABASE
  // ============================================================================
  const gerarCodigoPessoa = () => {
    const prefixo = form.tipoCadastro.charAt(0).toUpperCase();
    const numero = String(pessoas.length + 1).padStart(4, '0');
    return `${prefixo}${numero}`;
  };

  const handleSalvarPessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.documento) return alert("Nome e Documento são obrigatórios.");

    const isEdicao = !!form.id;

    const cadastroFinal = {
      ...form,
      codigo: isEdicao ? form.codigo : gerarCodigoPessoa(),
      dataCadastro: isEdicao ? form.dataCadastro : new Date().toLocaleDateString('pt-BR')
    };

    // Removemos o ID daqui para o banco gerar sozinho (ou para não bugar no Update)
    const { id, ...dadosParaSalvar } = cadastroFinal;

    let erroSupabase;

    if (isEdicao) {
      // Atualizar registro existente no Supabase
      const { error } = await supabase.from('pessoas').update(dadosParaSalvar).eq('id', form.id);
      erroSupabase = error;
    } else {
      // Inserir novo registro no Supabase
      const { error } = await supabase.from('pessoas').insert([dadosParaSalvar]);
      erroSupabase = error;
    }

    // Se o banco reclamar de Segurança (RLS) ou colunas faltando, ele avisa aqui!
    if (erroSupabase) {
      console.error("Erro do Supabase:", erroSupabase);
      alert(`Erro ao salvar no banco! Detalhe: ${erroSupabase.message}`);
      return;
    }

    // Deu tudo certo! Recarrega da nuvem e limpa a tela.
    await carregarDados(); 
    setModoFormulario(false);
    setForm(formInicial);
    alert(`Cadastro de ${form.nome} salvo com sucesso na nuvem! ☁️`);
  };

  const handleExcluirPessoa = async (pessoa: any) => {
    // Validação de Vínculos (Pesagens, Transf, Estoque)
    const temPesagem = pesagens.some(p => p.fornecedor === pessoa.nome);
    const temTransf = transferencias.some(t => t.de === pessoa.nome || t.para === pessoa.nome);
    
    if (temPesagem || temTransf) {
      const conf = window.confirm(`⚠️ AVISO: ${pessoa.nome} possui pesagens ou transferências atreladas.\nExcluir este cadastro pode quebrar o histórico e os saldos.\n\nDeseja forçar a exclusão mesmo assim?`);
      if (!conf) return;
    } else {
      const conf = window.confirm(`Deseja realmente excluir o cadastro de ${pessoa.nome}?`);
      if (!conf) return;
    }

    // Deleta do Supabase
    const { error } = await supabase.from('pessoas').delete().eq('id', pessoa.id);
    
    if (error) {
      console.error("Erro ao excluir:", error);
      alert(`Erro ao excluir do banco! Detalhe: ${error.message}`);
      return;
    }

    await carregarDados();
  };

  // ============================================================================
  // LISTAGEM E FILTROS INTELIGENTES (useMemo)
  // ============================================================================
  const pessoasFiltradas = useMemo(() => {
    let lista = [...pessoas];
    
    if (filtroTipo !== 'Todos') lista = lista.filter(p => p.tipoCadastro === filtroTipo);
    if (filtroStatus !== 'Todos') lista = lista.filter(p => p.status === filtroStatus);
    
    if (busca) {
      const b = busca.toLowerCase();
      lista = lista.filter(p => 
        (p.nome && p.nome.toLowerCase().includes(b)) || 
        (p.razaoSocial && p.razaoSocial.toLowerCase().includes(b)) || 
        (p.documento && p.documento.toLowerCase().includes(b)) || 
        (p.cidade && p.cidade.toLowerCase().includes(b)) ||
        (p.codigo && p.codigo.toLowerCase().includes(b))
      );
    }

    lista.sort((a, b) => {
      if (ordenacao === 'Nome A-Z') return a.nome.localeCompare(b.nome);
      if (ordenacao === 'Nome Z-A') return b.nome.localeCompare(a.nome);
      if (ordenacao === 'Mais Recente') return b.id - a.id;
      return 0;
    });

    return lista;
  }, [pessoas, busca, filtroTipo, filtroStatus, ordenacao]);

  const stats = useMemo(() => {
    return {
      total: pessoas.length,
      clientes: pessoas.filter(p => p.tipoCadastro === 'Cliente').length,
      fornecedores: pessoas.filter(p => p.tipoCadastro === 'Fornecedor').length,
      ambos: pessoas.filter(p => p.tipoCadastro === 'Ambos').length,
      ativos: pessoas.filter(p => p.status === 'Ativo').length,
    };
  }, [pessoas]);

  const exportarExcel = () => {
    let csv = "Codigo;Nome;Tipo;CPF/CNPJ;Cidade;UF;Telefone;Status\n";
    pessoasFiltradas.forEach(p => { csv += `${p.codigo};${p.nome};${p.tipoCadastro};${p.documento};${p.cidade};${p.estado};${p.telefone || p.celular};${p.status}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.setAttribute('download', 'cadastros.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // ============================================================================
  // OUTRAS ABAS (Motoristas, Veículos, Safras)
  // ============================================================================
  const salvarOutro = (chave: string, dado: any, setAux: any, inicial: any) => {
    const listaAtual = JSON.parse(localStorage.getItem(chave) || '[]');
    localStorage.setItem(chave, JSON.stringify([...listaAtual, { id: Date.now(), ...dado }]));
    carregarDados(); setAux(inicial);
  };
  const excluirOutro = (chave: string, id: number) => {
    const listaAtual = JSON.parse(localStorage.getItem(chave) || '[]');
    localStorage.setItem(chave, JSON.stringify(listaAtual.filter((i:any) => i.id !== id && i !== id))); 
    carregarDados();
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6 print:max-w-full">
        
        <div className="flex justify-between items-center print:hidden">
          <Link to="/" className="flex items-center gap-2 text-gray-600 font-medium hover:text-blue-600 transition"><ArrowLeft size={20} /> Voltar ao Painel</Link>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex gap-4 border-b border-gray-200 print:hidden overflow-x-auto">
          {['Pessoas', 'Motoristas', 'Veículos', 'Safras'].map(aba => (
            <button key={aba} onClick={() => {setAbaAtiva(aba); setModoFormulario(false);}} className={`pb-3 font-bold text-lg transition-colors border-b-2 px-4 whitespace-nowrap ${abaAtiva === aba ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-500'}`}>{aba}</button>
          ))}
        </div>

        {/* ===================================================================
            ABA 1: PESSOAS (MÓDULO ERP COMPLETO)
        ======================================================================= */}
        {abaAtiva === 'Pessoas' && !modoFormulario && (
          <div className="space-y-6 animate-fade-in print:hidden">
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Total de Cadastros</p><p className="font-bold text-2xl">{stats.total}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500"><p className="text-xs font-bold text-gray-400 uppercase">Apenas Clientes</p><p className="font-bold text-2xl text-green-600">{stats.clientes}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-orange-500"><p className="text-xs font-bold text-gray-400 uppercase">Fornecedores</p><p className="font-bold text-2xl text-orange-600">{stats.fornecedores}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-purple-500"><p className="text-xs font-bold text-gray-400 uppercase">Cli. & Forn.</p><p className="font-bold text-2xl text-purple-600">{stats.ambos}</p></div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-emerald-500"><p className="text-xs font-bold text-gray-400 uppercase">Cadastros Ativos</p><p className="font-bold text-2xl text-emerald-600">{stats.ativos}</p></div>
            </div>

            {/* Painel de Controle e Filtros */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex-1 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="text" placeholder="Pesquisar por nome, CNPJ, cidade, código..." className="w-full border p-2.5 pl-10 rounded-lg bg-slate-50 outline-none focus:border-blue-500" value={busca} onChange={e=>setBusca(e.target.value)} />
                  </div>
                  <select className="border p-2.5 rounded-lg bg-slate-50 font-medium" value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}>
                    <option value="Todos">Todos os Tipos</option><option>Cliente</option><option>Fornecedor</option><option>Ambos</option>
                  </select>
                  <select className="border p-2.5 rounded-lg bg-slate-50 font-medium" value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}>
                    <option value="Todos">Status</option><option>Ativo</option><option>Inativo</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportarExcel} className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition"><FileSpreadsheet size={18}/> Exportar</button>
                  <button onClick={() => {setForm(formInicial); setModoFormulario(true);}} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition shadow-md"><Plus size={18}/> Novo Cadastro</button>
                </div>
              </div>

              {/* Tabela de Dados */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b">
                    <tr><th className="p-4 font-bold text-slate-600">Código</th><th className="p-4 font-bold text-slate-600">Nome / Razão Social</th><th className="p-4 font-bold text-slate-600">CPF/CNPJ</th><th className="p-4 font-bold text-slate-600">Cidade/UF</th><th className="p-4 font-bold text-slate-600">Tipo</th><th className="p-4 font-bold text-slate-600 text-center">Status</th><th className="p-4 font-bold text-slate-600 text-center">Ações</th></tr>
                  </thead>
                  <tbody>
                    {pessoasFiltradas.map(p => (
                      <tr key={p.id} className="border-b hover:bg-slate-50 transition group">
                        <td className="p-4 font-mono text-xs text-gray-500">{p.codigo || '-'}</td>
                        <td className="p-4 font-bold text-gray-800">{p.nome} <span className="text-xs font-normal text-gray-400 block">{p.nomeFantasia || p.razaoSocial}</span></td>
                        <td className="p-4 text-gray-600">{p.documento}</td>
                        <td className="p-4 text-gray-600">{p.cidade} / {p.estado}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.tipoCadastro === 'Cliente' ? 'bg-blue-100 text-blue-700' : p.tipoCadastro === 'Fornecedor' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{p.tipoCadastro}</span></td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${p.status === 'Ativo' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}><span className={`w-2 h-2 rounded-full ${p.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></span> {p.status}</span>
                        </td>
                        <td className="p-4 flex gap-2 justify-center opacity-80 group-hover:opacity-100 transition">
                          <button onClick={() => setPessoaModal(p)} className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded" title="Visualizar"><Eye size={18}/></button>
                          <button onClick={() => {setForm(p); setModoFormulario(true);}} className="p-1.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded" title="Editar"><Edit size={18}/></button>
                          <button onClick={() => handleExcluirPessoa(p)} className="p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 rounded" title="Excluir"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                    {pessoasFiltradas.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-400"><Search size={40} className="mx-auto mb-4 opacity-30"/>Nenhum cadastro encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            FORMULÁRIO DE PESSOA (Mestre de Dados)
        ======================================================================= */}
        {modoFormulario && (
          <form onSubmit={handleSalvarPessoa} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-8 animate-fade-in relative print:hidden">
            
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Briefcase className="text-blue-600"/> {form.id ? `Editando Cadastro: ${form.codigo || form.nome}` : 'Novo Cadastro Mestre'}</h2>
                <p className="text-sm text-gray-500 mt-1">Preencha o CPF/CNPJ ou CEP para buscar dados automaticamente.</p>
              </div>
              <button type="button" onClick={() => setModoFormulario(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition"><X size={24}/></button>
            </div>

            {/* SEÇÃO: INFORMAÇÕES PRINCIPAIS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileText size={16}/> Dados Principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de Cadastro *</label>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border">
                    {['Cliente', 'Fornecedor', 'Ambos'].map(t => (
                      <button key={t} type="button" onClick={() => setForm({...form, tipoCadastro: t})} className={`flex-1 py-1.5 rounded text-sm font-bold transition ${form.tipoCadastro === t ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Pessoa Física / Jurídica</label>
                  <select className="w-full border p-2.5 rounded-lg bg-slate-50 outline-none" value={form.tipoPessoa} onChange={e=>setForm({...form, tipoPessoa: e.target.value})}>
                    <option value="PF">Pessoa Física (PF)</option><option value="PJ">Pessoa Jurídica (PJ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                  <select className={`w-full border p-2.5 rounded-lg font-bold outline-none ${form.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`} value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                    <option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>
                  </select>
                </div>

                <div className="md:col-span-2 relative">
                  <label className="block text-xs font-bold text-gray-600 mb-1">CPF / CNPJ *</label>
                  <input type="text" className="w-full border p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg" placeholder="000.000.000-00" value={form.documento} onChange={e=>setForm({...form, documento: e.target.value})} onBlur={handleBuscarCNPJ} required />
                  {loadingApi && <span className="absolute right-3 top-8 text-xs font-bold text-blue-500 animate-pulse">Buscando...</span>}
                </div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Inscrição Estadual</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.inscricaoEstadual} onChange={e=>setForm({...form, inscricaoEstadual: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Inscrição Municipal</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.inscricaoMunicipal} onChange={e=>setForm({...form, inscricaoMunicipal: e.target.value})} /></div>

                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Nome / Nome Fantasia *</label><input type="text" className="w-full border p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} required /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Razão Social</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.razaoSocial} onChange={e=>setForm({...form, razaoSocial: e.target.value})} /></div>
              </div>
            </div>

            {/* SEÇÃO: ENDEREÇO E CONTATO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-dashed">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={16}/> Endereço Completo</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-600 mb-1">CEP</label>
                    <input type="text" className="w-full border p-2.5 rounded-lg bg-white" placeholder="00000-000" value={form.cep} onChange={e=>setForm({...form, cep: e.target.value})} onBlur={handleBuscarCEP} />
                  </div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Logradouro</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.logradouro} onChange={e=>setForm({...form, logradouro: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Número</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.numero} onChange={e=>setForm({...form, numero: e.target.value})} /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Complemento</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.complemento} onChange={e=>setForm({...form, complemento: e.target.value})} /></div>
                  <div className="col-span-3 grid grid-cols-3 gap-4">
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Bairro</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.bairro} onChange={e=>setForm({...form, bairro: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Cidade</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.cidade} onChange={e=>setForm({...form, cidade: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">UF / IBGE</label><div className="flex gap-2"><input type="text" className="w-12 border p-2.5 rounded-lg bg-slate-50 uppercase text-center" maxLength={2} value={form.estado} onChange={e=>setForm({...form, estado: e.target.value})} /><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50 text-xs" placeholder="IBGE" value={form.ibge} onChange={e=>setForm({...form, ibge: e.target.value})} /></div></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Phone size={16}/> Contato</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Celular / WhatsApp</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.whatsapp || form.celular} onChange={e=>setForm({...form, whatsapp: e.target.value, celular: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Telefone Fixo</label><input type="text" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.telefone} onChange={e=>setForm({...form, telefone: e.target.value})} /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">E-mail</label><input type="email" className="w-full border p-2.5 rounded-lg bg-slate-50" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Observações Internas</label><textarea className="w-full border p-2.5 rounded-lg bg-yellow-50 outline-none focus:border-yellow-400 min-h-[105px]" value={form.observacoes} onChange={e=>setForm({...form, observacoes: e.target.value})} placeholder="Instruções para balança, restrições, etc..."></textarea></div>
                </div>
              </div>
            </div>

            {/* SEÇÃO: AGRO E FINANCEIRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-dashed bg-slate-50 -mx-8 px-8 pb-8 rounded-b-2xl">
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Tractor size={16}/> Dados Comerciais / Agro</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Categoria Comercial</label>
                    <select className="w-full border p-2.5 rounded-lg bg-white" value={form.categoria} onChange={e=>setForm({...form, categoria: e.target.value})}>
                      <option>Produtor Rural</option><option>Cooperativa</option><option>Transportadora</option><option>Revenda</option><option>Cliente Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">É Produtor Rural?</label>
                    <select className="w-full border p-2.5 rounded-lg bg-white" value={form.produtorRural} onChange={e=>setForm({...form, produtorRural: e.target.value})}><option>Sim</option><option>Não</option></select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Vendedor Responsável</label><input type="text" className="w-full border p-2.5 rounded-lg bg-white" value={form.vendedor} onChange={e=>setForm({...form, vendedor: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Limite Máx. Armazenagem (KG)</label><input type="number" className="w-full border p-2.5 rounded-lg bg-white" value={form.limiteArmazenagem} onChange={e=>setForm({...form, limiteArmazenagem: Number(e.target.value)})} /></div>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={16}/> Dados Financeiros</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Limite de Crédito Aprovado (R$)</label>
                    <input type="number" className="w-full border-2 border-green-200 p-2.5 rounded-lg bg-white text-green-700 font-bold text-lg outline-none focus:border-green-500" value={form.limiteCredito} onChange={e=>setForm({...form, limiteCredito: Number(e.target.value)})} />
                  </div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Banco</label><input type="text" className="w-full border p-2.5 rounded-lg bg-white" placeholder="Ex: Sicredi, BB..." value={form.banco} onChange={e=>setForm({...form, banco: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Agência / Conta</label><div className="flex gap-2"><input type="text" className="w-1/3 border p-2.5 rounded-lg bg-white" placeholder="Ag" value={form.agencia} onChange={e=>setForm({...form, agencia: e.target.value})} /><input type="text" className="w-2/3 border p-2.5 rounded-lg bg-white" placeholder="CC" value={form.conta} onChange={e=>setForm({...form, conta: e.target.value})} /></div></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Chave PIX</label><input type="text" className="w-full border p-2.5 rounded-lg bg-white" value={form.pix} onChange={e=>setForm({...form, pix: e.target.value})} /></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button type="button" onClick={() => setModoFormulario(false)} className="px-8 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition">Cancelar</button>
              <button type="submit" className="px-8 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg flex items-center gap-2"><Save size={20}/> {form.id ? 'Atualizar Cadastro' : 'Salvar Cadastro Mestre'}</button>
            </div>
          </form>
        )}

        {/* ===================================================================
            ABAS SECUNDÁRIAS (Mantidas como solicitado)
        ======================================================================= */}
        {abaAtiva === 'Motoristas' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 animate-fade-in print:hidden">
            <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">Cadastro Rápido de Motoristas</h3>
            <div className="flex gap-4">
              <input className="border p-2.5 rounded-lg w-1/2 bg-slate-50" placeholder="Nome do Motorista" value={auxMot.nome} onChange={e=>setAuxMot({...auxMot, nome: e.target.value})} />
              <input className="border p-2.5 rounded-lg w-1/4 bg-slate-50" placeholder="CNH" value={auxMot.cnh} onChange={e=>setAuxMot({...auxMot, cnh: e.target.value})} />
              <button onClick={() => { if(auxMot.nome) salvarOutro('listaMotoristas', auxMot, setAuxMot, {nome:'', cnh:''})}} className="bg-blue-600 text-white px-6 rounded-lg font-bold flex-1 hover:bg-blue-700 transition">Adicionar</button>
            </div>
            <table className="w-full text-left border mt-4 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b"><tr><th className="p-3">Nome</th><th className="p-3">CNH</th><th className="p-3 text-center">Ações</th></tr></thead>
                <tbody>{motoristas.map((m:any) => <tr key={m.id} className="border-b hover:bg-slate-50"><td className="p-3 font-medium">{m.nome}</td><td className="p-3 text-gray-500">{m.cnh}</td><td className="p-3 text-center"><button onClick={()=>excluirOutro('listaMotoristas', m.id)} className="text-red-500 p-1.5 hover:bg-red-100 rounded"><Trash2 size={18}/></button></td></tr>)}</tbody>
            </table>
          </div>
        )}

        {abaAtiva === 'Veículos' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 animate-fade-in print:hidden">
            <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">Frota / Veículos</h3>
            <div className="flex gap-4">
              <input className="border p-2.5 rounded-lg w-1/4 bg-slate-50 uppercase" placeholder="Placa" value={auxVei.placa} onChange={e=>setAuxVei({...auxVei, placa: e.target.value})} />
              <input className="border p-2.5 rounded-lg w-1/2 bg-slate-50" placeholder="Descrição (Ex: Scania R440 Branca)" value={auxVei.descricao} onChange={e=>setAuxVei({...auxVei, descricao: e.target.value})} />
              <button onClick={() => { if(auxVei.placa) salvarOutro('listaVeiculos', auxVei, setAuxVei, {placa:'', descricao:''})}} className="bg-blue-600 text-white px-6 rounded-lg font-bold flex-1 hover:bg-blue-700 transition">Adicionar</button>
            </div>
            <table className="w-full text-left border mt-4 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b"><tr><th className="p-3">Placa</th><th className="p-3">Descrição</th><th className="p-3 text-center">Ações</th></tr></thead>
                <tbody>{veiculos.map((v:any) => <tr key={v.id} className="border-b hover:bg-slate-50"><td className="p-3 font-bold uppercase">{v.placa}</td><td className="p-3 text-gray-600">{v.descricao}</td><td className="p-3 text-center"><button onClick={()=>excluirOutro('listaVeiculos', v.id)} className="text-red-500 p-1.5 hover:bg-red-100 rounded"><Trash2 size={18}/></button></td></tr>)}</tbody>
            </table>
          </div>
        )}

        {abaAtiva === 'Safras' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 animate-fade-in print:hidden">
             <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">Gestão de Safras</h3>
             <div className="flex gap-4">
              <input className="border p-2.5 rounded-lg w-1/2 bg-slate-50" placeholder="Ex: 2026/2027" value={auxSafra} onChange={e=>setAuxSafra(e.target.value)} />
              <button onClick={() => { if(auxSafra) salvarOutro('listaSafras', auxSafra, setAuxSafra, '')}} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition">Adicionar Safra</button>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {safras.map((s:any, i) => (
                <div key={i} className="p-4 border rounded-lg flex justify-between items-center bg-slate-50 font-bold text-gray-700">
                  {s.id ? s.id : s} {/* Trata strings antigas e objetos novos */}
                  <button onClick={()=>excluirOutro('listaSafras', s.id || s)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ===================================================================
          MODAL DE VISUALIZAÇÃO
      ======================================================================= */}
      {pessoaModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 print:hidden" onClick={() => setPessoaModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">{pessoaModal.nome}</h2>
                <p className="text-slate-300 text-sm mt-1">{pessoaModal.tipoCadastro} • {pessoaModal.documento}</p>
              </div>
              <button onClick={() => setPessoaModal(null)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition"><X size={20}/></button>
            </div>
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="col-span-2"><p className="text-xs font-bold text-gray-400">Razão Social / Fantasia</p><p className="font-bold text-gray-800">{pessoaModal.razaoSocial || pessoaModal.nomeFantasia || '-'}</p></div>
              <div><p className="text-xs font-bold text-gray-400">Código ERP</p><p className="font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded inline-block">{pessoaModal.codigo || '-'}</p></div>
              <div><p className="text-xs font-bold text-gray-400">Status</p><p className={`font-bold ${pessoaModal.status === 'Ativo' ? 'text-green-600' : 'text-red-600'}`}>{pessoaModal.status}</p></div>
              
              <div className="col-span-full border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2"><p className="text-xs font-bold text-gray-400">Endereço Completo</p><p className="font-medium text-gray-800">{pessoaModal.logradouro}, {pessoaModal.numero} {pessoaModal.complemento} - {pessoaModal.bairro}. {pessoaModal.cidade}/{pessoaModal.estado}</p></div>
                <div><p className="text-xs font-bold text-gray-400">CEP</p><p className="font-medium text-gray-800">{pessoaModal.cep || '-'}</p></div>
                <div><p className="text-xs font-bold text-gray-400">Contato</p><p className="font-medium text-gray-800">{pessoaModal.celular || pessoaModal.telefone || '-'}</p></div>
              </div>

              <div className="col-span-full border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs font-bold text-gray-400">Categoria</p><p className="font-medium text-gray-800">{pessoaModal.categoria}</p></div>
                <div><p className="text-xs font-bold text-gray-400">Produtor Rural</p><p className="font-medium text-gray-800">{pessoaModal.produtorRural}</p></div>
                <div className="col-span-2"><p className="text-xs font-bold text-gray-400">Limite de Crédito</p><p className="font-bold text-green-700 text-lg">R$ {Number(pessoaModal.limiteCredito || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
              </div>

              {pessoaModal.observacoes && (
                <div className="col-span-full border-t pt-4">
                  <p className="text-xs font-bold text-gray-400">Observações Internas</p>
                  <p className="font-medium text-gray-800 bg-yellow-50 p-4 rounded-lg border mt-1">{pessoaModal.observacoes}</p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-6 flex justify-between items-center border-t">
              <span className="text-xs text-gray-400 font-bold">Cadastrado em: {pessoaModal.dataCadastro || '-'}</span>
              <button onClick={() => setPessoaModal(null)} className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}