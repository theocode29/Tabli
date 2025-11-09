<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Exercise } from '../types/exercise.js';
  
  export let exercise: Exercise;
  // Par défaut, aucune action visible sur la carte (accessibles en vue détaillée)
  export let showActions = false;
  
  const dispatch = createEventDispatcher<{
    edit: Exercise;
    delete: Exercise;
    favorite: Exercise;
    use: Exercise;
    view: Exercise;
  }>();
  
  function formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`;
  }
  
  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Débutant':
        return 'var(--color-green)';
      case 'Intermédiaire':
        return 'var(--color-orange)';
      case 'Avancé':
        return 'var(--color-red)';
      default:
        return 'var(--color-gray-500)';
    }
  }
  
  // Deprecated: emojis remplacés par une icône SVG neutre dans le markup.
  
  function handleEdit() {
    dispatch('edit', exercise);
  }
  
  function handleDelete() {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'exercice "${exercise.title}" ?`)) {
      dispatch('delete', exercise);
    }
  }
  
  function handleFavorite() {
    dispatch('favorite', exercise);
  }
  
  function handleUse() {
    dispatch('use', exercise);
  }

  function openView() {
    dispatch('view', exercise);
  }
</script>

<div
  class="exercise-card"
  class:used={exercise.lastUsed}
  role="button"
  aria-haspopup="dialog"
  aria-label={`Ouvrir l'exercice ${exercise.title}`}
  tabindex="0"
  on:click={openView}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openView()}
>
  <div class="card-header">
    <div class="title-section">
      <h3 class="exercise-title">{exercise.title}</h3>
      <div class="exercise-meta">
        <span class="category">
          <span class="category-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2z"></path>
            </svg>
          </span>
          {exercise.category}
        </span>
        <span 
          class="difficulty" 
          style="color: {getDifficultyColor(exercise.difficulty)}"
        >
          {exercise.difficulty}
        </span>
        <span class="duration">{formatDuration(exercise.duration)}</span>
      </div>
    </div>
    
    {#if showActions}
      <div class="card-actions">
        <button 
          class="action-btn favorite-btn"
          class:active={exercise.isFavorite}
          on:click|stopPropagation={handleFavorite}
          title={exercise.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={exercise.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
        
        <button 
          class="action-btn use-btn"
          on:click|stopPropagation={handleUse}
          title="Marquer comme utilisé"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        
        <button 
          class="action-btn edit-btn"
          on:click|stopPropagation={handleEdit}
          title="Modifier"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        
        <button 
          class="action-btn delete-btn"
          on:click|stopPropagation={handleDelete}
          title="Supprimer"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    {/if}
  </div>
  
  <div class="card-content">
    <p class="exercise-description">{exercise.description}</p>
  </div>
  
  <!-- Footer supprimé en vue compact pour éviter surcharge d’informations -->
</div>

<style>
  .exercise-card {
    background-color: var(--color-white);
    border: none;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    transition: all 0.2s ease;
    position: relative;
    box-shadow: var(--shadow-subtle);
    cursor: pointer;
  }
  
  .exercise-card:hover {
    box-shadow: var(--shadow-md);
  }
  
  .exercise-card.used {
    background-color: var(--color-white);
  }
  
  .exercise-card.used::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: var(--color-green);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
    overflow: hidden; /* évite dépassement horizontal du header */
  }
  
  .title-section {
    flex: 1;
    min-width: 0; /* indispensable pour ellipsis dans flex */
  }
  
  .exercise-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-gray-800);
    margin: 0 0 var(--spacing-xs) 0;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    max-width: 100%;
  }
  
  .exercise-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    align-items: center;
  }
  
  .category {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
    font-weight: 500;
  }
  
  .category-icon {
    font-size: 14px;
  }
  
  .difficulty {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
  
  .duration {
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
    background-color: var(--color-gray-100);
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }
  
  .participants {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
  }
  
  .card-actions {
    display: flex;
    gap: var(--spacing-xs);
    margin-left: var(--spacing-md);
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background-color: var(--color-white);
    color: var(--color-gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-subtle);
  }
  
  .action-btn:hover {
    background-color: var(--color-gray-50);
    box-shadow: var(--shadow-md);
  }
  
  .favorite-btn.active {
    color: var(--color-yellow);
    background-color: var(--color-gray-50);
  }
  
  .use-btn:hover {
    color: var(--color-green);
    background-color: var(--color-gray-50);
  }
  
  .edit-btn:hover {
    color: var(--color-blue);
    background-color: var(--color-gray-50);
  }
  
  .delete-btn:hover {
    color: var(--color-red);
    background-color: var(--color-gray-50);
  }
  
  .card-content {
    margin-bottom: var(--spacing-md);
  }
  
  .exercise-description {
    font-size: var(--font-size-base);
    color: var(--color-gray-700);
    line-height: 1.6;
    margin: 0 0 var(--spacing-md) 0;
    display: -webkit-box;
    -webkit-line-clamp: 3; /* nombre max de lignes visibles */
    line-clamp: 3; /* propriété standard pour compatibilité */
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal; /* permet retour à la ligne */
    word-break: break-word; /* coupe les mots trop longs */
    overflow-wrap: anywhere; /* force le retour si mot trop long */
    max-height: 4.8em; /* 3 lignes * 1.6 */
  }
  
  .objectives,
  .instructions,
  .materials {
    margin-bottom: var(--spacing-md);
  }
  
  .objectives h4,
  .instructions h4,
  .materials h4 {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-gray-800);
    margin: 0 0 var(--spacing-xs) 0;
  }
  
  .objectives ul {
    margin: 0;
    padding-left: var(--spacing-md);
  }
  
  .objectives li {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
    line-height: 1.4;
    margin-bottom: 4px;
  }
  
  .instructions p {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
    line-height: 1.6;
    margin: 0;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  
  .materials-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .material-tag {
    font-size: var(--font-size-xs);
    color: var(--color-gray-700);
    background-color: var(--color-gray-100);
    padding: 4px 8px;
    border-radius: var(--radius-md);
    border: none;
  }
  
  .tags {
    display: flex;
    gap: var(--spacing-xs);
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
    -webkit-overflow-scrolling: touch;
  }
  .tags::-webkit-scrollbar { height: 4px; }
  .tags::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 2px; }
  
  .tag {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    background-color: var(--color-gray-100);
    padding: 4px 8px;
    border-radius: var(--radius-md);
    border: none;
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--spacing-sm);
    border-top: none;
    font-size: var(--font-size-xs);
    color: var(--color-gray-500);
  }
  
  .last-used,
  .usage-count {
    font-weight: 500;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .card-header {
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    
    .card-actions {
      margin-left: 0;
      align-self: flex-end;
    }
    
    .exercise-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-xs);
    }
    
    .card-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
</style>