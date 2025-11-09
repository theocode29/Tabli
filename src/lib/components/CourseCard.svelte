<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Course } from '../types/course.js';

  export let course: Course;
  export let showActions = false;

  const dispatch = createEventDispatcher<{
    edit: Course;
    delete: Course;
    favorite: Course;
    view: Course;
  }>();

  function handleEdit() { dispatch('edit', course); }
  function handleDelete() {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le cours "${course.title}" ?`)) {
      dispatch('delete', course);
    }
  }
  function handleFavorite() { dispatch('favorite', course); }
  function openView() { dispatch('view', course); }
</script>

<div
  class="course-card"
  role="button"
  aria-haspopup="dialog"
  aria-label={`Ouvrir le cours ${course.title}`}
  tabindex="0"
  on:click={openView}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openView()}
>
  <div class="card-header">
    <div class="title-section">
      <h3 class="course-title">{course.title}</h3>
      <div class="course-meta">
        <span class="exercise-count">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2z"></path>
          </svg>
          {course.exerciseIds?.length || 0} exercices
        </span>
        {#if course.totalDuration !== undefined}
          <span class="exercise-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3"/>
              <circle cx="12" cy="12" r="10" />
            </svg>
            {course.totalDuration} min au total
          </span>
        {/if}
      </div>
    </div>

    <div class="card-actions">
      <button
        class="action-btn favorite-btn"
        class:active={course.isFavorite}
        on:click|stopPropagation={handleFavorite}
        title={course.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={course.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
      {#if showActions}
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
      {/if}
    </div>
  </div>

  <div class="card-content">
    <p class="course-description">{course.description}</p>
    {#if course.tags && course.tags.length}
      <div class="tags">
        {#each course.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .course-card {
    background-color: var(--color-white);
    border: none;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    transition: all 0.2s ease;
    position: relative;
    box-shadow: var(--shadow-subtle);
    cursor: pointer;
  }

  .course-card:hover { box-shadow: var(--shadow-md); }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
    overflow: hidden;
  }

  .title-section { flex: 1; min-width: 0; }

  .course-title {
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

  .course-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .exercise-count {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
    font-weight: 500;
  }

  .card-actions { display: flex; gap: var(--spacing-xs); margin-left: var(--spacing-md); }
  .action-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border: none; background-color: var(--color-white);
    color: var(--color-gray-600); cursor: pointer; transition: all 0.2s ease;
    border-radius: var(--radius-md); box-shadow: var(--shadow-subtle);
  }
  .action-btn:hover { background-color: var(--color-gray-50); box-shadow: var(--shadow-md); }
  .favorite-btn:hover { color: var(--color-yellow); }
  .edit-btn:hover { color: var(--color-blue); }
  .delete-btn:hover { color: var(--color-red); }

  .card-content { display: flex; flex-direction: column; gap: var(--spacing-sm); }
  .course-description {
    font-size: var(--font-size-base);
    color: var(--color-gray-700);
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
    max-height: 4.8em;
  }

  .tags { display: flex; gap: var(--spacing-xs); overflow-x: auto; overflow-y: hidden; padding-bottom: 4px; scrollbar-width: thin; }
  .tags::-webkit-scrollbar { height: 4px; }
  .tags::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 2px; }
  .tag { font-size: var(--font-size-xs); color: var(--color-text-secondary); background-color: var(--color-gray-100); padding: 4px 8px; border-radius: var(--radius-md); border: none; flex-shrink: 0; white-space: nowrap; }

  @media (max-width: 768px) {
    .card-header { flex-direction: column; gap: var(--spacing-sm); }
    .card-actions { margin-left: 0; align-self: flex-end; }
    .course-meta { flex-direction: column; align-items: flex-start; gap: var(--spacing-xs); }
  }
</style>