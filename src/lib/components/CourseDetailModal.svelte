<script lang="ts">
  import type { Course } from '../types/course.js';
  import type { Exercise } from '../types/exercise.js';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { exerciseStore } from '../stores/exerciseStore.js';
  import { courseStore } from '../stores/courseStore.js';
  import { dndzone } from 'svelte-dnd-action';
  import ExerciseDetailModal from './ExerciseDetailModal.svelte';
  import ExerciseModal from './ExerciseModal.svelte';

  export let course: Course | null = null;
  export let onClose: () => void;

  let modalOuter: HTMLDivElement;
  const dispatch = createEventDispatcher<{ favorite: Course; edit: Course; delete: Course }>();

  function handleKeydown(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
  function handleFavorite() { if (course) dispatch('favorite', course); }
  function handleEdit() { if (!course) return; dispatch('edit', course); onClose(); }
  function handleDelete() {
    if (!course) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer le cours "${course.title}" ?`)) {
      dispatch('delete', course);
      onClose();
    }
  }

  // DnD items doivent refléter l'ordre de course.exerciseIds et être mis à jour
  // pendant le drag (consider/finalize). Éviter un recalcul réactif agressif
  // qui écrase l'item fantôme du dnd.
  let dndItems: Array<{ id: string; ex: Exercise }> = [];
  let isDragging = false;
  $: if (course && !isDragging) {
    const ids = course.exerciseIds ?? [];
    dndItems = ids
      .map((id) => $exerciseStore.exercises.find((ex) => ex._id === id))
      .filter((ex): ex is Exercise => !!ex)
      .map((ex) => ({ id: ex._id!, ex }));
  }

  function handleDndConsider(event: CustomEvent<{ items: Array<{ id: string; ex: Exercise }> }>) {
    // pendant le drag, on reflète l'ordre/ombre renvoyé par la lib
    isDragging = true;
    dndItems = event.detail.items;
  }

  async function handleDndFinalize(event: CustomEvent<{ items: Array<{ id: string; ex: Exercise }> }>) {
    if (!course) return;
    // fin du drag: on conserve le verrou jusqu'à la persistance, puis on synchronise
    const items = event.detail.items;
    const newOrder = items.map((i) => i.id);
    dndItems = items; // affichage immédiat selon l'ordre final
    isDragging = true;
    try {
      await courseStore.reorderExercises(course._id!, newOrder);
      // mise à jour optimiste locale pour refléter l'ordre sans attendre le parent
      course = { ...course, exerciseIds: newOrder };
    } finally {
      isDragging = false;
    }
  }

  // Navigation: ouvrir fiche exercice et revenir au cours
  let selectedExercise: Exercise | null = null;
  function openExercise(ex: Exercise) { selectedExercise = ex; }
  function closeExerciseModal() { selectedExercise = null; }

  // Actions sur l'exercice depuis la modale imbriquée
  async function handleExerciseFavorite(ex: Exercise) {
    try {
      const updated = await exerciseStore.toggleFavorite(ex._id!);
      if (selectedExercise && updated && updated._id === selectedExercise._id) {
        selectedExercise = updated;
      }
    } catch (e) { console.error(e); }
  }

  let isEditingExercise = false;
  let editingExercise: Exercise | null = null;
  function handleExerciseEdit(ex: Exercise) {
    editingExercise = ex;
    isEditingExercise = true;
  }

  async function handleExerciseDelete(ex: Exercise) {
    try {
      await exerciseStore.deleteExercise(ex._id!);
      if (course) {
        await courseStore.removeExercise(course._id!, ex._id!);
      }
      closeExerciseModal();
    } catch (e) { console.error(e); }
  }

  async function handleExerciseSave(event: CustomEvent<Exercise>) {
    const data = event.detail;
    try {
      if (editingExercise && editingExercise._id) {
        const updated = await exerciseStore.updateExercise(editingExercise._id!, data);
        // Répercuter l'édition dans l'aperçu ouvert
        if (selectedExercise && updated && updated._id === selectedExercise._id) {
          selectedExercise = updated;
        }
      }
      isEditingExercise = false;
      editingExercise = null;
    } catch (e) { console.error(e); }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if course}
  <div class="modal-outer" bind:this={modalOuter} transition:fade={{ duration: 200 }}>
    <div class="modal-inner" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="close-button" on:click={onClose} aria-label="Fermer">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <h2 id="modal-title" class="modal-title">{course.title}</h2>
      {#if course.totalDuration !== undefined}
        <div class="course-meta-line">Durée totale: {course.totalDuration} min</div>
      {/if}

      <div class="modal-toolbar">
        <button class="icon-btn favorite-btn" on:click={handleFavorite} aria-pressed={course.isFavorite} aria-label={course.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} title={course.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill={course.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
        <button class="icon-btn edit-btn" on:click={handleEdit} aria-label="Modifier" title="Modifier" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="icon-btn delete-btn" on:click={handleDelete} aria-label="Supprimer" title="Supprimer" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div class="modal-section">
        <h3>Description</h3>
        <p class="description-full">{course.description}</p>
      </div>

      {#if course.tags && course.tags.length}
        <div class="modal-section">
          <h3>Tags</h3>
          <div class="tags-list">
            {#each course.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        </div>
      {/if}

      <div class="modal-section">
        <h3>Exercices inclus ({course.exerciseIds?.length || 0})</h3>
        {#if dndItems.length > 0}
          <ul class="exercise-list" use:dndzone={{ items: dndItems, flipDurationMs: 150 }} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
            {#each dndItems as item (item.id)}
              <li class="exercise-row" on:click={() => openExercise(item.ex)}>
                <span class="exercise-title">{item.ex.title}</span>
                <span class="exercise-meta">{item.ex.category} • {item.ex.difficulty} • {item.ex.duration}min</span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty">Aucun exercice sélectionné pour ce cours.</p>
        {/if}
      </div>
</div>
  </div>
{/if}

<ExerciseDetailModal 
  exercise={selectedExercise} 
  showBack={true} 
  onClose={closeExerciseModal}
  on:favorite={(e) => handleExerciseFavorite(e.detail)}
  on:edit={(e) => handleExerciseEdit(e.detail)}
  on:delete={(e) => handleExerciseDelete(e.detail)}
/>

<ExerciseModal 
  isOpen={isEditingExercise}
  exercise={editingExercise}
  isEditing={true}
  on:save={handleExerciseSave}
  on:close={() => { isEditingExercise = false; editingExercise = null; }}
/>

<style>
  .modal-outer { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .modal-inner { background: #FFFFFF; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; overflow-x: hidden; position: relative; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
  .close-button { position: absolute; top: 20px; right: 20px; background: #F5F5F7; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; color: #1D1D1F; }
  .close-button:hover { background: #E8E8ED; transform: scale(1.05); }
  .modal-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 24px 0; color: #1D1D1F; padding-right: 40px; }
  .modal-section { margin-bottom: 24px; }
  .course-meta-line { color: #6E6E73; margin-bottom: 8px; font-size: 0.95rem; }
  .modal-section h3 { font-size: 1rem; font-weight: 600; margin: 0 0 12px 0; color: #1D1D1F; }
  .modal-toolbar { display: flex; gap: 8px; margin: 0 0 16px 0; }
  .description-full { font-size: 1rem; line-height: 1.7; color: #6E6E73; margin: 0; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; max-width: 100%; padding: 0 2px; }
  .tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag { padding: 6px 14px; border-radius: 12px; background: #F5F5F7; font-size: 0.875rem; color: #1D1D1F; }
  .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; border-radius: 50%; background: #F5F5F7; color: #1D1D1F; cursor: pointer; transition: all 0.2s ease; }
  .icon-btn:hover { background: #E8E8ED; transform: scale(1.05); }
  .favorite-btn[aria-pressed="true"] { color: var(--color-yellow); background: #FFF7CC; }
  .exercise-list { display: flex; flex-direction: column; gap: 8px; }
  .exercise-row { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; border-radius: 10px; background: #F8F9FA; }
  .exercise-title { font-weight: 600; color: #1D1D1F; }
  .exercise-meta { font-size: 0.875rem; color: #6E6E73; }
  .empty { color: #6E6E73; font-size: 0.95rem; }
</style>