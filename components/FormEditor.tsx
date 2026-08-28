import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Copy, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Monitor, 
  Smartphone, 
  Settings, 
  Palette, 
  Zap, 
  Link2, 
  HelpCircle, 
  Check, 
  RefreshCw, 
  Upload, 
  PlusCircle, 
  Trash, 
  X,
  Shuffle,
  ChevronDown
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Form, QuestionBlock, BlockType, ConditionalRule, User, PipelineStage } from '../types';
import { usePipeline } from '../hooks/usePipeline';

interface FormEditorProps {
  formId: string;
  onBack: () => void;
}

const PRESET_THEMES = [
  {
    name: 'Modern Blue',
    primaryColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    buttonColor: '#3b82f6',
    buttonTextColor: '#ffffff',
    borderRadius: '0.75rem',
    fontFamily: 'Inter'
  },
  {
    name: 'Elegant Purple',
    primaryColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
    textColor: '#1e1b4b',
    buttonColor: '#8b5cf6',
    buttonTextColor: '#ffffff',
    borderRadius: '0.5rem',
    fontFamily: 'Inter'
  },
  {
    name: 'Forest Minimal',
    primaryColor: '#059669',
    backgroundColor: '#f0fdf4',
    textColor: '#064e3b',
    buttonColor: '#059669',
    buttonTextColor: '#ffffff',
    borderRadius: '0.375rem',
    fontFamily: 'Inter'
  },
  {
    name: 'Sleek Dark',
    primaryColor: '#3b82f6',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    buttonColor: '#3b82f6',
    buttonTextColor: '#ffffff',
    borderRadius: '1rem',
    fontFamily: 'Inter'
  },
  {
    name: 'Sunset Orange',
    primaryColor: '#f97316',
    backgroundColor: '#fff7ed',
    textColor: '#431407',
    buttonColor: '#f97316',
    buttonTextColor: '#ffffff',
    borderRadius: '0.75rem',
    fontFamily: 'Inter'
  }
];

const BLOCK_TYPES: { type: BlockType; label: string; desc: string }[] = [
  { type: 'welcome', label: 'Tela de Boas-vindas', desc: 'Introdução do formulário' },
  { type: 'name', label: 'Nome Completo', desc: 'Campo mapeado para nome' },
  { type: 'email', label: 'E-mail', desc: 'Campo mapeado para e-mail' },
  { type: 'phone', label: 'Telefone / WhatsApp', desc: 'Mapeia telefone' },
  { type: 'short_text', label: 'Texto Curto', desc: 'Respostas de linha única' },
  { type: 'long_text', label: 'Texto Longo', desc: 'Respostas de parágrafo' },
  { type: 'number', label: 'Número', desc: 'Apenas caracteres numéricos' },
  { type: 'currency', label: 'Moeda (BRL)', desc: 'Valores monetários' },
  { type: 'date', label: 'Data', desc: 'Seletor de calendário' },
  { type: 'time', label: 'Horário', desc: 'Entrada de hora/minuto' },
  { type: 'address', label: 'Endereço', desc: 'Logradouro, número, etc.' },
  { type: 'cpf_cnpj', label: 'CPF / CNPJ', desc: 'Documento formatado' },
  { type: 'url', label: 'Website / URL', desc: 'Links e endereços web' },
  { type: 'single_choice', label: 'Escolha Única', desc: 'Múltiplas opções (uma resposta)' },
  { type: 'multiple_choice', label: 'Múltipla Escolha', desc: 'Múltiplas opções (várias respostas)' },
  { type: 'dropdown', label: 'Lista Suspensa', desc: 'Menu select clássico' },
  { type: 'yes_no', label: 'Sim ou Não', desc: 'Botões booleanos rápidos' },
  { type: 'scale', label: 'Escala Numérica', desc: 'Avaliação de 1 a 10' },
  { type: 'stars', label: 'Avaliação por Estrelas', desc: 'Classificação visual' },
  { type: 'nps', label: 'NPS', desc: 'Métrica de fidelidade 0-10' },
  { type: 'file_upload', label: 'Upload de Arquivo', desc: 'Upload de comprovantes/anexos' },
  { type: 'terms_consent', label: 'Termos e Aceite', desc: 'Consentimento de dados e LGPD' },
  { type: 'schedule', label: 'Agendamento de Reunião', desc: 'Calendário interativo de reunião / videochamada' },
  { type: 'hidden', label: 'Campo Oculto', desc: 'Parâmetro passado via URL' },
  { type: 'thank_you', label: 'Tela de Agradecimento', desc: 'Encerramento com mensagem' }
];

