import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { storageService } from '../services/storage';
import { PipelineStage } from '../types';

export const usePipeline = () => {
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stagesRef = collection(db, 'pipeline_stages');
        const q = query(stagesRef, orderBy('position', 'asc'));

        let isSeeding = false;

        // Real-time synchronization of stages list across all instances of the hook
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
                const fetchedStages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PipelineStage[];
                setStages(fetchedStages);
            } else if (!isSeeding) {
                // Seeding: If Firestore is empty, save the 5 default stages to the database
                isSeeding = true;
                const defaultStages = [
                    { name: 'Novo Lead', position: 0, color: 'bg-blue-500' },
                    { name: 'Em Contato', position: 1, color: 'bg-yellow-500' },
                    { name: 'Proposta Enviada', position: 2, color: 'bg-purple-500' },
                    { name: 'Negociação', position: 3, color: 'bg-orange-500' },
                    { name: 'Ganho', position: 4, color: 'bg-green-500' }
                ];
                
                try {
                    for (const ds of defaultStages) {
                        await storageService.savePipelineStage(ds);
                    }
                } catch (error) {
                    console.error('Failed to seed default pipeline stages:', error);
                }
            }
            setLoading(false);
        }, (error) => {
            console.error('Error in pipeline stages listener:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addStage = async (name: string, color: string) => {
        try {
            const position = stages.length;
            const newStage = { name, position, color };
            const result = await storageService.savePipelineStage(newStage);
            if (!result.success) throw new Error(result.error);
        } catch (error) {
            console.error('Error adding pipeline stage:', error);
            throw error;
        }
    };

    const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
        try {
            const result = await storageService.savePipelineStage({ id, ...updates });
            if (!result.success) throw new Error(result.error);
        } catch (error) {
            console.error('Error updating pipeline stage:', error);
        }
    };

    const deleteStage = async (id: string) => {
        try {
            await storageService.deletePipelineStage(id);
        } catch (error) {
            console.error('Error deleting pipeline stage:', error);
        }
    };

    const reorderStages = async (reorderedStages: PipelineStage[]) => {
        try {
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
        }
    };

    return {
        stages,
        loading,
        addStage,
        updateStage,
        deleteStage,
        reorderStages
    };
};
