import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { PipelineStage } from '../types';

export const usePipeline = () => {
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStages = async () => {
        try {
            const data = await storageService.getPipelineStages();

            if (data && data.length > 0) {
                setStages(data as PipelineStage[]);
            } else {
                // Fallback to default stages if DB is empty
                setStages([
                    { id: '1', name: 'Novo Lead', position: 0, color: 'bg-blue-500' },
                    { id: '2', name: 'Em Contato', position: 1, color: 'bg-yellow-500' },
                    { id: '3', name: 'Proposta Enviada', position: 2, color: 'bg-purple-500' },
                    { id: '4', name: 'Negociação', position: 3, color: 'bg-orange-500' },
                    { id: '5', name: 'Ganho', position: 4, color: 'bg-green-500' }
                ]);
            }
        } catch (error) {
            console.error('Error fetching pipeline stages:', error);
            // Fallback to default stages on error (e.g. table doesn't exist yet)
            setStages([
                { id: '1', name: 'Novo Lead', position: 0, color: 'bg-blue-500' },
                { id: '2', name: 'Em Contato', position: 1, color: 'bg-yellow-500' },
                { id: '3', name: 'Proposta Enviada', position: 2, color: 'bg-purple-500' },
                { id: '4', name: 'Negociação', position: 3, color: 'bg-orange-500' },
                { id: '5', name: 'Ganho', position: 4, color: 'bg-green-500' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStages();
    }, []);

    const addStage = async (name: string, color: string) => {
        try {
            const position = stages.length;
            const newStage = { name, position, color };
            const result = await storageService.savePipelineStage(newStage);

            if (!result.success) throw new Error(result.error);

            fetchStages();
        } catch (error) {
            console.error('Error adding pipeline stage:', error);
            throw error; // Propagate error to UI
        }
    };

    const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
        try {
            // Optimistic update
            setStages(stages.map(stage => stage.id === id ? { ...stage, ...updates } : stage));

            const result = await storageService.savePipelineStage({ id, ...updates });

            if (!result.success) {
                // Revert on error
                fetchStages();
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error updating pipeline stage:', error);
        }
    };

    const deleteStage = async (id: string) => {
        try {
            // Optimistic update
            setStages(stages.filter(stage => stage.id !== id));

            await storageService.deletePipelineStage(id);
        } catch (error) {
            console.error('Error deleting pipeline stage:', error);
            fetchStages();
        }
    };

    const reorderStages = async (reorderedStages: PipelineStage[]) => {
        try {
            // Optimistic update
            setStages(reorderedStages);

            // Update each stage's position
            const updates = reorderedStages.map((stage, index) => ({
                id: stage.id,
                position: index
            }));

            for (const update of updates) {
                await storageService.savePipelineStage(update);
            }
        } catch (error) {
            console.error('Error reordering stages:', error);
            fetchStages();
        }
    };

    return {
        stages,
        loading,
        addStage,
        updateStage,
        deleteStage,
        reorderStages,
        fetchStages
    };
};
