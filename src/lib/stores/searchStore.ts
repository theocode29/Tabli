import { writable, derived } from 'svelte/store';

interface SearchState {
  query: string;
  isActive: boolean;
  suggestions: string[];
  recentSearches: string[];
}

const initialState: SearchState = {
  query: '',
  isActive: false,
  suggestions: [],
  recentSearches: []
};

function createSearchStore() {
  const { subscribe, set, update } = writable<SearchState>(initialState);

  return {
    subscribe,
    
    setQuery(query: string) {
      update(state => ({ 
        ...state, 
        query,
        isActive: query.length > 0
      }));
    },

    setActive(isActive: boolean) {
      update(state => ({ ...state, isActive }));
    },

    addRecentSearch(query: string) {
      if (!query.trim()) return;
      
      update(state => {
        const filtered = state.recentSearches.filter(s => s !== query);
        return {
          ...state,
          recentSearches: [query, ...filtered].slice(0, 10) // Garder seulement les 10 dernières
        };
      });
    },

    clearRecentSearches() {
      update(state => ({ ...state, recentSearches: [] }));
    },

    setSuggestions(suggestions: string[]) {
      update(state => ({ ...state, suggestions }));
    },

    clear() {
      update(state => ({ 
        ...state, 
        query: '', 
        isActive: false,
        suggestions: []
      }));
    },

    reset() {
      set(initialState);
    }
  };
}

export const searchStore = createSearchStore();

// Store dérivé pour vérifier si une recherche est active
export const isSearching = derived(
  searchStore,
  $searchStore => $searchStore.query.length > 0
);

// Store dérivé pour les suggestions filtrées
export const filteredSuggestions = derived(
  searchStore,
  $searchStore => {
    if (!$searchStore.query) return [];
    
    return $searchStore.suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes($searchStore.query.toLowerCase())
      )
      .slice(0, 5); // Limiter à 5 suggestions
  }
);