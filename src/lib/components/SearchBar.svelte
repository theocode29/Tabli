<script lang="ts">
  import { searchStore, filteredSuggestions } from '../stores/searchStore.js';
  import { allTags } from '../stores/exerciseStore.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let inputElement: HTMLInputElement;
  let showSuggestions = false;
  let selectedSuggestionIndex = -1;
  
  // Réactivité pour les suggestions basées sur les tags existants
  $: {
    if ($searchStore.query) {
      const tagSuggestions = $allTags.filter(tag => 
        tag.toLowerCase().includes($searchStore.query.toLowerCase())
      );
      searchStore.setSuggestions(tagSuggestions);
    } else {
      searchStore.setSuggestions([]);
    }
  }
  
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchStore.setQuery(target.value);
    showSuggestions = target.value.length > 0;
    selectedSuggestionIndex = -1;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (!showSuggestions || $filteredSuggestions.length === 0) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedSuggestionIndex = Math.min(
          selectedSuggestionIndex + 1,
          $filteredSuggestions.length - 1
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion($filteredSuggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
        
      case 'Escape':
        showSuggestions = false;
        selectedSuggestionIndex = -1;
        inputElement.blur();
        break;
    }
  }
  
  function selectSuggestion(suggestion: string) {
    searchStore.setQuery(suggestion);
    showSuggestions = false;
    selectedSuggestionIndex = -1;
    handleSearch();
  }
  
  function handleSearch() {
    if ($searchStore.query.trim()) {
      searchStore.addRecentSearch($searchStore.query);
      dispatch('search', $searchStore.query);
    }
    showSuggestions = false;
  }
  
  function clearSearch() {
    searchStore.clear();
    showSuggestions = false;
    inputElement.focus();
  }
  
  function handleFocus() {
    showSuggestions = $searchStore.query.length > 0;
  }
  
  function handleBlur() {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      showSuggestions = false;
      selectedSuggestionIndex = -1;
    }, 150);
  }
</script>

<div class="search-container">
  <div class="search-input-wrapper">
    <div class="search-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </div>
    
    <input
      bind:this={inputElement}
      type="text"
      placeholder="Rechercher des exercices..."
      class="search-input"
      value={$searchStore.query}
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:focus={handleFocus}
      on:blur={handleBlur}
    />
    
    {#if $searchStore.query}
      <button class="clear-button" on:click={clearSearch} type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    {/if}
  </div>
  
  <!-- Suggestions dropdown -->
  {#if showSuggestions && $filteredSuggestions.length > 0}
    <div class="suggestions-dropdown">
      <div class="suggestions-header">
        <span class="suggestions-title">Tags suggérés</span>
      </div>
      
      {#each $filteredSuggestions as suggestion, index}
        <button
          class="suggestion-item"
          class:selected={index === selectedSuggestionIndex}
          on:click={() => selectSuggestion(suggestion)}
          type="button"
        >
          <div class="suggestion-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <span class="suggestion-text">{suggestion}</span>
        </button>
      {/each}
      
      {#if $searchStore.recentSearches.length > 0 && !$searchStore.query}
        <div class="suggestions-divider"></div>
        <div class="suggestions-header">
          <span class="suggestions-title">Recherches récentes</span>
          <button class="clear-recent" on:click={() => searchStore.clearRecentSearches()}>
            Effacer
          </button>
        </div>
        
        {#each $searchStore.recentSearches.slice(0, 3) as recent}
          <button
            class="suggestion-item recent"
            on:click={() => selectSuggestion(recent)}
            type="button"
          >
            <div class="suggestion-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
            </div>
            <span class="suggestion-text">{recent}</span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    width: 100%;
    max-width: 400px;
  }
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .search-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    padding-left: 40px;
    padding-right: 36px;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    background-color: var(--color-bg-card);
    transition: all 0.2s ease;
    box-shadow: var(--shadow-subtle);
  }
  
  .search-input:focus {
    outline: none;
    box-shadow: var(--shadow-md);
  }
  
  .search-input::placeholder {
    color: var(--color-gray-400);
  }
  
  .search-icon {
    position: absolute;
    left: var(--spacing-sm);
    color: var(--color-gray-400);
    pointer-events: none;
    z-index: 1;
  }
  
  .clear-button {
    position: absolute;
    right: var(--spacing-sm);
    padding: 2px;
    border: none;
    background: none;
    color: var(--color-gray-400);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
    z-index: 1;
  }
  
  .clear-button:hover {
    color: var(--color-gray-600);
    background-color: var(--color-gray-100);
  }
  
  .suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--color-white);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    margin-top: 4px;
  }
  
  .suggestions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-bottom: none;
  }
  
  .suggestions-title {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-gray-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .clear-recent {
    font-size: var(--font-size-xs);
    color: var(--color-gray-400);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--radius-sm);
    transition: color 0.2s ease;
  }
  
  .clear-recent:hover {
    color: var(--color-gray-600);
  }
  
  .suggestion-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--spacing-sm);
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;
    gap: var(--spacing-xs);
  }
  
  .suggestion-item:hover,
  .suggestion-item.selected {
    background-color: var(--color-gray-50);
  }
  
  .suggestion-item.selected {
    background-color: var(--color-gray-100);
  }
  
  .suggestion-icon {
    color: var(--color-gray-400);
    flex-shrink: 0;
  }
  
  .suggestion-text {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
  }
  
  .suggestion-item.recent .suggestion-icon {
    color: var(--color-gray-300);
  }
  
  .suggestions-divider {
    height: var(--spacing-xs);
    background-color: transparent; /* Séparation par espacement uniquement */
    margin: var(--spacing-xs) 0;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .search-container {
      max-width: none;
    }
  }
</style>