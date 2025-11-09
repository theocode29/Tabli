<script lang="ts">
  import { filterStore, activeFilterCount } from '../stores/filterStore.js';
  import { allTags } from '../stores/exerciseStore.js';
  import type { Difficulty, Category } from '../types/exercise.js';
  
  let showPanel = false;
  let showTagsDropdown = false;
  
  const difficulties: Difficulty[] = ['Débutant', 'Intermédiaire', 'Avancé'];
  const categories: Category[] = [
    'Échauffement',
    'Improvisation', 
    'Expression corporelle',
    'Voix et diction',
    'Concentration',
    'Émotion',
    'Personnage',
    'Groupe',
    'Solo',
    'Relaxation'
  ];
  
  function togglePanel() {
    showPanel = !showPanel;
  }
  
  function toggleTag(tag: string) {
    filterStore.toggleTag(tag);
  }
  
  function handleDurationChange(type: 'min' | 'max', value: string) {
    const numValue = value ? parseInt(value) : null;
    
    if (type === 'min') {
      filterStore.setDurationRange(numValue, $filterStore.durationRange.max);
    } else {
      filterStore.setDurationRange($filterStore.durationRange.min, numValue);
    }
  }
  
  function clearAllFilters() {
    filterStore.clearFilters();
  }
  
  // Fermer le panel quand on clique à l'extérieur
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.filter-panel-container')) {
      showPanel = false;
      showTagsDropdown = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="filter-panel-container">
  <button 
    class="filter-toggle"
    class:active={showPanel || $activeFilterCount > 0}
    on:click={togglePanel}
    type="button"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
    Filtres
    {#if $activeFilterCount > 0}
      <span class="filter-count">{$activeFilterCount}</span>
    {/if}
  </button>
  
  {#if showPanel}
    <div class="filter-panel">
      <div class="filter-header">
        <h3>Filtres</h3>
        {#if $activeFilterCount > 0}
          <button class="clear-all" on:click={clearAllFilters}>
            Tout effacer
          </button>
        {/if}
      </div>
      
      <div class="filter-content">
        <!-- Difficulté -->
        <div class="filter-section">
          <label class="filter-label">Difficulté</label>
          <div class="filter-options">
            {#each difficulties as difficulty}
              <button
                class="filter-option"
                class:selected={$filterStore.selectedDifficulty === difficulty}
                on:click={() => filterStore.setDifficulty(
                  $filterStore.selectedDifficulty === difficulty ? null : difficulty
                )}
                type="button"
              >
                {difficulty}
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Catégorie -->
        <div class="filter-section">
          <label class="filter-label">Catégorie</label>
          <div class="filter-options">
            {#each categories as category}
              <button
                class="filter-option"
                class:selected={$filterStore.selectedCategory === category}
                on:click={() => filterStore.setCategory(
                  $filterStore.selectedCategory === category ? null : category
                )}
                type="button"
              >
                {category}
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Durée -->
        <div class="filter-section">
          <label class="filter-label">Durée (minutes)</label>
          <div class="duration-inputs">
            <div class="duration-input-group">
              <label for="min-duration">Min</label>
              <input
                id="min-duration"
                type="number"
                min="1"
                max="180"
                placeholder="0"
                value={$filterStore.durationRange.min || ''}
                on:input={(e) => handleDurationChange('min', e.currentTarget.value)}
              />
            </div>
            <span class="duration-separator">-</span>
            <div class="duration-input-group">
              <label for="max-duration">Max</label>
              <input
                id="max-duration"
                type="number"
                min="1"
                max="180"
                placeholder="∞"
                value={$filterStore.durationRange.max || ''}
                on:input={(e) => handleDurationChange('max', e.currentTarget.value)}
              />
            </div>
          </div>
        </div>
        
        <!-- Tags -->
        <div class="filter-section">
          <div class="tags-header">
            <label class="filter-label">Tags</label>
            <button 
              class="tags-toggle"
              on:click={() => showTagsDropdown = !showTagsDropdown}
              type="button"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
                class:rotated={showTagsDropdown}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          
          {#if $filterStore.selectedTags.length > 0}
            <div class="selected-tags">
              {#each $filterStore.selectedTags as tag}
                <span class="selected-tag">
                  {tag}
                  <button 
                    class="remove-tag"
                    on:click={() => toggleTag(tag)}
                    type="button"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </span>
              {/each}
            </div>
          {/if}
          
          {#if showTagsDropdown && $allTags.length > 0}
            <div class="tags-dropdown">
              {#each $allTags as tag}
                <button
                  class="tag-option"
                  class:selected={$filterStore.selectedTags.includes(tag)}
                  on:click={() => toggleTag(tag)}
                  type="button"
                >
                  <div class="tag-checkbox">
                    {#if $filterStore.selectedTags.includes(tag)}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    {/if}
                  </div>
                  <span class="tag-name">{tag}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Favoris -->
        <div class="filter-section">
          <label class="filter-checkbox">
            <input
              type="checkbox"
              checked={$filterStore.showFavoritesOnly}
              on:change={() => filterStore.toggleFavoritesOnly()}
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">Favoris uniquement</span>
          </label>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .filter-panel-container {
    position: relative;
  }
  
  .filter-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--color-bg-card);
    box-shadow: var(--shadow-subtle);
    color: var(--color-gray-700);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .filter-toggle:hover {
    background-color: var(--color-bg-hover);
  }
  
  .filter-toggle.active {
    background-color: var(--color-bg-hover);
    color: var(--color-gray-800);
  }
  
  .filter-count {
    background-color: var(--color-blue);
    color: var(--color-white);
    font-size: var(--font-size-xs);
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    min-width: 18px;
    text-align: center;
  }
  
  .filter-panel {
    position: absolute;
    top: 100%;
    right: 0;
    width: 320px;
    background-color: var(--color-white);
    border: none;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-light);
    z-index: 1000;
    margin-top: 4px;
  }
  
  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    /* Pas de ligne de séparation */
  }
  
  .filter-header h3 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-gray-800);
    margin: 0;
  }
  
  .clear-all {
    font-size: var(--font-size-sm);
    color: var(--color-gray-500);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }
  
  .clear-all:hover {
    color: var(--color-gray-700);
    background-color: var(--color-gray-100);
  }
  
  .filter-content {
    padding: var(--spacing-md);
    max-height: 400px;
    overflow-y: auto;
  }
  
  .filter-section {
    margin-bottom: var(--spacing-lg);
  }
  
  .filter-section:last-child {
    margin-bottom: 0;
  }
  
  .filter-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-gray-700);
    margin-bottom: var(--spacing-sm);
  }
  
  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .filter-option {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--color-bg-card);
    color: var(--color-gray-700);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .filter-option:hover {
    background-color: var(--color-bg-hover);
  }
  
  .filter-option.selected {
    background-color: var(--color-blue);
    color: var(--color-white);
  }
  
  .duration-inputs {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .duration-input-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .duration-input-group label {
    font-size: var(--font-size-xs);
    color: var(--color-gray-500);
  }
  
  .duration-input-group input {
    width: 80px;
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    border-radius: var(--radius-sm);
    background-color: var(--color-bg-card);
    font-size: var(--font-size-sm);
  }
  
  .duration-input-group input:focus {
    outline: none;
    background-color: var(--color-bg-hover);
  }
  
  .duration-separator {
    color: var(--color-gray-400);
    margin-top: 16px;
  }
  
  .tags-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }
  
  .tags-toggle {
    background: none;
    border: none;
    color: var(--color-gray-500);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }
  
  .tags-toggle:hover {
    color: var(--color-gray-700);
    background-color: var(--color-gray-100);
  }
  
  .tags-toggle svg {
    transition: transform 0.2s ease;
  }
  
  .tags-toggle svg.rotated {
    transform: rotate(180deg);
  }
  
  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
  }
  
  .selected-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background-color: var(--color-blue-light);
    color: var(--color-blue-dark);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
  }
  
  .remove-tag {
    background: none;
    border: none;
    color: var(--color-blue-dark);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease;
  }
  
  .remove-tag:hover {
    background-color: var(--color-blue);
    color: var(--color-white);
  }
  
  .tags-dropdown {
    max-height: 150px;
    overflow-y: auto;
    border: none;
    border-radius: var(--radius-sm);
    background-color: var(--color-white);
    box-shadow: var(--shadow-subtle);
  }
  
  .tag-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .tag-option:hover {
    background-color: var(--color-gray-50);
  }
  
  .tag-checkbox {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-white);
    box-shadow: var(--shadow-subtle);
  }
  
  .tag-option.selected .tag-checkbox {
    background-color: var(--color-blue);
    color: var(--color-white);
  }
  
  .tag-name {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
  }
  
  .filter-checkbox {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;
  }
  
  .filter-checkbox input {
    display: none;
  }
  
  .checkbox-custom {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-white);
    transition: all 0.2s ease;
    box-shadow: var(--shadow-subtle);
  }
  
  .filter-checkbox input:checked + .checkbox-custom {
    background-color: var(--color-blue);
  }
  
  .filter-checkbox input:checked + .checkbox-custom::after {
    content: '✓';
    color: var(--color-white);
    font-size: 10px;
    font-weight: bold;
  }
  
  .checkbox-label {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .filter-panel {
      width: 280px;
      right: -20px;
    }
  }
</style>