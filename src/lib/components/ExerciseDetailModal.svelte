<script lang="ts">
  import type { Exercise } from '../types/exercise.js';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  export let exercise: Exercise | null = null;
  export let onClose: () => void;
  export let showBack: boolean = false;

  let modalOuter: HTMLDivElement;
  const dispatch = createEventDispatcher<{
    favorite: Exercise;
    edit: Exercise;
    delete: Exercise;
  }>();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }

  function handleFavorite() {
    if (exercise) dispatch('favorite', exercise);
  }

  function handleEdit() {
    if (!exercise) return;
    dispatch('edit', exercise);
    onClose(); // fermer la modale pour mettre l'édition au premier plan
  }

  function handleDelete() {
    if (!exercise) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'exercice "${exercise.title}" ?`)) {
      dispatch('delete', exercise);
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if exercise}
  <div
    class="modal-outer"
    bind:this={modalOuter}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="modal-inner"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button class="close-button" on:click={onClose} aria-label={showBack ? 'Retour' : 'Fermer'}>
        {#if showBack}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {:else}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
          </svg>
        {/if}
      </button>

      <h2 id="modal-title" class="modal-title">{exercise.title}</h2>

      <div class="modal-toolbar">
        <button 
          class="icon-btn favorite-btn" 
          on:click={handleFavorite}
          aria-pressed={exercise.isFavorite}
          aria-label={exercise.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          title={exercise.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={exercise.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
        <button 
          class="icon-btn edit-btn" 
          on:click={handleEdit}
          aria-label="Modifier"
          title="Modifier"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button 
          class="icon-btn delete-btn" 
          on:click={handleDelete}
          aria-label="Supprimer"
          title="Supprimer"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div class="modal-section">
        <h3>Description</h3>
        <p class="description-full">{exercise.description}</p>
      </div>

      {#if exercise.tags && exercise.tags.length}
        <div class="modal-section">
          <h3>Tags</h3>
          <div class="tags-list">
            {#each exercise.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        </div>
      {/if}

      <div class="modal-section">
        <h3>Détails</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Catégorie :</span>
            <span class="detail-value">{exercise.category}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Niveau :</span>
            <span class="detail-value">{exercise.difficulty}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Durée :</span>
            <span class="detail-value">{exercise.duration} min</span>
          </div>
          {#if exercise.participants}
            <div class="detail-item">
              <span class="detail-label">Participants :</span>
              <span class="detail-value">{exercise.participants}</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Bouton Fermer en bas supprimé: fermeture via la croix uniquement -->
    </div>
  </div>
{/if}

<style>
  .modal-outer {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-inner {
    background: #FFFFFF;
    border-radius: 16px;
    padding: 32px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    overflow-x: hidden; /* éviter tout scroll horizontal */
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .close-button {
    position: absolute;
    top: 20px;
    right: 20px;
    background: #F5F5F7;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #1D1D1F;
  }

  .close-button:hover { background: #E8E8ED; transform: scale(1.05); }

  .modal-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 24px 0; color: #1D1D1F; padding-right: 40px; }
  .modal-section { margin-bottom: 24px; }
  .modal-section h3 { font-size: 1rem; font-weight: 600; margin: 0 0 12px 0; color: #1D1D1F; }
  .modal-toolbar { display: flex; gap: 8px; margin: 0 0 16px 0; }
  .description-full {
    font-size: 1rem;
    line-height: 1.7;
    color: #6E6E73;
    margin: 0;
    white-space: pre-wrap;   /* conserve les sauts de ligne */
    word-break: break-word;  /* coupe les mots trop longs */
    overflow-wrap: anywhere; /* force le retour si mot trop long */
    max-width: 100%;
    padding: 0 2px;
  }
  .tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag { padding: 6px 14px; border-radius: 12px; background: #F5F5F7; font-size: 0.875rem; color: #1D1D1F; }
  .details-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  .detail-item { display: flex; gap: 8px; }
  .detail-label { font-weight: 600; color: #1D1D1F; min-width: 120px; }
  .detail-value { color: #6E6E73; }
  .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; border-radius: 50%; background: #F5F5F7; color: #1D1D1F; cursor: pointer; transition: all 0.2s ease; }
  .icon-btn:hover { background: #E8E8ED; transform: scale(1.05); }
  .favorite-btn[aria-pressed="true"] { color: var(--color-yellow); background: #FFF7CC; }
</style>