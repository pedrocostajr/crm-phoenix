import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical, 
  Edit, 
  Eye, 
  Play, 
  Pause, 
  Copy, 
  Share2, 
  BarChart2, 
  Trash2, 
  ExternalLink, 
  ClipboardList, 
  X, 
  FileText, 
  QrCode, 
  Code, 
  Maximize, 
  UserPlus, 
  DollarSign, 
  ShieldCheck, 
  Smile, 
  Calendar, 
  Home as HomeIcon, 
  Car, 
  MapPin, 
  FileJson,
  Check,
  AlertCircle
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Form, FormSettings, QuestionBlock } from '../types';
import { FORM_TEMPLATES, FormTemplate } from './formTemplates';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FormListProps {
  userId: string;
  onEditForm: (formId: string) => void;
  onViewResponses: (formId: string) => void;
}

const FormList: React.FC<FormListProps> = ({ userId, onEditForm, onViewResponses }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt_desc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFormForShare, setSelectedFormForShare] = useState<Form | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [embedCodeType, setEmbedCodeType] = useState<'iframe' | 'inline' | 'popup' | 'floating'>('iframe');

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await storageService.getForms();
      // Filter by userId/workspaceId if needed, but for now we list all associated.
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const formsRef = collection(db, 'forms');
    const q = query(formsRef, orderBy('createdAt', 'desc'));
    
    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storedForms = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Form;
      });
      setForms(storedForms);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to forms:", error);
      setLoading(false);
      loadForms();
    });

    return () => unsubscribe();
  }, []);

  // Diagnostic State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const runDiagnosticTest = async () => {
    setTesting(true);
    setIsTestModalOpen(true);
    setTestLogs(['Iniciando testes de diagnóstico do sistema...']);

    try {
      if (forms.length === 0) {
        setTestLogs(prev => [...prev, '❌ Nenhum formulário cadastrado no sistema. Crie um formulário primeiro para rodar o teste.']);
        setTesting(false);
        return;
      }

      const testForm = forms[0];
      setTestLogs(prev => [...prev, `ℹ️ Utilizando o formulário "${testForm.settings.internalName}" (ID: ${testForm.id}) para teste.`]);

      const testResponseId = `test_resp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const testEmail = `teste-${Math.random().toString(36).substring(2, 8)}@phoenixcrm.com`;
      setTestLogs(prev => [...prev, `🚀 Gerando dados de teste (E-mail: ${testEmail})...`]);

      setTestLogs(prev => [...prev, '⏳ Gravando resposta de teste no Firestore (coleção form_responses)...']);
      const testResponse = {
        id: testResponseId,
        formId: testForm.id,
        workspaceId: testForm.workspaceId || 'default',
        sessionId: 'test_session',
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        answers: {
          block_name: {
            questionId: 'block_name',
            questionTitle: 'Nome de Teste',
            value: 'Lead Teste Conexão',
            crmField: 'name'
          },
          block_email: {
            questionId: 'block_email',
            questionTitle: 'E-mail de Teste',
            value: testEmail,
            crmField: 'email'
          }
        },
        currentQuestionId: 'thank_you',
        device: { browser: 'Chrome', os: 'MacOS', deviceType: 'desktop' as const },
        utm: null,
        referrerUrl: '',
        timeSpent: 10
      };

      const respRes = await storageService.saveResponse(testResponse);
      if (respRes.success) {
        setTestLogs(prev => [...prev, '✅ Resposta salva com sucesso na coleção "form_responses"!']);
      } else {
        setTestLogs(prev => [...prev, `❌ Erro ao salvar resposta no Firestore: ${respRes.error}`]);
        setTesting(false);
        return;
      }

      setTestLogs(prev => [...prev, '⏳ Gravando Lead de teste no Firestore (coleção leads)...']);
      const testLeadId = `test_lead_${Date.now()}`;
      const testLead = {
        id: testLeadId,
        name: 'Lead Teste Conexão',
        company: 'Empresa Teste',
        email: testEmail,
        phone: '(11) 99999-9999',
        status: testForm.automations?.pipelineStage || 'Novo Lead',
        estimatedValue: 1500,
        origin: testForm.settings.publicTitle || 'Formulário de Teste',
        responsible: testForm.automations?.responsibleUser || 'Sistema',
        tags: ['teste', 'conexao'],
        observations: 'Lead de diagnóstico gerado pelo sistema para testes de escrita.',
        createdAt: new Date().toISOString(),
        interactions: [
          {
            id: `int_${Date.now()}`,
            type: 'Outro' as const,
            date: new Date().toISOString(),
            description: 'Lead criado via teste de diagnóstico do CRM.'
          }
        ]
      };

      const leadRes = await storageService.saveLead(testLead);
      if (leadRes.success) {
        setTestLogs(prev => [...prev, '✅ Lead criado com sucesso na coleção "leads"!']);
      } else {
        setTestLogs(prev => [...prev, `❌ Erro ao salvar Lead no Firestore: ${leadRes.error}`]);
        setTesting(false);
        return;
      }

      setTestLogs(prev => [...prev, '⏳ Vinculando resposta ao Lead...']);
      const linkRes = await storageService.saveResponse({
        ...testResponse,
        leadId: testLeadId
      });
      if (linkRes.success) {
        setTestLogs(prev => [...prev, '✅ Resposta vinculada ao Lead com sucesso!']);
      } else {
        setTestLogs(prev => [...prev, `❌ Erro ao vincular resposta ao Lead: ${linkRes.error}`]);
        setTesting(false);
        return;
      }

      setTestLogs(prev => [...prev, '⏳ Incrementando métricas do formulário...']);
      await storageService.incrementFormMetric(testForm.id, 'completionsCount');
      setTestLogs(prev => [...prev, '✅ Métricas de conversão incrementadas com sucesso!']);

      setTestLogs(prev => [...prev, '⏳ Gravando notificação de teste no Firestore (coleção notifications)...']);
      try {
        await storageService.createNotification({
          title: 'Teste de Diagnóstico',
          body: 'Notificação enviada com sucesso no teste de conexão.',
          createdAt: new Date().toISOString(),
          read: false
        });
        setTestLogs(prev => [...prev, '✅ Notificação gravada com sucesso!']);
      } catch (notifErr: any) {
        setTestLogs(prev => [...prev, `❌ Erro ao salvar notificação: ${notifErr.message}`]);
        setTesting(false);
        return;
      }

      setTestLogs(prev => [...prev, '⏳ Gravando notificação com ID específico no Firestore (setDoc)...']);
      try {
        await storageService.createNotification({
          id: `test_notif_${Date.now()}`,
          title: 'Teste de Diagnóstico com ID',
          body: 'Notificação com ID gravada com sucesso.',
          createdAt: new Date().toISOString(),
          read: false
        });
        setTestLogs(prev => [...prev, '✅ Notificação com ID específica gravada com sucesso!']);
      } catch (notifIdErr: any) {
        setTestLogs(prev => [...prev, `❌ Erro ao salvar notificação com ID: ${notifIdErr.message}`]);
        setTesting(false);
        return;
      }

      setTestLogs(prev => [...prev, '⏳ Lendo notificações do Firestore para verificar leitura...']);
      try {
        const notifList = await storageService.getNotifications();
        setTestLogs(prev => [...prev, `✅ Sucesso! Total de notificações no banco: ${notifList.length}`]);
        const titles = notifList.map((n, i) => `${i + 1}. [${n.title}] "${n.body}"`).join('\n');
        setTestLogs(prev => [...prev, `ℹ️ Lista de notificações:\n${titles}`]);
      } catch (readErr: any) {
        setTestLogs(prev => [...prev, `❌ Erro ao ler notificações: ${readErr.message}`]);
        setTesting(false);
        return;
      }

      setTestLogs(prev => [...prev, '🎉 Parabéns! Todos os testes de gravação foram executados com sucesso! O banco de dados está 100% funcional.']);
    } catch (err: any) {
      setTestLogs(prev => [...prev, `❌ Erro crítico inesperado durante o diagnóstico: ${err.message}`]);
    } finally {
      setTesting(false);
    }
  };

  const handleCreateBlank = async () => {
    const randomSlug = Math.random().toString(36).substring(2, 8);
    const newForm: Form = {
      id: `form_${Date.now()}`,
      userId: userId,
      workspaceId: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        internalName: 'Formulário sem Título',
        publicTitle: 'Pesquisa',
        description: 'Por favor, preencha este formulário.',
        slug: `form-${randomSlug}`,
        status: 'draft',
        language: 'pt-BR',
        oneResponsePerPerson: false,
        captureUtm: true,
        captureReferrer: true,
        captureDevice: true,
        notifyNewResponse: false
      },
      blocks: [
        { id: `block_welcome`, type: 'welcome', title: 'Bem-vindo ao formulário!', description: 'Clique no botão abaixo para iniciar.', required: false, internalId: 'welcome' },
        { id: `block_name`, type: 'name', title: 'Qual é o seu nome?', required: true, placeholder: 'Digite seu nome...', internalId: 'name', crmField: 'name' },
        { id: `block_email`, type: 'email', title: 'Qual é o seu e-mail?', required: true, placeholder: 'nome@exemplo.com', internalId: 'email', crmField: 'email' },
        { id: `block_thankyou`, type: 'thank_you', title: 'Obrigado!', description: 'Suas respostas foram gravadas.', required: false, internalId: 'thank_you' }
      ],
      theme: {
        primaryColor: '#3b82f6',
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        fontFamily: 'Inter',
        borderRadius: '0.75rem',
        showBranding: true
      },
      automations: {
        createLead: true,
        addTags: ['lead-forms']
      },
      webhooks: []
    };

    const res = await storageService.saveForm(newForm);
    if (res.success) {
      setIsCreateModalOpen(false);
      onEditForm(newForm.id);
    } else {
      alert('Erro ao criar formulário: ' + res.error);
    }
  };

  const handleCreateFromTemplate = async (templateKey: string, template: FormTemplate) => {
    const randomSlug = Math.random().toString(36).substring(2, 8);
    const formId = `form_${Date.now()}`;
    
    // Add unique IDs to template blocks
    const processedBlocks: QuestionBlock[] = template.blocks.map((block, idx) => ({
      ...block,
      id: `block_${Date.now()}_${idx}`
    })) as QuestionBlock[];

    const newForm: Form = {
      id: formId,
      userId: userId,
      workspaceId: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        internalName: `[Modelo] ${template.name}`,
        publicTitle: template.name,
        description: template.description,
        slug: `${templateKey}-${randomSlug}`,
        status: 'draft',
        language: 'pt-BR',
        oneResponsePerPerson: false,
        captureUtm: true,
        captureReferrer: true,
        captureDevice: true,
        notifyNewResponse: false
      },
      blocks: processedBlocks,
      theme: template.theme,
      automations: {
        createLead: true,
        addTags: ['template-forms', templateKey]
      },
      webhooks: []
    };

    const res = await storageService.saveForm(newForm);
    if (res.success) {
      setIsCreateModalOpen(false);
      onEditForm(newForm.id);
    } else {
      alert('Erro ao criar formulário: ' + res.error);
    }
  };

  const handleDuplicate = async (originalForm: Form) => {
    const randomSlug = Math.random().toString(36).substring(2, 8);
    const duplicatedForm: Form = {
      ...originalForm,
      id: `form_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        ...originalForm.settings,
        internalName: `${originalForm.settings.internalName} (Cópia)`,
        slug: `${originalForm.settings.slug}-copy-${randomSlug}`,
        status: 'draft'
      },
      viewsCount: 0,
      startsCount: 0,
      completionsCount: 0,
      partialsCount: 0,
      avgTimeSpent: 0
    };

    const res = await storageService.saveForm(duplicatedForm);
    if (res.success) {
      loadForms();
      setActiveMenuId(null);
    } else {
      alert('Erro ao duplicar: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este formulário? Todas as respostas associadas serão mantidas no histórico de leads, mas o formulário público ficará inacessível.')) return;
    
    const res = await storageService.deleteForm(id);
    if (res.success) {
      loadForms();
      setActiveMenuId(null);
    } else {
      alert('Erro ao excluir: ' + res.error);
    }
  };

  const handleToggleStatus = async (form: Form) => {
    const nextStatus = form.settings.status === 'published' ? 'paused' : 'published';
    const updatedForm: Form = {
      ...form,
      updatedAt: new Date().toISOString(),
      settings: {
        ...form.settings,
        status: nextStatus
      }
    };
    const res = await storageService.saveForm(updatedForm);
    if (res.success) {
      loadForms();
      setActiveMenuId(null);
    } else {
      alert('Erro ao alterar status: ' + res.error);
    }
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserPlus': return <UserPlus className="text-blue-500" size={24} />;
      case 'DollarSign': return <DollarSign className="text-purple-500" size={24} />;
      case 'ShieldCheck': return <ShieldCheck className="text-sky-500" size={24} />;
      case 'FileText': return <FileText className="text-green-500" size={24} />;
      case 'Smile': return <Smile className="text-amber-500" size={24} />;
      case 'Calendar': return <Calendar className="text-pink-500" size={24} />;
      case 'Home': return <HomeIcon className="text-emerald-500" size={24} />;
      case 'Car': return <Car className="text-red-500" size={24} />;
      case 'MapPin': return <MapPin className="text-indigo-500" size={24} />;
      default: return <FileText className="text-slate-500" size={24} />;
    }
  };

  // Filter and Sort
  const filteredForms = forms
    .filter(form => {
      const matchSearch = form.settings.internalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          form.settings.publicTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || form.settings.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const [field, direction] = sortBy.split('_');
      const isDesc = direction === 'desc';
      
      if (field === 'internalName') {
        const valA = a.settings.internalName.toLowerCase();
        const valB = b.settings.internalName.toLowerCase();
        return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      
      if (field === 'views') {
        const valA = a.viewsCount || 0;
        const valB = b.viewsCount || 0;
        return isDesc ? valB - valA : valA - valB;
      }

      if (field === 'responses') {
        const valA = a.completionsCount || 0;
        const valB = b.completionsCount || 0;
        return isDesc ? valB - valA : valA - valB;
      }

      if (field === 'conversion') {
        const convA = (a.viewsCount || 0) > 0 ? (a.completionsCount || 0) / (a.viewsCount || 0) : 0;
        const convB = (b.viewsCount || 0) > 0 ? (b.completionsCount || 0) / (b.viewsCount || 0) : 0;
        return isDesc ? convB - convA : convA - convB;
      }

      // Default date fields
      const dateA = new Date(a[field as keyof Form] as string || 0).getTime();
      const dateB = new Date(b[field as keyof Form] as string || 0).getTime();
      return isDesc ? dateB - dateA : dateA - dateB;
    });

  const getPublicLink = (form: Form) => {
    return `${window.location.origin}/f/${form.settings.slug}`;
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getEmbedCode = (form: Form) => {
    const link = getPublicLink(form);
    if (embedCodeType === 'iframe') {
      return `<iframe src="${link}" width="100%" height="600px" style="border:none;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);"></iframe>`;
    }
    if (embedCodeType === 'inline') {
      return `<div id="phoenix-form-${form.id}"></div>\n<script src="${window.location.origin}/embed.js" data-form-id="${form.id}" data-target="#phoenix-form-${form.id}"></script>`;
    }
    if (embedCodeType === 'popup') {
      return `<button onclick="PhoenixForms.openPopup('${form.id}')" style="background:#3b82f6;color:white;padding:12px 24px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Responder Formulário</button>`;
    }
    // Floating button
    return `<script src="${window.location.origin}/floating-embed.js" data-form-id="${form.id}" data-color="${form.theme.primaryColor}"></script>`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-blue-600" /> Formulários Interativos
          </h2>
          <p className="text-slate-500 text-sm">Crie, personalize e monitore formulários com experiência dinâmica Typeform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runDiagnosticTest}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 text-sm"
          >
            <ShieldCheck size={18} className="text-emerald-600" /> Diagnosticar Conexão
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 text-sm"
          >
            <Plus size={18} /> Criar Formulário
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar formulários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3 justify-end">
          {/* Status filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none font-medium cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
              <option value="paused">Pausados</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent outline-none font-medium cursor-pointer"
            >
              <option value="updatedAt_desc">Recentes</option>
              <option value="createdAt_desc">Data Criação</option>
              <option value="internalName_asc">Nome (A-Z)</option>
              <option value="views_desc">Mais Visualizados</option>
              <option value="responses_desc">Mais Respondidos</option>
              <option value="conversion_desc">Maior Conversão</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms List Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center p-16 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800">Nenhum formulário encontrado</h3>
            <p className="text-slate-500 text-sm mt-1">Crie o seu primeiro formulário interativo para captar leads qualificados com facilidade e integrá-los ao seu funil.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-sm transition-colors hover:bg-blue-700"
          >
            Começar agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => {
            const views = form.viewsCount || 0;
            const completions = form.completionsCount || 0;
            const conversion = views > 0 ? (completions / views) * 100 : 0;
            const isMenuOpen = activeMenuId === form.id;

            return (
              <div key={form.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col group overflow-hidden">
                {/* Visual Accent */}
                <div className="h-1.5 w-full" style={{ backgroundColor: form.theme.primaryColor || '#3b82f6' }}></div>
                
                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Upper row */}
                    <div className="flex justify-between items-start mb-3">
                      {/* Status badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        form.settings.status === 'published' ? 'bg-green-50 text-green-700' :
                        form.settings.status === 'paused' ? 'bg-orange-50 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {form.settings.status === 'published' ? 'Publicado' :
                         form.settings.status === 'paused' ? 'Pausado' : 'Rascunho'}
                      </span>

                      {/* Dropdown Options */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : form.id);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 p-1 py-1.5 text-sm">
                              <button
                                onClick={() => { onEditForm(form.id); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                <Edit size={14} /> Editar
                              </button>
                              <a
                                href={getPublicLink(form)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                <Eye size={14} /> Visualizar
                              </a>
                              <button
                                onClick={() => handleToggleStatus(form)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                {form.settings.status === 'published' ? (
                                  <><Pause size={14} /> Pausar</>
                                ) : (
                                  <><Play size={14} /> Publicar</>
                                )}
                              </button>
                              <button
                                onClick={() => handleDuplicate(form)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                <Copy size={14} /> Duplicar
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFormForShare(form);
                                  setIsShareModalOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                <Share2 size={14} /> Compartilhar
                              </button>
                              <button
                                onClick={() => { onViewResponses(form.id); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium text-left"
                              >
                                <BarChart2 size={14} /> Ver Respostas
                              </button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button
                                onClick={() => handleDelete(form.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-bold text-left"
                              >
                                <Trash2 size={14} /> Excluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {form.settings.internalName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mb-4">Slug: /f/{form.settings.slug}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center mb-6">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Acessos</p>
                      <p className="text-lg font-black text-slate-700">{views}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Envios</p>
                      <p className="text-lg font-black text-slate-700">{completions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Conversão</p>
                      <p className="text-lg font-black text-slate-700">{conversion.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Footer Dates */}
                  <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-4">
                    <span>Criado: {new Date(form.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span>Atualizado: {new Date(form.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Quick edit footer */}
                <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 flex justify-between gap-4">
                  <button 
                    onClick={() => onEditForm(form.id)}
                    className="flex-1 py-2 px-3 hover:bg-blue-600 bg-white border border-slate-200 text-slate-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:border-blue-600"
                  >
                    <Edit size={12} /> Editar
                  </button>
                  <button 
                    onClick={() => onViewResponses(form.id)}
                    className="flex-1 py-2 px-3 hover:bg-slate-800 bg-white border border-slate-200 text-slate-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:border-slate-800"
                  >
                    <BarChart2 size={12} /> Respostas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Criar Novo Formulário</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Scrollable Templates */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Option 1: Blank */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Em branco</h3>
                <button
                  onClick={handleCreateBlank}
                  className="w-full p-6 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl text-left flex items-center gap-4 transition-all hover:bg-blue-50/30 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600">Formulário em Branco</h4>
                    <p className="text-slate-500 text-sm">Comece do zero e customize todas as etapas e blocos de perguntas.</p>
                  </div>
                </button>
              </div>

              {/* Option 2: Pre-defined templates */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Utilizar Modelo Pronto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(FORM_TEMPLATES).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => handleCreateFromTemplate(key, template)}
                      className="p-5 border border-slate-200 hover:border-blue-400 rounded-2xl text-left flex items-start gap-4 transition-all hover:bg-slate-50 hover:shadow-sm group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {getTemplateIcon(template.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 truncate">{template.name}</h4>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{template.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {isShareModalOpen && selectedFormForShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Compartilhar Formulário</h2>
                <p className="text-slate-500 text-xs mt-0.5">{selectedFormForShare.settings.internalName}</p>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Status warning */}
              {selectedFormForShare.settings.status !== 'published' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-bold text-amber-800 text-sm">Formulário Não Publicado</h4>
                    <p className="text-amber-700 text-xs mt-0.5">Este formulário está como <strong>{selectedFormForShare.settings.status === 'draft' ? 'Rascunho' : 'Pausado'}</strong>. O link público retornará uma tela de indisponibilidade até que você o publique.</p>
                  </div>
                </div>
              )}

              {/* Public Link */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link Público</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPublicLink(selectedFormForShare)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium text-slate-700"
                  />
                  <button
                    onClick={() => handleCopyLink(getPublicLink(selectedFormForShare))}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95"
                  >
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    {copiedLink ? 'Copiado!' : 'Copiar'}
                  </button>
                  <a
                    href={getPublicLink(selectedFormForShare)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center"
                    title="Abrir em nova aba"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Embed Options */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código de Incorporação (Embed)</label>
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setEmbedCodeType('iframe')}
                      className={`px-2 py-1 rounded-md ${embedCodeType === 'iframe' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      iFrame
                    </button>
                    <button
                      onClick={() => setEmbedCodeType('inline')}
                      className={`px-2 py-1 rounded-md ${embedCodeType === 'inline' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Inline
                    </button>
                    <button
                      onClick={() => setEmbedCodeType('popup')}
                      className={`px-2 py-1 rounded-md ${embedCodeType === 'popup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Pop-up
                    </button>
                    <button
                      onClick={() => setEmbedCodeType('floating')}
                      className={`px-2 py-1 rounded-md ${embedCodeType === 'floating' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Flutuante
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={4}
                    value={getEmbedCode(selectedFormForShare)}
                    className="w-full p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-2xl border-none outline-none resize-none leading-relaxed"
                  />
                  <button
                    onClick={() => handleCopyLink(getEmbedCode(selectedFormForShare))}
                    className="absolute right-3 bottom-4 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Copy size={12} /> Copiar Código
                  </button>
                </div>
                <p className="text-slate-400 text-xxs leading-normal">
                  {embedCodeType === 'iframe' && 'Copie o código HTML acima e insira em qualquer parte do seu site para exibir o formulário dentro de uma moldura.'}
                  {embedCodeType === 'inline' && 'Incorpora o formulário de forma integrada no HTML usando nosso script carregador assíncrono.'}
                  {embedCodeType === 'popup' && 'Gera um botão que, ao ser clicado, abre o formulário em um pop-up centralizado de alta performance.'}
                  {embedCodeType === 'floating' && 'Carrega um botão flutuante discreto no canto inferior direito da tela para chamar o formulário.'}
                </p>
              </div>

              {/* QR Code */}
              <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center gap-6">
                <div className="w-32 h-32 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-inner relative">
                  <QrCode size={64} className="text-slate-400" />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 hover:bg-slate-900/10 cursor-pointer rounded-2xl transition-colors">
                    <span className="text-xxs font-black text-slate-700 bg-white px-2 py-1 rounded-md shadow">Baixar QR</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">QR Code de Resposta Rápida</h4>
                  <p className="text-slate-500 text-xs">Exiba em materiais impressos, panfletos, apresentações ou displays para que as pessoas possam preencher escaneando o celular.</p>
                  <button
                    onClick={() => {
                      alert('Download do QR Code iniciado (simulado)');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all"
                  >
                    Download PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC MODAL */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTestModalOpen(false)}></div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" />
                <h2 className="text-lg font-bold text-white font-sans">Diagnóstico de Conexão e Banco</h2>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Logs console */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-2 bg-slate-950 text-slate-300 min-h-[300px]">
              {testLogs.map((log, i) => {
                let colorClass = 'text-slate-300';
                if (log.startsWith('✅')) colorClass = 'text-emerald-400';
                if (log.startsWith('❌')) colorClass = 'text-rose-400';
                if (log.startsWith('ℹ️')) colorClass = 'text-sky-400';
                if (log.startsWith('🚀')) colorClass = 'text-indigo-400 font-bold';
                if (log.startsWith('🎉')) colorClass = 'text-emerald-400 font-bold text-sm border-t border-slate-800 pt-2 mt-2';
                return (
                  <div key={i} className={`py-0.5 leading-relaxed ${colorClass}`}>
                    {log}
                  </div>
                );
              })}
              {testing && (
                <div className="flex items-center gap-1.5 text-slate-500 py-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  Rodando teste...
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all font-sans"
              >
                Fechar
              </button>
              <button
                onClick={runDiagnosticTest}
                disabled={testing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 font-sans"
              >
                Executar Novo Teste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormList;
