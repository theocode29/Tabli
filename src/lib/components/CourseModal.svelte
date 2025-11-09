<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { Course } from '../types/course.js';
  import type { Exercise } from '../types/exercise.js';
  import { exerciseStore } from '../stores/exerciseStore.js';

  export let isOpen = false;
  export let course: Course | null = null;
  export let isEditing = false;

  const dispatch = createEventDispatcher<{ save: Course; close: void }>();

  let formData = {
    title: '',
    description: '',
    tags: [''] as string[],
    exerciseIds: [] as string[]
  };

  onMount(async () => {
    await exerciseStore.loadExercises();
  });

  $: if (course && isEditing) {
    formData = {
      title: course.title,
      description: course.description,
      tags: course.tags?.length ? [...course.tags] : [''],
      exerciseIds: course.exerciseIds?.length ? [...course.exerciseIds] : []
    };
  }

  $: if (!isOpen) { resetForm(); }

  function resetForm() {
    formData = { title: '', description: '', tags: [''], exerciseIds: [] };
  }

  function addTag() { formData.tags = [...formData.tags, '']; }
  function removeTag(index: number) {
    if (formData.tags.length > 1) {
      formData.tags = formData.tags.filter((_, i) => i !== index);
    }
  }

  function toggleExercise(id: string) {
    if (formData.exerciseIds.includes(id)) {
      formData.exerciseIds = formData.exerciseIds.filter(eid => eid !== id);
    } else {
      formData.exerciseIds = [...formData.exerciseIds, id];
    }
  }

  function handleSubmit() {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Le titre et la description sont obligatoires.');
      return;
    }

    const cleanTags = formData.tags.map(t => t.trim()).filter(Boolean);

    const courseData: Course = {
      _id: course?._id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      tags: cleanTags,
      exerciseIds: [...formData.exerciseIds],
      isFavorite: course?.isFavorite || false,
      createdAt: course?.createdAt || new Date(),
      updatedAt: new Date()
    };

    dispatch('save', courseData);
  }

  function handleClose() { dispatch('close'); }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal">
      <div class="modal-header">
        <h2>{isEditing ? "Modifier le cours" : "Nouveau cours"}</h2>
        <button class="close-btn" on:click={handleClose} type="button" aria-label="Fermer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form class="modal-content" on:submit|preventDefault={handleSubmit}>
        <div class="form-grid">
          <!-- Titre -->
          <div class="form-group full-width">
            <label for="title">Titre *</label>
            <input id="title" type="text" bind:value={formData.title} placeholder="Nom du cours" required />
          </div>

          <!-- Description -->
          <div class="form-group full-width">
            <label for="description">Description *</label>
            <textarea id="description" bind:value={formData.description} placeholder="Description du cours" rows="3" required></textarea>
          </div>

          <!-- Tags -->
          <div class="form-group full-width">
            <div class="array-field-header">
              <label>Tags</label>
              <button type="button" class="add-btn" on:click={addTag}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter
              </button>
            </div>
            <div class="array-field">
              {#each formData.tags as tag, i}
                <div class="array-item">
                  <input type="text" bind:value={formData.tags[i]} placeholder="Tag" />
                  <button type="button" class="remove-btn" on:click={() => removeTag(i)} aria-label="Supprimer le tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>

          <!-- Sélection des exercices -->
          <div class="form-group full-width">
            <label>Exercices à inclure</label>
            <div class="exercise-list">
              {#each $exerciseStore.exercises as ex}
                <label class="exercise-item">
                  <input type="checkbox" checked={formData.exerciseIds.includes(ex._id!)} on:change={() => toggleExercise(ex._id!)} />
                  <span class="exercise-title">{ex.title}</span>
                  <span class="exercise-meta">{ex.category} • {ex.difficulty} • {ex.duration}min</span>
                </label>
              {/each}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" on:click={handleClose}>Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: transparent; display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--spacing-lg); }
  .modal { background-color: var(--color-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg); border-bottom: none; }
  .modal-header h2 { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-gray-800); margin: 0; }
  .close-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: none; color: var(--color-gray-500); cursor: pointer; border-radius: var(--radius-md); transition: all 0.2s ease; }
  .close-btn:hover { color: var(--color-gray-700); background-color: var(--color-gray-100); }
  .modal-content { flex: 1; overflow-y: auto; padding: var(--spacing-lg); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); }
  .form-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .form-group.full-width { grid-column: 1 / -1; }
  .form-group label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-gray-700); }
  .form-group input, .form-group textarea { padding: var(--spacing-sm) var(--spacing-md); border: none; border-radius: var(--radius-md); font-size: var(--font-size-base); transition: box-shadow 0.2s ease; box-shadow: var(--shadow-subtle); background-color: var(--color-white); }
  .form-group input:focus, .form-group textarea:focus { outline: none; box-shadow: var(--shadow-md); }
  .form-group textarea { resize: vertical; min-height: 80px; }
  .array-field-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm); }
  .add-btn { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border: none; border-radius: var(--radius-sm); background-color: var(--color-white); color: var(--color-blue); font-size: var(--font-size-xs); cursor: pointer; transition: all 0.2s ease; box-shadow: var(--shadow-subtle); }
  .add-btn:hover { background-color: var(--color-gray-50); color: var(--color-blue); }
  .array-field { display: flex; flex-direction: column; gap: var(--spacing-sm); }
  .array-item { display: flex; gap: var(--spacing-sm); align-items: center; }
  .array-item input { flex: 1; }
  .remove-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: var(--radius-sm); background-color: var(--color-white); color: var(--color-red); cursor: pointer; transition: all 0.2s ease; box-shadow: var(--shadow-subtle); }
  .remove-btn:hover { background-color: var(--color-gray-50); color: var(--color-red); }
  .exercise-list { display: flex; flex-direction: column; gap: var(--spacing-xs); max-height: 300px; overflow-y: auto; padding: var(--spacing-sm); border-radius: var(--radius-md); border: none; background-color: var(--color-bg-card); box-shadow: var(--shadow-subtle); }
  .exercise-item { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; padding: 6px 8px; border-radius: var(--radius-sm); }
  .exercise-item:hover { background-color: var(--color-gray-50); }
  .exercise-title { font-weight: 500; color: var(--color-gray-800); }
  .exercise-meta { font-size: var(--font-size-xs); color: var(--color-gray-600); }
  .modal-footer { display: flex; justify-content: flex-end; gap: var(--spacing-md); padding: var(--spacing-lg); border-top: none; }
  .btn-secondary, .btn-primary { padding: var(--spacing-sm) var(--spacing-lg); border-radius: var(--radius-md); font-size: var(--font-size-base); font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
  .btn-secondary { border: none; background-color: var(--color-white); color: var(--color-gray-700); box-shadow: var(--shadow-subtle); }
  .btn-secondary:hover { background-color: var(--color-gray-50); }
  .btn-primary { border: none; background-color: var(--color-blue); color: var(--color-white); box-shadow: var(--shadow-subtle); }
  .btn-primary:hover { background-color: var(--color-blue-hover); box-shadow: var(--shadow-md); }
  @media (max-width: 768px) { .modal-backdrop { padding: var(--spacing-md); } .form-grid { grid-template-columns: 1fr; gap: var(--spacing-md); } .modal-header, .modal-content, .modal-footer { padding: var(--spacing-md); } }
</style>