const CRM_FIELDS = [
  { value: '', label: 'Não Mapear (Campo Avulso)' },
  { value: 'name', label: 'Nome do Lead' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone / WhatsApp' },
  { value: 'company', label: 'Empresa' },
  { value: 'estimatedValue', label: 'Valor Estimado' },
  { value: 'observations', label: 'Observações' }
];

const FormEditor: React.FC<FormEditorProps> = ({ formId, onBack }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [rightPanelTab, setRightPanelTab] = useState<'block' | 'theme' | 'settings' | 'integrations'>('block');

  // CRM details for integrations
  const [crmUsers, setCrmUsers] = useState<User[]>([]);
  const { stages: crmStages } = usePipeline();

  // Temporary local states for adding webhooks/options
  const [newOptionText, setNewOptionText] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await storageService.getForm(formId);
      if (data) {
        setForm(data);
        if (data.blocks && data.blocks.length > 0) {
          setSelectedBlockId(data.blocks[0].id);
        }
      }
      const users = await storageService.getUsers();
      setCrmUsers(users);
    } catch (error) {
      console.error('Error loading form in editor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
  }, [formId]);

  const activeBlock = form?.blocks.find(b => b.id === selectedBlockId) || null;

  const handleSave = async (updatedForm = form) => {
    if (!updatedForm) return;
    setSaving(true);
    const res = await storageService.saveForm(updatedForm);
    setSaving(false);
    if (!res.success) {
      alert('Erro ao salvar formulário: ' + res.error);
    }
  };

  const handleUpdateSettings = (key: keyof typeof form.settings, value: any) => {
    if (!form) return;
    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      settings: {
        ...form.settings,
        [key]: value
      }
    };
    setForm(updatedForm);
    handleSave(updatedForm);
  };

  const handleUpdateTheme = (key: keyof typeof form.theme, value: any) => {
    if (!form) return;
    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      theme: {
        ...form.theme,
        [key]: value
      }
    };
    setForm(updatedForm);
    handleSave(updatedForm);
  };

  const handleApplyPresetTheme = (preset: typeof PRESET_THEMES[0]) => {
    if (!form) return;
    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      theme: {
        ...form.theme,
        ...preset
      }
    };
    setForm(updatedForm);
    handleSave(updatedForm);
  };

  const handleUpdateAutomation = (key: keyof typeof form.automations, value: any) => {
    if (!form) return;
    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      automations: {
        ...form.automations,
        [key]: value
      }
    };
    setForm(updatedForm);
    handleSave(updatedForm);
  };

  // Block handlers
  const handleUpdateBlock = (blockId: string, updates: Partial<QuestionBlock>) => {
    if (!form) return;
    const updatedBlocks = form.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, ...updates };
      }
      return b;
    });
    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      blocks: updatedBlocks
    };
    setForm(updatedForm);
    handleSave(updatedForm);
  };

  const handleAddBlock = (type: BlockType) => {
    if (!form) return;
    const blockCount = form.blocks.filter(b => b.type === type).length;
    const internalId = `${type}_${blockCount + 1}`;
    const newBlock: QuestionBlock = {
      id: `block_${Date.now()}`,
      type,
      title: type === 'welcome' ? 'Boas-vindas!' : type === 'thank_you' ? 'Obrigado!' : type === 'schedule' ? 'Agora agende um horário no calendário abaixo' : 'Título da Pergunta...',
      description: type === 'schedule' ? 'Selecione a melhor data e horário para nossa reunião' : undefined,
      required: type !== 'welcome' && type !== 'thank_you',
      internalId,
      crmField: ['name', 'email', 'phone', 'company', 'estimatedValue', 'observations'].includes(type) ? type : ''
    };

    if (type === 'schedule') {
      newBlock.scheduleConfig = {
        meetingTitle: 'Bate papo sobre Tráfego Pago',
        durationMinutes: 60,
        availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        availableDays: [1, 2, 3, 4, 5]
      };
    }

    // Pre-populate selection choices if choice blocks
    if (['single_choice', 'multiple_choice', 'dropdown', 'button_options'].includes(type)) {
      newBlock.options = [
        { id: `opt_1_${Date.now()}`, label: 'Opção 1', value: 'opcao_1' },
        { id: `opt_2_${Date.now()}`, label: 'Opção 2', value: 'opcao_2' }
      ];
    }

    const updatedBlocks = [...form.blocks];
    // Insert before thank_you screen if one exists, otherwise at the end
    const thankYouIdx = updatedBlocks.findIndex(b => b.type === 'thank_you');
    if (thankYouIdx !== -1) {
      updatedBlocks.splice(thankYouIdx, 0, newBlock);
    } else {
      updatedBlocks.push(newBlock);
    }

    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      blocks: updatedBlocks
    };
    setForm(updatedForm);
    setSelectedBlockId(newBlock.id);
    setRightPanelTab('block');
    handleSave(updatedForm);
  };

  const handleDuplicateBlock = (block: QuestionBlock) => {
    if (!form) return;
    const idx = form.blocks.findIndex(b => b.id === block.id);
    if (idx === -1) return;

    const duplicated: QuestionBlock = {
      ...block,
      id: `block_${Date.now()}`,
      internalId: `${block.internalId}_copia`,
      title: `${block.title} (Cópia)`
    };

    const updatedBlocks = [...form.blocks];
    updatedBlocks.splice(idx + 1, 0, duplicated);

    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      blocks: updatedBlocks
    };
    setForm(updatedForm);
    setSelectedBlockId(duplicated.id);
    handleSave(updatedForm);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!form) return;
    if (form.blocks.length <= 1) {
      alert('O formulário deve ter pelo menos uma etapa.');
      return;
    }
    const updatedBlocks = form.blocks.filter(b => b.id !== blockId);
    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      blocks: updatedBlocks
    };
    setForm(updatedForm);
    
    // Select another block
    if (selectedBlockId === blockId) {
      setSelectedBlockId(updatedBlocks[0]?.id || null);
    }
    handleSave(updatedForm);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!form) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= form.blocks.length) return;

    const updatedBlocks = [...form.blocks];
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[targetIdx];
    updatedBlocks[targetIdx] = temp;

    const updatedForm = {
      ...form,
      updatedAt: new Date().toISOString(),
      blocks: updatedBlocks
    };
    setForm(updatedForm);
    handleSave(updatedForm);
  };

  // Option handlers (for multi choice questions)
  const handleAddOption = () => {
    if (!activeBlock || !newOptionText.trim()) return;
    const cleanText = newOptionText.trim();
    const value = cleanText.toLowerCase().replace(/\s+/g, '_');
    const newOpt = { id: `opt_${Date.now()}`, label: cleanText, value };
    
    const currentOptions = activeBlock.options || [];
    handleUpdateBlock(activeBlock.id, {
      options: [...currentOptions, newOpt]
    });
    setNewOptionText('');
  };

  const handleRemoveOption = (optId: string) => {
    if (!activeBlock || !activeBlock.options) return;
    handleUpdateBlock(activeBlock.id, {
      options: activeBlock.options.filter(o => o.id !== optId)
    });
  };

  // Webhook handlers
  const handleAddWebhook = () => {
    if (!form || !webhookUrl.trim()) return;
    const newWh = {
      id: `wh_${Date.now()}`,
      url: webhookUrl.trim(),
      secretKey: webhookSecret.trim(),
      headers: { 'Content-Type': 'application/json' }
    };
    
    const updatedForm = {
      ...form,
      webhooks: [...(form.webhooks || []), newWh]
    };
    setForm(updatedForm);
    setWebhookUrl('');
    setWebhookSecret('');
    handleSave(updatedForm);
  };

  const handleRemoveWebhook = (whId: string) => {
    if (!form) return;
    const updatedForm = {
      ...form,
      webhooks: form.webhooks.filter(w => w.id !== whId)
    };
    setForm(updatedForm);
    handleSave(updatedForm);
  };

  // Conditional rules handlers
  const handleAddRule = () => {
    if (!activeBlock) return;
    const newRule: ConditionalRule = {
      questionId: activeBlock.id,
      operator: 'equals',
      value: '',
      action: 'go_to_question',
      actionTarget: ''
    };
    const currentRules = activeBlock.rules || [];
    handleUpdateBlock(activeBlock.id, {
      rules: [...currentRules, newRule]
    });
  };

  const handleUpdateRule = (idx: number, key: keyof ConditionalRule, value: any) => {
    if (!activeBlock || !activeBlock.rules) return;
    const updatedRules = activeBlock.rules.map((r, i) => {
      if (i === idx) {
        return { ...r, [key]: value };
      }
      return r;
    });
    handleUpdateBlock(activeBlock.id, { rules: updatedRules });
  };

  const handleRemoveRule = (idx: number) => {
    if (!activeBlock || !activeBlock.rules) return;
    handleUpdateBlock(activeBlock.id, {
      rules: activeBlock.rules.filter((_, i) => i !== idx)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!form) return <div>Formulário não encontrado.</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -m-4 md:-m-8 overflow-hidden bg-slate-100">
      
      {/* Editor Sub-Header / Controls */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <input
              type="text"
              value={form.settings.internalName}
              onChange={(e) => handleUpdateSettings('internalName', e.target.value)}
              className="text-lg font-black text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-slate-50 px-2 py-0.5 rounded outline-none font-sans max-w-xs md:max-w-md transition-all"
            />
            <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider px-2">Link: /f/{form.settings.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Select */}
          <select
            value={form.settings.status}
            onChange={(e) => handleUpdateSettings('status', e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="paused">Pausado</option>
          </select>

          {saving ? (
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 px-3">
              <RefreshCw className="animate-spin text-blue-500" size={14} /> Salvando...
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 px-3">
              <Check className="text-green-500" size={14} /> Salvo no banco
            </span>
          )}
        </div>
      </div>

      {/* Editor Body Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Steps & Questions List */}
        <aside className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Perguntas e Telas</h3>
            
            {/* Quick Add Dropdown or Button */}
            <div className="relative group">
              <button
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Plus size={14} /> Adicionar
              </button>
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-100 rounded-xl shadow-xl z-20 hidden group-hover:block p-1 text-left max-h-96 overflow-y-auto">
                <div className="px-3 py-1.5 text-xxs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">Selecione o tipo de bloco</div>
                {BLOCK_TYPES.map(bt => (
                  <button
                    key={bt.type}
                    onClick={() => handleAddBlock(bt.type)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-slate-50/30">
            {form.blocks.map((block, idx) => {
              const isSelected = selectedBlockId === block.id;
              return (
                <div
                  key={block.id}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setRightPanelTab('block');
                  }}
                  className={`group p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${
                    isSelected 
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-sm' 
                      : 'bg-white hover:bg-slate-50/50 border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xxs font-bold text-slate-400 bg-slate-100 group-hover:bg-white border rounded p-1 w-6 h-6 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate leading-normal">
                        {block.title || 'Pergunta sem título...'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {BLOCK_TYPES.find(b => b.type === block.type)?.label || block.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 'up'); }}
                      disabled={idx === 0}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveBlock(idx, 'down'); }}
                      disabled={idx === form.blocks.length - 1}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(block); }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                      title="Duplicar"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: Real-Time Preview Area */}
        <main className="flex-1 flex flex-col overflow-hidden p-6 relative items-center justify-center">
          {/* Preview Controls (Floating header) */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
            <span className="bg-slate-900/80 text-white font-bold text-xxs uppercase tracking-wider py-1.5 px-3 rounded-full backdrop-blur shadow-sm">
              Pré-visualização ao vivo
            </span>
            <div className="flex gap-1 bg-white border p-1 rounded-xl shadow-sm pointer-events-auto">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg transition-colors ${previewDevice === 'desktop' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="Desktop"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg transition-colors ${previewDevice === 'mobile' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title="Celular"
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>

          {/* Device Mockup Wrapper */}
          <div className={`transition-all duration-300 flex items-center justify-center ${
            previewDevice === 'mobile' 
              ? 'w-[360px] h-[640px] border-8 border-slate-800 rounded-[32px] bg-white shadow-2xl relative overflow-hidden' 
              : 'w-full h-full max-w-4xl max-h-[500px] border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden'
          }`} style={{ backgroundColor: form.theme.backgroundColor }}>
            
            {/* Live preview of active block */}
            {activeBlock ? (
              <div className="w-full h-full flex flex-col justify-between p-8 text-left overflow-y-auto" style={{ fontFamily: form.theme.fontFamily, color: form.theme.textColor }}>
                
                {/* Logo or Header */}
                {form.theme.logoUrl && (
                  <div className="mb-4">
                    <img src={form.theme.logoUrl} alt="Logo" className="max-h-12 object-contain" />
                  </div>
                )}

                {/* Question Block Body */}
                <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-8 space-y-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
                      {activeBlock.title || 'Título da Pergunta'}
                      {activeBlock.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {activeBlock.description && (
                      <p className="text-sm mt-2 opacity-70 leading-relaxed font-medium">
                        {activeBlock.description}
                      </p>
                    )}
                  </div>

                  {/* Input Rendering depending on block type */}
                  <div className="w-full py-2">
                    {activeBlock.type === 'welcome' && (
                      <button 
                        className="py-3 px-6 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
                        style={{ backgroundColor: form.theme.buttonColor, color: form.theme.buttonTextColor, borderRadius: form.theme.borderRadius }}
                      >
                        Começar
                      </button>
                    )}

                    {activeBlock.type === 'thank_you' && (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <Check className="p-3 bg-green-100 text-green-600 rounded-full mb-3" size={48} />
                        <p className="text-xs opacity-50 font-bold">Respostas enviadas com sucesso.</p>
                      </div>
                    )}

                    {['name', 'short_text', 'url'].includes(activeBlock.type) && (
                      <input
                        type="text"
                        disabled
                        placeholder={activeBlock.placeholder || 'Digite aqui...'}
                        className="w-full px-4 py-3 bg-transparent border-b border-slate-300 font-medium text-lg outline-none cursor-not-allowed"
                        style={{ borderBottomColor: form.theme.primaryColor }}
                      />
                    )}

                    {activeBlock.type === 'email' && (
                      <input
                        type="email"
                        disabled
                        placeholder={activeBlock.placeholder || 'nome@exemplo.com'}
                        className="w-full px-4 py-3 bg-transparent border-b border-slate-300 font-medium text-lg outline-none cursor-not-allowed"
                        style={{ borderBottomColor: form.theme.primaryColor }}
                      />
                    )}

                    {activeBlock.type === 'phone' && (
                      <input
                        type="tel"
                        disabled
                        placeholder={activeBlock.placeholder || '(00) 00000-0000'}
                        className="w-full px-4 py-3 bg-transparent border-b border-slate-300 font-medium text-lg outline-none cursor-not-allowed"
                        style={{ borderBottomColor: form.theme.primaryColor }}
                      />
                    )}

                    {activeBlock.type === 'long_text' && (
                      <textarea
                        disabled
                        rows={2}
                        placeholder={activeBlock.placeholder || 'Escreva sua resposta...'}
                        className="w-full px-4 py-3 bg-transparent border-b border-slate-300 font-medium text-lg outline-none resize-none cursor-not-allowed"
                        style={{ borderBottomColor: form.theme.primaryColor }}
                      />
                    )}

                    {['number', 'currency'].includes(activeBlock.type) && (
                      <input
                        type="text"
                        disabled
                        placeholder={activeBlock.placeholder || '0'}
                        className="w-full px-4 py-3 bg-transparent border-b border-slate-300 font-medium text-lg outline-none cursor-not-allowed"
                        style={{ borderBottomColor: form.theme.primaryColor }}
                      />
                    )}

                    {['date', 'time'].includes(activeBlock.type) && (
                      <input
                        type="text"
                        disabled
                        placeholder={activeBlock.placeholder || (activeBlock.type === 'date' ? 'DD/MM/AAAA' : '00:00')}
                        className="w-full px-4 py-3 bg-transparent border-b border-slate-300 font-medium text-lg outline-none cursor-not-allowed"
                        style={{ borderBottomColor: form.theme.primaryColor }}
                      />
                    )}

                    {activeBlock.type === 'cpf_cnpj' && (
                      <input
                        type="text"
                        disabled
                        placeholder={activeBlock.placeholder || '000.000.000-00'}
                        className="w-full px-4 py-3 bg-transparent border-b border-slate-300 font-medium text-lg outline-none cursor-not-allowed"
                        style={{ borderBottomColor: form.theme.primaryColor }}
                      />
                    )}

                    {activeBlock.type === 'yes_no' && (
                      <div className="flex gap-4">
                        {['Sim', 'Não'].map((opt, i) => (
                          <button
                            key={i}
                            className="flex-1 py-3 px-6 text-sm font-bold border border-slate-200 rounded-xl transition-all shadow-sm flex items-center justify-between"
                            style={{ borderRadius: form.theme.borderRadius }}
                          >
                            <span>{opt}</span>
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border px-1.5 py-0.5 rounded">{i === 0 ? 'S' : 'N'}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {['single_choice', 'multiple_choice', 'button_options'].includes(activeBlock.type) && (
                      <div className="space-y-2">
                        {(activeBlock.options || []).map((opt, i) => (
                          <button
                            key={opt.id}
                            className="w-full py-3 px-4 text-sm font-bold border border-slate-200 rounded-xl shadow-sm text-left flex items-center justify-between bg-white/70"
                            style={{ borderRadius: form.theme.borderRadius }}
                          >
                            <span>{opt.label}</span>
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border px-1.5 py-0.5 rounded">{i + 1}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {activeBlock.type === 'dropdown' && (
                      <div className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-400 font-medium flex justify-between items-center shadow-sm cursor-not-allowed" style={{ borderRadius: form.theme.borderRadius }}>
                        <span>Selecione uma opção...</span>
                        <ChevronDown size={16} />
                      </div>
                    )}

                    {activeBlock.type === 'scale' && (
                      <div className="flex flex-wrap gap-1.5 justify-center py-2">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                          <button
                            key={num}
                            className="w-9 h-9 text-xs font-bold border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 shadow-sm"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeBlock.type === 'stars' && (
                      <div className="flex gap-2 justify-center py-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="text-slate-300 text-3xl">★</span>
                        ))}
                      </div>
                    )}

                    {activeBlock.type === 'nps' && (
                      <div className="space-y-1">
                        <div className="flex gap-1 justify-between py-2 overflow-x-auto">
                          {Array.from({ length: 11 }, (_, i) => i).map(num => (
                            <button
                              key={num}
                              className="w-8 h-8 text-xs font-bold border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 shadow-sm shrink-0"
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider px-1">
                          <span>Pouco provável</span>
                          <span>Muito provável</span>
                        </div>
                      </div>
                    )}

                    {activeBlock.type === 'file_upload' && (
                      <div className="w-full border-2 border-dashed border-slate-300 p-6 rounded-2xl flex flex-col items-center justify-center bg-white/50 cursor-not-allowed" style={{ borderRadius: form.theme.borderRadius }}>
                        <Upload className="text-slate-400 mb-2" size={24} />
                        <span className="text-xs text-slate-500 font-bold">Enviar arquivo</span>
                        <span className="text-[10px] text-slate-400 mt-1">Limite: 5MB</span>
                      </div>
                    )}

                    {activeBlock.type === 'terms_consent' && (
                      <div className="flex items-start gap-3 py-2">
                        <input type="checkbox" disabled className="mt-1 cursor-not-allowed" />
                        <p className="text-xs opacity-75 font-medium leading-relaxed">
                          {form.settings.lgpdConsentText || 'Eu concordo com a coleta e processamento dos meus dados para fins comerciais de acordo com as diretrizes da LGPD.'}
                        </p>
                      </div>
                    )}

                    {activeBlock.type === 'hidden' && (
                      <div className="p-4 bg-slate-100 text-slate-500 text-xs border rounded-xl text-center border-slate-200 font-bold font-mono">
                        Campo Oculto: {activeBlock.internalId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer branding */}
                {form.theme.showBranding && (
                  <div className="text-center opacity-40 py-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider select-none shrink-0">
                    <span>Feito com</span>
                    <span className="text-blue-500">Phoenix CRM</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 font-medium p-8 text-center text-sm">
                Selecione ou crie uma pergunta na lateral esquerda.
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Settings / Visual / Customization Drawer */}
        <aside className="w-96 border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
          {/* Drawer Tab Headers */}
          <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
            <button
              onClick={() => setRightPanelTab('block')}
              disabled={!activeBlock}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'block' 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-700 disabled:opacity-30'
              }`}
              title="Configurações da Pergunta"
            >
              <Zap size={14} /> Bloco
            </button>
            <button
              onClick={() => setRightPanelTab('theme')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'theme' 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
              title="Aparência Visual"
            >
              <Palette size={14} /> Tema
            </button>
            <button
              onClick={() => setRightPanelTab('settings')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'settings' 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
              title="Configurações do Formulário"
            >
              <Settings size={14} /> Ajustes
            </button>
            <button
              onClick={() => setRightPanelTab('integrations')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'integrations' 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
              title="Integração CRM & Webhooks"
            >
              <Link2 size={14} /> CRM
            </button>
          </div>

          {/* Drawer scroll content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* TAB 1: ACTIVE BLOCK SETTINGS */}
            {rightPanelTab === 'block' && activeBlock && (
              <div className="space-y-5">
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight pb-2 border-b">Configurações da Pergunta</h4>
                
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título da Pergunta</label>
                  <input
                    type="text"
                    value={activeBlock.title}
                    onChange={(e) => handleUpdateBlock(activeBlock.id, { title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição / Texto de Apoio</label>
                  <textarea
                    rows={2}
                    value={activeBlock.description || ''}
                    onChange={(e) => handleUpdateBlock(activeBlock.id, { description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 resize-none"
                    placeholder="Texto secundário para instruir o respondente..."
                  />
                </div>

                {/* Internal ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Identificador Interno
                    <HelpCircle size={12} className="text-slate-400" title="Usado na lógica condicional e webhooks" />
                  </label>
                  <input
                    type="text"
                    value={activeBlock.internalId}
                    onChange={(e) => handleUpdateBlock(activeBlock.id, { internalId: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-mono text-slate-700"
                  />
                </div>

                {/* Required switch */}
                {activeBlock.type !== 'welcome' && activeBlock.type !== 'thank_you' && (
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-50 border rounded-xl border-slate-150">
                    <span className="text-xs font-bold text-slate-600">Resposta Obrigatória?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeBlock.required}
                        onChange={(e) => handleUpdateBlock(activeBlock.id, { required: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}

                {/* Helper / Placeholder text (Only for standard text inputs) */}
                {['name', 'email', 'phone', 'short_text', 'long_text', 'number', 'currency', 'date', 'time', 'address', 'cpf_cnpj', 'url'].includes(activeBlock.type) && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placeholder (Dica no campo)</label>
                    <input
                      type="text"
                      value={activeBlock.placeholder || ''}
                      onChange={(e) => handleUpdateBlock(activeBlock.id, { placeholder: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                    />
                  </div>
                )}

                {/* Schedule Config Controls */}
                {activeBlock.type === 'schedule' && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Reunião</label>
                      <input
                        type="text"
                        value={activeBlock.scheduleConfig?.meetingTitle || 'Bate papo sobre Tráfego Pago'}
                        onChange={(e) => handleUpdateBlock(activeBlock.id, {
                          scheduleConfig: { ...(activeBlock.scheduleConfig || {}), meetingTitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium text-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duração da Reunião</label>
                      <select
                        value={activeBlock.scheduleConfig?.durationMinutes || 60}
                        onChange={(e) => handleUpdateBlock(activeBlock.id, {
                          scheduleConfig: { ...(activeBlock.scheduleConfig || {}), durationMinutes: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium text-slate-800"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>60 minutos (1 hora)</option>
                        <option value={90}>90 minutos (1h 30m)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Choices editor for choice blocks */}
                {['single_choice', 'multiple_choice', 'dropdown', 'button_options'].includes(activeBlock.type) && (
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opções de Resposta</label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(activeBlock.options || []).map(opt => (
                        <div key={opt.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const updatedOptions = (activeBlock.options || []).map(o => {
                                if (o.id === opt.id) {
                                  return { ...o, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                                }
                                return o;
                              });
                              handleUpdateBlock(activeBlock.id, { options: updatedOptions });
                            }}
                            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/10 font-medium text-slate-700"
                          />
                          <button
                            onClick={() => handleRemoveOption(opt.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                            title="Remover opção"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nova opção..."
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/10 font-medium text-slate-700"
                      />
                      <button
                        onClick={handleAddOption}
                        className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* CRM Field Mapping */}
                {activeBlock.type !== 'welcome' && activeBlock.type !== 'thank_you' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Mapeamento no CRM
                      <HelpCircle size={12} className="text-slate-400" title="Quando respondida, essa resposta preencherá automaticamente esse campo do Lead no CRM." />
                    </label>
                    <select
                      value={activeBlock.crmField || ''}
                      onChange={(e) => handleUpdateBlock(activeBlock.id, { crmField: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10"
                    >
                      {CRM_FIELDS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conditional Rules / Logical Jumps */}
                {activeBlock.type !== 'welcome' && activeBlock.type !== 'thank_you' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        Lógica Condicional / Pulos
                        <HelpCircle size={12} className="text-slate-400" title="Defina regras de pulo baseadas na resposta dada nesta pergunta." />
                      </label>
                      <button
                        onClick={handleAddRule}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        + Regra
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(activeBlock.rules || []).map((rule, rIdx) => (
                        <div key={rIdx} className="p-3 bg-slate-50 border rounded-xl space-y-2 text-xs relative group">
                          <button
                            onClick={() => handleRemoveRule(rIdx)}
                            className="absolute right-2 top-2 p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remover Regra"
                          >
                            <X size={12} />
                          </button>
                          
                          {/* Rule Header */}
                          <div className="font-bold text-slate-500 uppercase tracking-tight text-[9px] pb-1 border-b">Se a resposta...</div>
                          
                          {/* Condition row: Operator and Value */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <select
                              value={rule.operator}
                              onChange={(e) => handleUpdateRule(rIdx, 'operator', e.target.value)}
                              className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xxs font-medium"
                            >
                              <option value="equals">For igual a</option>
                              <option value="not_equals">Diferente de</option>
                              <option value="contains">Contém</option>
                              <option value="not_contains">Não contém</option>
                              <option value="greater_than">Maior que</option>
                              <option value="less_than">Menor que</option>
                              <option value="is_filled">Preenchido</option>
                              <option value="is_empty">Não preenchido</option>
                            </select>
                            
                            {rule.operator !== 'is_filled' && rule.operator !== 'is_empty' && (
                              <input
                                type="text"
                                placeholder="Valor..."
                                value={rule.value}
                                onChange={(e) => handleUpdateRule(rIdx, 'value', e.target.value)}
                                className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xxs font-medium text-slate-700 outline-none"
                              />
                            )}
                          </div>

                          {/* Action row: Target */}
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Então...</div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <select
                                value={rule.action}
                                onChange={(e) => handleUpdateRule(rIdx, 'action', e.target.value)}
                                className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xxs font-medium"
                              >
                                <option value="go_to_question">Ir para pergunta</option>
                                <option value="go_to_thank_you">Ir para agradecimento</option>
                                <option value="end_form">Encerrar formulário</option>
                                <option value="redirect_url">Redirecionar URL</option>
                                <option value="add_tag">Adicionar tag ao lead</option>
                                <option value="change_stage">Mudar funil/etapa</option>
                                <option value="mark_qualified">Qualificar lead</option>
                                <option value="mark_disqualified">Desqualificar lead</option>
                              </select>

                              {rule.action === 'go_to_question' && (
                                <select
                                  value={rule.actionTarget || ''}
                                  onChange={(e) => handleUpdateRule(rIdx, 'actionTarget', e.target.value)}
                                  className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xxs font-medium"
                                >
                                  <option value="">Selecione...</option>
                                  {form.blocks.filter(b => b.id !== activeBlock.id).map((b, bIdx) => (
                                    <option key={b.id} value={b.id}>Q{bIdx+1}: {b.title.substring(0, 15)}...</option>
                                  ))}
                                </select>
                              )}

                              {rule.action === 'redirect_url' && (
                                <input
                                  type="text"
                                  placeholder="https://..."
                                  value={rule.actionTarget || ''}
                                  onChange={(e) => handleUpdateRule(rIdx, 'actionTarget', e.target.value)}
                                  className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xxs font-medium outline-none"
                                />
                              )}

                              {rule.action === 'add_tag' && (
                                <input
                                  type="text"
                                  placeholder="Tag..."
                                  value={rule.actionTarget || ''}
                                  onChange={(e) => handleUpdateRule(rIdx, 'actionTarget', e.target.value)}
                                  className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xxs font-medium outline-none"
                                />
                              )}

                              {rule.action === 'change_stage' && (
                                <select
                                  value={rule.actionTarget || ''}
                                  onChange={(e) => handleUpdateRule(rIdx, 'actionTarget', e.target.value)}
                                  className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xxs font-medium"
                                >
                                  <option value="">Selecione...</option>
                                  {crmStages.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(activeBlock.rules || []).length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center font-medium py-1.5">Sem regras de fluxo condicional.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: VISUAL STYLE & THEMING */}
            {rightPanelTab === 'theme' && (
              <div className="space-y-5">
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight pb-2 border-b">Aparência e Temas</h4>
                
                {/* Presets Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paletas Prontas (Temas)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_THEMES.map((theme, i) => (
                      <button
                        key={i}
                        onClick={() => handleApplyPresetTheme(theme)}
                        className="p-3 border border-slate-200 rounded-xl text-left hover:border-blue-400 transition-all bg-white hover:bg-slate-50 shadow-sm flex items-center justify-between"
                      >
                        <span className="text-xxs font-bold text-slate-700">{theme.name}</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: theme.primaryColor }}></div>
                          <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: theme.backgroundColor }}></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors customizer */}
                <div className="space-y-3.5 pt-2 border-t">
                  <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Estilos de Cores</h5>
                  
                  {/* Primary Color */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Cor Principal (Detalhes)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.theme.primaryColor}
                        onChange={(e) => handleUpdateTheme('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.theme.primaryColor}
                        onChange={(e) => handleUpdateTheme('primaryColor', e.target.value)}
                        className="w-16 px-1.5 py-1 bg-slate-50 border rounded text-[10px] text-slate-600 font-mono text-center"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Cor de Fundo da Tela</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.theme.backgroundColor}
                        onChange={(e) => handleUpdateTheme('backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.theme.backgroundColor}
                        onChange={(e) => handleUpdateTheme('backgroundColor', e.target.value)}
                        className="w-16 px-1.5 py-1 bg-slate-50 border rounded text-[10px] text-slate-600 font-mono text-center"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Cor dos Textos</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.theme.textColor}
                        onChange={(e) => handleUpdateTheme('textColor', e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.theme.textColor}
                        onChange={(e) => handleUpdateTheme('textColor', e.target.value)}
                        className="w-16 px-1.5 py-1 bg-slate-50 border rounded text-[10px] text-slate-600 font-mono text-center"
                      />
                    </div>
                  </div>

                  {/* Button Color */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Cor dos Botões</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={form.theme.buttonColor}
                        onChange={(e) => handleUpdateTheme('buttonColor', e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.theme.buttonColor}
                        onChange={(e) => handleUpdateTheme('buttonColor', e.target.value)}
                        className="w-16 px-1.5 py-1 bg-slate-50 border rounded text-[10px] text-slate-600 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography and Borders */}
                <div className="space-y-3 pt-2 border-t">
                  <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Tipografia e Estrutura</h5>
                  
                  {/* Font Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Família de Fonte</label>
                    <select
                      value={form.theme.fontFamily}
                      onChange={(e) => handleUpdateTheme('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none"
                    >
                      <option value="Inter">Inter (Padrão)</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Outfit">Outfit</option>
                      <option value="monospace">Mono</option>
                    </select>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Arredondamento das Bordas</label>
                    <select
                      value={form.theme.borderRadius}
                      onChange={(e) => handleUpdateTheme('borderRadius', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none"
                    >
                      <option value="0px">Reto (0px)</option>
                      <option value="0.25rem">Pequeno (4px)</option>
                      <option value="0.5rem">Médio (8px)</option>
                      <option value="0.75rem">Arredondado (12px)</option>
                      <option value="1rem">Largo (16px)</option>
                      <option value="9999px">Pílula (Total)</option>
                    </select>
                  </div>

                  {/* Logo URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL do Logo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={form.theme.logoUrl || ''}
                      onChange={(e) => handleUpdateTheme('logoUrl', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-600"
                    />
                  </div>

                  {/* Branding switch */}
                  <div className="flex justify-between items-center py-2 px-3 bg-slate-50 border rounded-xl border-slate-150">
                    <span className="text-xs font-bold text-slate-600">Exibir marca do CRM?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.theme.showBranding}
                        onChange={(e) => handleUpdateTheme('showBranding', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FORM SETTINGS */}
            {rightPanelTab === 'settings' && (
              <div className="space-y-5">
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight pb-2 border-b">Configurações Gerais</h4>
                
                {/* Public Title */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título Público do Formulário</label>
                  <input
                    type="text"
                    value={form.settings.publicTitle}
                    onChange={(e) => handleUpdateSettings('publicTitle', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium text-slate-700"
                  />
                </div>

                {/* Public Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição Pública (SEO)</label>
                  <textarea
                    rows={2}
                    value={form.settings.description || ''}
                    onChange={(e) => handleUpdateSettings('description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium text-slate-600 resize-none"
                    placeholder="Descrição para indexação..."
                  />
                </div>

                {/* Custom Slug */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slug da URL (/f/slug-do-form)</label>
                  <input
                    type="text"
                    value={form.settings.slug}
                    onChange={(e) => handleUpdateSettings('slug', e.target.value.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 outline-none"
                  />
                </div>

                {/* Redirect URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Redirecionar após Envio (Opcional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.settings.redirectUrl || ''}
                    onChange={(e) => handleUpdateSettings('redirectUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-600"
                  />
                </div>

                {/* Ended message */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mensagem de Encerramento</label>
                  <textarea
                    rows={2}
                    value={form.settings.endedMessage || ''}
                    onChange={(e) => handleUpdateSettings('endedMessage', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium text-slate-600 resize-none"
                    placeholder="Ex: Este formulário está inativo de momento."
                  />
                </div>

                {/* LGPD Text */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Termo de Consentimento LGPD</label>
                  <textarea
                    rows={2}
                    value={form.settings.lgpdConsentText || ''}
                    onChange={(e) => handleUpdateSettings('lgpdConsentText', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-medium text-slate-600 resize-none"
                    placeholder="Texto de aceite de termos..."
                  />
                </div>

                {/* Meta Pixel ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID do Pixel da Meta (Facebook)</label>
                  <input
                    type="text"
                    placeholder="Ex: 1234567890"
                    value={form.settings.metaPixelId || ''}
                    onChange={(e) => handleUpdateSettings('metaPixelId', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-600"
                  />
                </div>

                {/* Google Analytics ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID do Google Analytics (G-XXXXXX)</label>
                  <input
                    type="text"
                    placeholder="Ex: G-XXXXXXXXXX"
                    value={form.settings.googleAnalyticsId || ''}
                    onChange={(e) => handleUpdateSettings('googleAnalyticsId', e.target.value.toUpperCase().trim())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-600"
                  />
                </div>

                {/* Single response option */}
                <div className="flex justify-between items-center py-2 px-3 bg-slate-50 border rounded-xl border-slate-150 text-xs">
                  <span className="font-bold text-slate-600">Apenas uma resposta por pessoa?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.settings.oneResponsePerPerson}
                      onChange={(e) => handleUpdateSettings('oneResponsePerPerson', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: CRM INTEGRATION AND WEBHOOKS */}
            {rightPanelTab === 'integrations' && (
              <div className="space-y-5">
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight pb-2 border-b">Configurações de Leads</h4>
                
                {/* Auto Lead Creation toggle */}
                <div className="flex justify-between items-center py-2 px-3 bg-slate-50 border rounded-xl border-slate-150 text-xs">
                  <span className="font-bold text-slate-600">Salvar respondentes como Lead?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.automations.createLead}
                      onChange={(e) => handleUpdateAutomation('createLead', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Pipeline Stage Select */}
                {form.automations.createLead && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Etapa do Funil de Destino</label>
                      <select
                        value={form.automations.pipelineStage || ''}
                        onChange={(e) => handleUpdateAutomation('pipelineStage', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10"
                      >
                        <option value="">Novo Lead (Padrão)</option>
                        {crmStages.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Responsible User */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Membro Responsável pelo Lead</label>
                      <select
                        value={form.automations.responsibleUser || ''}
                        onChange={(e) => handleUpdateAutomation('responsibleUser', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10"
                      >
                        <option value="">Sistema (Distribuição normal)</option>
                        {crmUsers.map(u => (
                          <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    {/* Tags auto assignments */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        Tags Associadas aos Leads (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: form, comercial, site"
                        value={form.automations.addTags.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                          handleUpdateAutomation('addTags', tags);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-600 font-medium"
                      />
                    </div>
                  </>
                )}

                {/* OUTGOING WEBHOOKS */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Disparos de Webhook</h4>
                  
                  {/* Webhooks list */}
                  <div className="space-y-2">
                    {(form.webhooks || []).map(wh => (
                      <div key={wh.id} className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center font-medium text-slate-700">
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-xxs font-mono">{wh.url}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Assinatura ativa</p>
                        </div>
                        <button
                          onClick={() => handleRemoveWebhook(wh.id)}
                          className="text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors shrink-0"
                          title="Remover Webhook"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                    {(form.webhooks || []).length === 0 && (
                      <p className="text-xxs text-slate-400 text-center font-medium py-1.5">Sem webhooks cadastrados para este formulário.</p>
                    )}
                  </div>

                  {/* Add Webhook Form */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adicionar Novo Webhook</p>
                    <input
                      type="text"
                      placeholder="URL de Destino (https://...)"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xxs outline-none text-slate-600 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Chave Secreta de Assinatura (Opcional)"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xxs outline-none text-slate-600 font-medium"
                    />
                    <button
                      onClick={handleAddWebhook}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xxs transition-colors active:scale-95 shadow"
                    >
                      Cadastrar URL
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FormEditor;
