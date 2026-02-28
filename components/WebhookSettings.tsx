import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import {
    Settings,
    RefreshCw,
    Save,
    ArrowRight,
    Info,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface WebhookSettingsProps {
    onClose: () => void;
}

const WebhookSettings: React.FC<WebhookSettingsProps> = ({ onClose }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({ mappings: {}, lastPayload: null });
    const [availableFields, setAvailableFields] = useState<string[]>([]);

    const crmFields = [
        { id: 'name', label: 'Nome do Lead', required: true },
        { id: 'email', label: 'E-mail', required: true },
        { id: 'phone', label: 'Telefone/WhatsApp', required: false },
        { id: 'company', label: 'Empresa', required: false },
        { id: 'estimated_value', label: 'Valor Estimado', required: false },
        { id: 'origin', label: 'Origem (Onde o Lead veio)', required: false },
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await storageService.getWebhookSettings();
            setSettings(data || { mappings: {}, lastPayload: null });

            if (data && data.lastPayload) {
                setAvailableFields(extractPaths(data.lastPayload));
            }
        } catch (error) {
            console.error('Error in WebhookSettings fetchData:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper to extract nested paths from an object for the mapping dropdown
    const extractPaths = (obj: any, prefix = ''): string[] => {
        if (!obj || typeof obj !== 'object') return [];

        let paths: string[] = [];
        try {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const path = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        paths = [...paths, ...extractPaths(obj[key], path)];
                    } else {
                        paths.push(path);
                    }
                }
            }
        } catch (e) {
            console.error('Error extracting paths:', e);
        }
        return paths;
    };

    const handleMappingChange = (crmField: string, externalPath: string) => {
        setSettings({
            ...settings,
            mappings: {
                ...settings.mappings,
                [crmField]: externalPath
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await storageService.saveWebhookSettings(settings);
        setSaving(false);
        if (result.success) {
            alert('Configurações salvas com sucesso!');
        } else {
            alert('Erro ao salvar: ' + result.error);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl shadow-xl flex items-center gap-3">
                    <RefreshCw className="animate-spin text-blue-600" />
                    <span className="font-bold text-slate-700">Carregando configurações...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Integração de Webhook</h2>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">Configure como os dados do seu formulário entram no CRM</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg">
                        <RefreshCw size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* URL Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4 items-start">
                        <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                            <Info size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-blue-900 text-sm mb-1">Seu Link de Integração</h4>
                            <p className="text-blue-800/70 text-xs mb-3">Cole este link no seu sistema de formulários (LeadForm, etc):</p>
                            <div className="flex gap-2">
                                <code className="bg-white px-3 py-2 rounded-xl border border-blue-200 text-blue-700 font-mono text-xs flex-1 truncate">
                                    {window.location.origin}/api/webhook
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhook`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    Copiar Link
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Last Payload Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <RefreshCw size={16} className="text-slate-400" />
                                    Último Teste Recebido
                                </h3>
                                <button
                                    onClick={fetchData}
                                    className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
                                >
                                    Atualizar
                                </button>
                            </div>

                            {settings.lastPayload ? (
                                <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden border border-slate-800">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">JSON Recebido</span>
                                        <span className="text-[10px] text-slate-500">
                                            {settings.lastReceived ? new Date(settings.lastReceived).toLocaleString() : 'Sem data'}
                                        </span>
                                    </div>
                                    <pre className="text-blue-400 font-mono text-xs overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700">
                                        {JSON.stringify(settings.lastPayload, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3">
                                    <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                        <AlertCircle size={24} />
                                    </div>
                                    <p className="text-slate-400 text-xs font-medium">Nenhum teste recebido ainda.<br />Envie seu formulário para ver os campos aqui.</p>
                                </div>
                            )}
                        </div>

                        {/* Mapping Section */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <ArrowRight size={16} className="text-slate-400" />
                                Mapeamento de Campos
                            </h3>

                            <div className="space-y-3">
                                {crmFields.map((field) => (
                                    <div key={field.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                {field.label}
                                                {field.required && <span className="text-red-500">*</span>}
                                            </label>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Campo CRM</span>
                                        </div>

                                        <select
                                            value={settings.mappings[field.id] || ''}
                                            onChange={(e) => handleMappingChange(field.id, e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="">-- Selecione o campo do seu formulário --</option>
                                            {availableFields.map(path => (
                                                <option key={path} value={path}>{path}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200/50 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WebhookSettings;
