import React, { useState } from 'react';
import { PipelineStage } from '../types';
import { usePipeline } from '../hooks/usePipeline';
import {
    X,
    Plus,
    Trash2,
    Check,
    Pencil,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface PipelineEditorProps {
    onClose: () => void;
}

const COLORS = [
    { name: 'Cinza', class: 'bg-slate-500', border: 'border-slate-500' },
    { name: 'Vermelho', class: 'bg-red-500', border: 'border-red-500' },
    { name: 'Laranja', class: 'bg-orange-500', border: 'border-orange-500' },
    { name: 'Âmbar', class: 'bg-amber-500', border: 'border-amber-500' },
    { name: 'Amarelo', class: 'bg-yellow-500', border: 'border-yellow-500' },
    { name: 'Lima', class: 'bg-lime-500', border: 'border-lime-500' },
    { name: 'Verde', class: 'bg-green-500', border: 'border-green-500' },
    { name: 'Esmeralda', class: 'bg-emerald-500', border: 'border-emerald-500' },
    { name: 'Menta', class: 'bg-teal-500', border: 'border-teal-500' },
    { name: 'Ciano', class: 'bg-cyan-500', border: 'border-cyan-500' },
    { name: 'Celeste', class: 'bg-sky-500', border: 'border-sky-500' },
    { name: 'Azul', class: 'bg-blue-500', border: 'border-blue-500' },
    { name: 'Índigo', class: 'bg-indigo-500', border: 'border-indigo-500' },
    { name: 'Violeta', class: 'bg-violet-500', border: 'border-violet-500' },
    { name: 'Roxo', class: 'bg-purple-500', border: 'border-purple-500' },
    { name: 'Fúcsia', class: 'bg-fuchsia-500', border: 'border-fuchsia-500' },
    { name: 'Rosa', class: 'bg-pink-500', border: 'border-pink-500' },
    { name: 'Rosa Escuro', class: 'bg-rose-500', border: 'border-rose-500' }
];

const PipelineEditor: React.FC<PipelineEditorProps> = ({ onClose }) => {
    const { stages, addStage, updateStage, deleteStage, reorderStages } = usePipeline();
    const [newStageName, setNewStageName] = useState('');
    const [newStageColor, setNewStageColor] = useState('bg-blue-500');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const handleAddStage = async () => {
        if (newStageName.trim()) {
            try {
                await addStage(newStageName.trim(), newStageColor);
                setNewStageName('');
            } catch (error: any) {
                console.error(error);
                alert(`Erro ao criar etapa: ${error.message || 'Erro desconhecido'}`);
            }
        }
    };

    const startEditing = (stage: PipelineStage) => {
        setEditingId(stage.id);
        setEditName(stage.name);
        setEditColor(stage.color);
    };

    const saveEdit = (id: string) => {
        updateStage(id, { name: editName, color: editColor });
        setEditingId(null);
    };

    const moveStage = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === stages.length - 1)
        ) return;

        const newStages = [...stages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];

        reorderStages(newStages);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Configurações de Funil (Pipeline)</h2>
                        <p className="text-slate-400 text-xs mt-0.5 font-medium">Ordene, adicione e edite as colunas do seu Kanban</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-650 p-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Add Stage Widget */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Criar Nova Etapa</h3>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                placeholder="Nome da etapa (ex: Negociação Iniciada)"
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                            />
                            
                            <button
                                onClick={handleAddStage}
                                disabled={!newStageName.trim()}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                                Criar Coluna
                            </button>
                        </div>

                        {/* New Stage Color Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cor da Etapa</label>
                            <div className="grid grid-cols-9 gap-1.5 p-2 bg-white border border-slate-200/65 rounded-xl max-w-sm">
                                {COLORS.map(c => (
                                    <button
                                        key={`new-${c.class}`}
                                        type="button"
                                        title={c.name}
                                        onClick={() => setNewStageColor(c.class)}
                                        className={`w-6 h-6 rounded-full ${c.class} transition-all hover:scale-110 flex items-center justify-center`}
                                    >
                                        {newStageColor === c.class && <Check size={12} className="text-white font-bold" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stage List Widget */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Etapas Atuais ({stages.length})</h3>
                        
                        <div className="space-y-2.5">
                            {stages.map((stage, index) => (
                                <div
                                    key={stage.id}
                                    className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors"
                                >
                                    {/* Position reordering */}
                                    <div className="flex flex-col gap-1 text-slate-350 shrink-0">
                                        <button
                                            onClick={() => moveStage(index, 'up')}
                                            disabled={index === 0}
                                            className="hover:text-blue-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            title="Mover para cima"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => moveStage(index, 'down')}
                                            disabled={index === stages.length - 1}
                                            className="hover:text-blue-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            title="Mover para baixo"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    </div>

                                    {/* Edit state panel */}
                                    {editingId === stage.id ? (
                                        <div className="flex-1 flex flex-col gap-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveEdit(stage.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors border border-green-200"
                                                    title="Salvar"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors border"
                                                    title="Cancelar"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            {/* Color grid under input to prevent wrap squeezing */}
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Escolha uma Cor</span>
                                                <div className="grid grid-cols-9 gap-1.5 p-2 bg-slate-50 border rounded-xl max-w-sm">
                                                    {COLORS.map(c => (
                                                        <button
                                                            key={`edit-${c.class}`}
                                                            type="button"
                                                            title={c.name}
                                                            onClick={() => setEditColor(c.class)}
                                                            className={`w-6 h-6 rounded-full ${c.class} transition-all hover:scale-110 flex items-center justify-center`}
                                                        >
                                                            {editColor === c.class && <Check size={12} className="text-white font-bold" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${stage.color}`}></div>
                                            <span className="flex-1 font-bold text-slate-700 text-sm">{stage.name}</span>
                                            
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditing(stage)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Renomear / Mudar Cor"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Excluir esta etapa permanentemente? Leads nesta etapa ficarão órfãos de coluna.')) {
                                                            deleteStage(stage.id);
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir Coluna"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="py-2.5 px-6 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors shadow-sm"
                    >
                        Concluir e Salvar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PipelineEditor;
