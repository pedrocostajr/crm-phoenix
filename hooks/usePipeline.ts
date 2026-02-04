import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PipelineStage } from '../types';

export const usePipeline = () => {
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStages = async () => {
        try {
            const { data, error } = await supabase
                .from('pipeline_stages')
                .select('*')
                .order('position', { ascending: true });

            if (error) throw error;

            if (data) {
                setStages(data);
            }
        } catch (error) {
            console.error('Error fetching pipeline stages:', error);
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
            const { data, error } = await supabase
                .from('pipeline_stages')
                .insert([{ name, position, color }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setStages([...stages, data]);
            }
        } catch (error) {
            console.error('Error adding pipeline stage:', error);
        }
    };

    const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
        try {
            // Optimistic update
            setStages(stages.map(stage => stage.id === id ? { ...stage, ...updates } : stage));

            const { error } = await supabase
                .from('pipeline_stages')
                .update(updates)
                .eq('id', id);

            if (error) {
                // Revert on error
                fetchStages();
                throw error;
            }
        } catch (error) {
            console.error('Error updating pipeline stage:', error);
        }
    };

    const deleteStage = async (id: string) => {
        try {
            // Optimistic update
            setStages(stages.filter(stage => stage.id !== id));

            const { error } = await supabase
                .from('pipeline_stages')
                .delete()
                .eq('id', id);

            if (error) {
                fetchStages();
                throw error;
            }
        } catch (error) {
            console.error('Error deleting pipeline stage:', error);
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
                await supabase
                    .from('pipeline_stages')
                    .update({ position: update.position })
                    .eq('id', update.id);
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
