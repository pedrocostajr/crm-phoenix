import React, { useState } from 'react';
import { PipelineStage } from '../types';
import { usePipeline } from '../hooks/usePipeline';
import {
    X,
    Plus,
    Trash2,
    GripVertical,
    Check,
    Pencil,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface PipelineEditorProps {
    onClose: () => void;
}

const COLORS = [
    'bg-slate-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
];

const PipelineEditor: React.FC<PipelineEditorProps> = ({ onClose }) => {
    const { stages, addStage, updateStage, deleteStage, reorderStages } = usePipeline();
    const [newStageName, setNewStageName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const handleAddStage = () => {
        if (newStageName.trim()) {
            addStage(newStageName.trim(), 'bg-slate-500');
            setNewStageName('');
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">Editar Pipeline</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">Adicionar Nova Etapa</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                placeholder="Nome da etapa (ex: Aguardando Retorno)"
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                            />
                            <button
                                onClick={handleAddStage}
                                disabled={!newStageName.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Adicionar
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {stages.map((stage, index) => (
                            <div
                                key={stage.id}
                                className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors"
                            >
                                <div className="flex flex-col gap-1 text-slate-300">
                                    <button
                                        onClick={() => moveStage(index, 'up')}
                                        disabled={index === 0}
                                        className="hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => moveStage(index, 'down')}
                                        disabled={index === stages.length - 1}
                                        className="hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>

                                {editingId === stage.id ? (
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                            autoFocus
                                        />
                                        <div className="flex gap-1">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setEditColor(c)}
                                                    className={`w-6 h-6 rounded-full ${c} ${editColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => saveEdit(stage.id)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                                        <span className="flex-1 font-medium text-slate-700">{stage.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(stage)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Tem certeza que deseja excluir esta etapa?')) {
                                                        deleteStage(stage.id);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors"
                    >
                        Concluir Edição
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PipelineEditor;
