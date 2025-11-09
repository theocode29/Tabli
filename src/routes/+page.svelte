<script lang="ts">
  import { onMount } from 'svelte';
  import { searchStore } from '../lib/stores/searchStore.js';
  import { exerciseStore } from '../lib/stores/exerciseStore.js';
  import { filterStore, activeFilters } from '../lib/stores/filterStore.js';
  import SearchBar from '../lib/components/SearchBar.svelte';
  import FilterPanel from '../lib/components/FilterPanel.svelte';
  import ExerciseCard from '../lib/components/ExerciseCard.svelte';
  import ExerciseModal from '../lib/components/ExerciseModal.svelte';
  import ExerciseDetailModal from '../lib/components/ExerciseDetailModal.svelte';
  import type { Exercise } from '../lib/types/exercise.js';

  // État local
  let showModal = false;
  let editingExercise: Exercise | null = null;
  let viewedExercise: Exercise | null = null;

  // Exercices filtrés basés sur la recherche et les filtres
  $: filteredExercises = $exerciseStore.exercises.filter((exercise: Exercise) => {
    // Filtre de recherche
    const query = $searchStore.query.toLowerCase();
    const matchesSearch = !query || 
      exercise.title.toLowerCase().includes(query) ||
      exercise.description.toLowerCase().includes(query) ||
      exercise.tags.some((tag: string) => tag.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // Filtres actifs
    const filters = $activeFilters;
    
    // Filtre par difficulté
    if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
      return false;
    }

    // Filtre par catégorie
    if (filters.category && exercise.category !== filters.category) {
      return false;
    }

    // Filtre par tags
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(filterTag => 
        exercise.tags.includes(filterTag)
      );
      if (!hasMatchingTag) return false;
    }

    // Filtre par durée
    if (filters.duration) {
      if (filters.duration.min && exercise.duration < filters.duration.min) {
        return false;
      }
      if (filters.duration.max && exercise.duration > filters.duration.max) {
        return false;
      }
    }

    // Filtre favoris uniquement
    if (filters.isFavorite && !exercise.isFavorite) {
      return false;
    }

    return true;
  });

  // Fonctions de gestion des exercices
  onMount(async () => {
    await exerciseStore.loadExercises();
  });

  function openCreateModal() {
    editingExercise = null;
    showModal = true;
  }

  function openEditModal(exercise: Exercise) {
    editingExercise = exercise;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingExercise = null;
  }

  function openDetailModal(exercise: Exercise) {
    viewedExercise = exercise;
  }

  function closeDetailModal() {
    viewedExercise = null;
  }

  async function handleSave(event: CustomEvent<Exercise>) {
    const exerciseData = event.detail;
    
    try {
      if (editingExercise) {
        await exerciseStore.updateExercise(editingExercise._id!, exerciseData);
      } else {
        await exerciseStore.createExercise(exerciseData);
      }
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  async function handleDelete(exercise: Exercise) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      try {
        await exerciseStore.deleteExercise(exercise._id!);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  }

  async function handleToggleFavorite(exercise: Exercise) {
    try {
      await exerciseStore.toggleFavorite(exercise._id!);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
    }
  }

  async function handleMarkAsUsed(exercise: Exercise) {
    try {
      await exerciseStore.markAsUsed(exercise._id!);
    } catch (error) {
      console.error('Erreur lors du marquage comme utilisé:', error);
    }
  }

  // Handlers pour les événements des composants
  function handleNewExercise() {
    openCreateModal();
  }

  function handleEditExercise(event: CustomEvent<Exercise>) {
    openEditModal(event.detail);
  }

  function handleDeleteExercise(event: CustomEvent<Exercise>) {
    handleDelete(event.detail);
  }

  function handleSearch(event: CustomEvent<string>) {
    searchStore.setQuery(event.detail);
  }
</script>

<div class="app-container">
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="search-inline">
        <SearchBar on:search={handleSearch} />
      </div>
      <div class="filters-inline">
        <FilterPanel />
      </div>
      <div class="header-actions">
        <button
          class="btn-primary"
          on:click={handleNewExercise}
          type="button"
          aria-label="Créer un nouvel exercice"
        >
          <span class="btn-icon">+</span>
          Nouvel exercice
        </button>
      </div>
    </div>
  </header>

  <!-- Main content -->
  <main class="main-content">

    <!-- Content area -->
    <div class="content-area">
      {#if filteredExercises.length === 0}
        <div class="empty-state">
          {#if $exerciseStore.exercises.length === 0}
            <div class="empty-logo">
               <img src="tabli_logo.svg" alt="Tabli" class="logo-img" />
             </div>
            <!-- Texte de bienvenue retiré pour éviter le doublon et bouton supprimé -->
          {:else}
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
            </div>
            <h2>Aucun exercice trouvé</h2>
            <p>Essayez de modifier votre recherche ou vos filtres.</p>
          {/if}
        </div>
      {:else}
        <div class="exercises-grid">
          {#each filteredExercises as exercise (exercise._id)}
            <ExerciseCard 
              {exercise}
              showActions={false}
              on:edit={handleEditExercise}
              on:delete={handleDeleteExercise}
              on:favorite={(e) => handleToggleFavorite(e.detail)}
               on:use={(e) => handleMarkAsUsed(e.detail)}
              on:view={(e) => openDetailModal(e.detail)}
            />
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>

<!-- Modal -->
<ExerciseModal
  isOpen={showModal}
  exercise={editingExercise}
  isEditing={editingExercise !== null}
  on:save={handleSave}
  on:close={closeModal}
/>

<ExerciseDetailModal
  exercise={viewedExercise}
  onClose={closeDetailModal}
  on:favorite={async (e) => {
    const updated = await exerciseStore.toggleFavorite(e.detail._id!);
    if (viewedExercise && updated && updated._id === viewedExercise._id) {
      viewedExercise = updated;
    }
  }}
  on:edit={(e) => {
    closeDetailModal();
    openEditModal(e.detail);
  }}
  on:delete={async (e) => {
    closeDetailModal();
    await handleDelete(e.detail);
  }}
/>

<style>
  .app-container {
    min-height: 100vh;
    background: var(--color-bg-main);
    display: flex;
    flex-direction: column;
  }

  /* Toolbar minimaliste sans transparence ni bordure */
  .header {
    background: var(--color-bg-main);
    padding: 24px 0;
    position: static;
    z-index: 1;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-inline {
    flex: 1;
  }

  .filters-inline {
    display: flex;
    align-items: center;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .app-title {
    font-size: 26px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .app-icon { font-size: 22px; }

  .app-subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .header-actions { display: flex; gap: 8px; align-items: center; }

  /* Bouton primaire minimaliste */
  .btn-primary {
    background: var(--color-blue);
    color: white;
    border: none;
    padding: 7px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    box-shadow: var(--shadow-subtle);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
    background: var(--color-blue-hover);
  }

  .btn-icon { font-size: 18px; font-weight: 300; }

  .main-content {
    flex: 1;
    padding: 20px 0 24px 0;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .controls-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }

  .search-section, .filter-section { display: flex; flex-direction: column; }

  .content-area { min-height: 400px; }

  .empty-state { text-align: center; padding: 48px 16px; color: var(--color-text-secondary); }
  .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.6; }
  .empty-logo { margin-bottom: 12px; display: flex; justify-content: center; }
  .logo-img { width: 120px; height: auto; opacity: 0.9; }
  .empty-state h2 { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: var(--color-text-primary); }
  .empty-state p { font-size: 13px; margin-bottom: 24px; opacity: 0.8; }

  .exercises-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
    padding: 8px 0;
  }

  @media (max-width: 768px) {
    .header { padding: 16px 0; }

    .header-content { flex-direction: column; gap: 12px; align-items: stretch; }
    .header-actions { justify-content: center; }

    .main-content { padding: 16px 0; }

    .controls-section { grid-template-columns: 1fr; gap: 12px; }
    .exercises-grid { grid-template-columns: 1fr; gap: 12px; }

    .app-title { font-size: 22px; justify-content: center; }
  }
</style>
