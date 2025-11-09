import { writable, derived } from 'svelte/store';
import { triggerDebouncedBackup } from '../backup.js';
import type { Course } from '../types/course.js';
import {
  getAllCourses as dbGetAllCourses,
  createCourse as dbCreateCourse,
  updateCourse as dbUpdateCourse,
  deleteCourse as dbDeleteCourse,
  toggleCourseFavorite as dbToggleCourseFavorite,
  addExerciseToCourse as dbAddExerciseToCourse,
  removeExerciseFromCourse as dbRemoveExerciseFromCourse,
  reorderExercisesInCourse as dbReorderExercisesInCourse
} from '../db/database.js';

interface CourseStoreState {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

const initialState: CourseStoreState = {
  courses: [],
  loading: false,
  error: null
};

function createCourseStore() {
  const { subscribe, set, update } = writable<CourseStoreState>(initialState);

  return {
    subscribe,

    async loadCourses() {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const courses = await dbGetAllCourses();
        update(s => ({ ...s, courses, loading: false }));
      } catch (error) {
        update(s => ({
          ...s,
          loading: false,
          error: error instanceof Error ? error.message : 'Erreur lors du chargement des cours'
        }));
      }
    },

    async createCourse(data: Omit<Course, '_id' | 'createdAt' | 'updatedAt'>) {
      try {
        const newCourse = await dbCreateCourse(data);
        update(s => ({ ...s, courses: [...s.courses, newCourse] }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return newCourse;
      } catch (error) {
        update(s => ({
          ...s,
          error: error instanceof Error ? error.message : 'Erreur lors de la création du cours'
        }));
        throw error;
      }
    },

    async updateCourse(id: string, updates: Partial<Course>) {
      try {
        const updated = await dbUpdateCourse(id, updates);
        update(s => ({
          ...s,
          courses: s.courses.map(c => (c._id === id ? updated : c))
        }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return updated;
      } catch (error) {
        update(s => ({
          ...s,
          error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du cours'
        }));
        throw error;
      }
    },

    async deleteCourse(id: string) {
      try {
        const ok = await dbDeleteCourse(id);
        if (ok) update(s => ({ ...s, courses: s.courses.filter(c => c._id !== id) }));
        if (ok) triggerDebouncedBackup();
        return ok;
      } catch (error) {
        update(s => ({
          ...s,
          error: error instanceof Error ? error.message : 'Erreur lors de la suppression du cours'
        }));
        throw error;
      }
    },

    async toggleFavorite(id: string) {
      try {
        const updated = await dbToggleCourseFavorite(id);
        update(s => ({
          ...s,
          courses: s.courses.map(c => (c._id === id ? updated : c))
        }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return updated;
      } catch (error) {
        update(s => ({
          ...s,
          error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du favori du cours'
        }));
        throw error;
      }
    },

    async addExercise(courseId: string, exerciseId: string) {
      try {
        const updated = await dbAddExerciseToCourse(courseId, exerciseId);
        update(s => ({ ...s, courses: s.courses.map(c => (c._id === courseId ? updated : c)) }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return updated;
      } catch (error) {
        update(s => ({
          ...s,
          error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'exercice au cours'
        }));
        throw error;
      }
    },

    async removeExercise(courseId: string, exerciseId: string) {
      try {
        const updated = await dbRemoveExerciseFromCourse(courseId, exerciseId);
        update(s => ({ ...s, courses: s.courses.map(c => (c._id === courseId ? updated : c)) }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return updated;
      } catch (error) {
        update(s => ({
          ...s,
          error: error instanceof Error ? error.message : 'Erreur lors du retrait de l\'exercice du cours'
        }));
        throw error;
      }
    },

    async reorderExercises(courseId: string, newOrder: string[]) {
      try {
        const updated = await dbReorderExercisesInCourse(courseId, newOrder);
        update(s => ({ ...s, courses: s.courses.map(c => (c._id === courseId ? updated : c)) }));
        // Auto-backup (debounced)
        triggerDebouncedBackup();
        return updated;
      } catch (error) {
        update(s => ({
          ...s,
          error: error instanceof Error ? error.message : 'Erreur lors du réordonnancement des exercices du cours'
        }));
        throw error;
      }
    },

    clearError() { update(s => ({ ...s, error: null })); },
    reset() { set(initialState); }
  };
}

export const courseStore = createCourseStore();

export const favoriteCourses = derived(courseStore, ($courseStore) =>
  $courseStore.courses.filter((c) => c.isFavorite)
);