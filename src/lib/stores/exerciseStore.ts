import { writable, derived } from 'svelte/store';
import { triggerDebouncedBackup } from '../backup.js';
import type { Exercise, ExerciseStats } from '../types/exercise.js';
import {
  getAllExercises as dbGetAllExercises,
  createExercise as dbCreateExercise,
  updateExercise as dbUpdateExercise,
  deleteExercise as dbDeleteExercise,
  toggleFavorite as dbToggleFavorite,
  markAsUsed as dbMarkAsUsed,
  getStats as dbGetStats,
  exportData as dbExportData,
  importData as dbImportData
} from '../db/database.js';

interface ExerciseStoreState {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  stats: ExerciseStats | null;
}

const initialState: ExerciseStoreState = {
  exercises: [],
  loading: false,
  error: null,
  stats: null
};

function createExerciseStore() {
  const { subscribe, set, update } = writable<ExerciseStoreState>(initialState);

  return {
    subscribe,
    
    // Actions
    async loadExercises() {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const exercises = await dbGetAllExercises();
        update(state => ({ 
          ...state, 
          exercises, 
          loading: false 
        }));
      } catch (error) {
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des exercices' 
        }));
      }
    },

    async createExercise(exerciseData: Omit<Exercise, '_id' | 'createdAt' | 'updatedAt'>) {
      try {
        const newExercise = await dbCreateExercise(exerciseData);
        update(state => ({
          ...state,
          exercises: [...state.exercises, newExercise]
        }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return newExercise;
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'exercice' 
        }));
        throw error;
      }
    },

    async updateExercise(id: string, updates: Partial<Exercise>) {
      try {
        const updatedExercise = await dbUpdateExercise(id, updates);
        update(state => ({
          ...state,
          exercises: state.exercises.map(ex => 
            ex._id === id ? updatedExercise : ex
          )
        }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return updatedExercise;
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'exercice' 
        }));
        throw error;
      }
    },

    async deleteExercise(id: string) {
      try {
        const success = await dbDeleteExercise(id);
        if (success) {
          update(state => ({
            ...state,
            exercises: state.exercises.filter(ex => ex._id !== id)
          }));
          // Auto-backup (debounced)
          triggerDebouncedBackup();
        }
        return success;
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'exercice' 
        }));
        throw error;
      }
    },

    async toggleFavorite(id: string) {
      try {
        const updatedExercise = await dbToggleFavorite(id);
        update(state => ({
          ...state,
          exercises: state.exercises.map(ex => 
            ex._id === id ? updatedExercise : ex
          )
        }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return updatedExercise;
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour des favoris' 
        }));
        throw error;
      }
    },

    async markAsUsed(id: string) {
      try {
        await dbMarkAsUsed(id);
        const updatedExercise = await dbUpdateExercise(id, {});
        update(state => ({
          ...state,
          exercises: state.exercises.map(ex => 
            ex._id === id ? updatedExercise : ex
          )
        }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'utilisation' 
        }));
      }
    },

    async loadStats() {
      try {
        const stats = await dbGetStats();
        update(state => ({ ...state, stats }));
        return stats;
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques' 
        }));
      }
    },

    async exportData() {
      try {
        return await dbExportData();
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors de l\'export des données' 
        }));
        throw error;
      }
    },

    async importData(exercises: Exercise[]) {
      try {
        await dbImportData(exercises);
        await this.loadExercises();
      } catch (error) {
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Erreur lors de l\'import des données' 
        }));
        throw error;
      }
    },

    clearError() {
      update(state => ({ ...state, error: null }));
    },

    reset() {
      set(initialState);
    }
  };
}

export const exerciseStore = createExerciseStore();

// Stores dérivés pour des données calculées
export const favoriteExercises = derived(
  exerciseStore,
  $exerciseStore => $exerciseStore.exercises.filter(ex => ex.isFavorite)
);

export const exercisesByCategory = derived(
  exerciseStore,
  $exerciseStore => {
    const grouped: Record<string, Exercise[]> = {};
    $exerciseStore.exercises.forEach(exercise => {
      if (!grouped[exercise.category]) {
        grouped[exercise.category] = [];
      }
      grouped[exercise.category].push(exercise);
    });
    return grouped;
  }
);

export const allTags = derived(
  exerciseStore,
  $exerciseStore => {
    const tagSet = new Set<string>();
    $exerciseStore.exercises.forEach(exercise => {
      exercise.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }
);

export const recentlyUsedExercises = derived(
  exerciseStore,
  $exerciseStore => $exerciseStore.exercises
    .filter(ex => ex.lastUsed)
    .sort((a, b) => {
      const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10)
);