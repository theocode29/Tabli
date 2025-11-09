import { writable, derived } from 'svelte/store';
import type { Difficulty, Category, ExerciseFilters } from '../types/exercise.js';

interface FilterState {
  selectedDifficulty: Difficulty | null;
  selectedCategory: Category | null;
  selectedTags: string[];
  durationRange: {
    min: number | null;
    max: number | null;
  };
  showFavoritesOnly: boolean;
  isActive: boolean;
}

const initialState: FilterState = {
  selectedDifficulty: null,
  selectedCategory: null,
  selectedTags: [],
  durationRange: {
    min: null,
    max: null
  },
  showFavoritesOnly: false,
  isActive: false
};

function createFilterStore() {
  const { subscribe, set, update } = writable<FilterState>(initialState);

  return {
    subscribe,
    
    setDifficulty(difficulty: Difficulty | null) {
      update(state => {
        const newState = { ...state, selectedDifficulty: difficulty };
        newState.isActive = isFilterActive(newState);
        return newState;
      });
    },

    setCategory(category: Category | null) {
      update(state => {
        const newState = { ...state, selectedCategory: category };
        newState.isActive = isFilterActive(newState);
        return newState;
      });
    },

    toggleTag(tag: string) {
      update(state => {
        const selectedTags = state.selectedTags.includes(tag)
          ? state.selectedTags.filter(t => t !== tag)
          : [...state.selectedTags, tag];
        
        const newState = { ...state, selectedTags };
        newState.isActive = isFilterActive(newState);
        return newState;
      });
    },

    setTags(tags: string[]) {
      update(state => {
        const newState = { ...state, selectedTags: tags };
        newState.isActive = isFilterActive(newState);
        return newState;
      });
    },

    setDurationRange(min: number | null, max: number | null) {
      update(state => {
        const newState = { 
          ...state, 
          durationRange: { min, max }
        };
        newState.isActive = isFilterActive(newState);
        return newState;
      });
    },

    toggleFavoritesOnly() {
      update(state => {
        const newState = { ...state, showFavoritesOnly: !state.showFavoritesOnly };
        newState.isActive = isFilterActive(newState);
        return newState;
      });
    },

    setFavoritesOnly(showFavoritesOnly: boolean) {
      update(state => {
        const newState = { ...state, showFavoritesOnly };
        newState.isActive = isFilterActive(newState);
        return newState;
      });
    },

    clearFilters() {
      set(initialState);
    },

    reset() {
      set(initialState);
    }
  };
}

// Fonction utilitaire pour déterminer si des filtres sont actifs
function isFilterActive(state: FilterState): boolean {
  return !!(
    state.selectedDifficulty ||
    state.selectedCategory ||
    state.selectedTags.length > 0 ||
    state.durationRange.min !== null ||
    state.durationRange.max !== null ||
    state.showFavoritesOnly
  );
}

export const filterStore = createFilterStore();

// Store dérivé pour obtenir les filtres sous forme d'objet ExerciseFilters
export const activeFilters = derived(
  filterStore,
  ($filterStore): ExerciseFilters => {
    const filters: ExerciseFilters = {};
    
    if ($filterStore.selectedDifficulty) {
      filters.difficulty = $filterStore.selectedDifficulty;
    }
    
    if ($filterStore.selectedCategory) {
      filters.category = $filterStore.selectedCategory;
    }
    
    if ($filterStore.selectedTags.length > 0) {
      filters.tags = $filterStore.selectedTags;
    }
    
    if ($filterStore.durationRange.min !== null || $filterStore.durationRange.max !== null) {
      filters.duration = {
        min: $filterStore.durationRange.min || undefined,
        max: $filterStore.durationRange.max || undefined
      };
    }
    
    if ($filterStore.showFavoritesOnly) {
      filters.isFavorite = true;
    }
    
    return filters;
  }
);

// Store dérivé pour compter le nombre de filtres actifs
export const activeFilterCount = derived(
  filterStore,
  $filterStore => {
    let count = 0;
    
    if ($filterStore.selectedDifficulty) count++;
    if ($filterStore.selectedCategory) count++;
    if ($filterStore.selectedTags.length > 0) count++;
    if ($filterStore.durationRange.min !== null || $filterStore.durationRange.max !== null) count++;
    if ($filterStore.showFavoritesOnly) count++;
    
    return count;
  }
);

// Store dérivé pour vérifier si des filtres sont actifs
export const hasActiveFilters = derived(
  filterStore,
  $filterStore => $filterStore.isActive
);