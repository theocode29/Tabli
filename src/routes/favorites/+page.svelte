<script lang="ts">
  import { onMount } from 'svelte';
  import ExerciseCard from '../../lib/components/ExerciseCard.svelte';
  import ExerciseModal from '../../lib/components/ExerciseModal.svelte';
  import ExerciseDetailModal from '../../lib/components/ExerciseDetailModal.svelte';
  import CourseCard from '../../lib/components/CourseCard.svelte';
  import CourseModal from '../../lib/components/CourseModal.svelte';
  import CourseDetailModal from '../../lib/components/CourseDetailModal.svelte';
  import { exerciseStore } from '../../lib/stores/exerciseStore.js';
  import { courseStore } from '../../lib/stores/courseStore.js';
  import type { Exercise } from '../../lib/types/exercise.js';
  import type { Course } from '../../lib/types/course.js';

  let showModal = false;
  let editingExercise: Exercise | null = null;
  let viewedExercise: Exercise | null = null;

  // Cours (favoris)
  let showCourseModal = false;
  let editingCourse: Course | null = null;
  let viewedCourse: Course | null = null;

  onMount(async () => {
    await exerciseStore.loadExercises();
    await courseStore.loadCourses();
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

  // Gestion cours favoris
  function openCourseEditModal(course: Course) {
    editingCourse = course;
    showCourseModal = true;
  }
  function closeCourseModal() {
    showCourseModal = false;
    editingCourse = null;
  }
  function openCourseDetail(course: Course) { viewedCourse = course; }
  function closeCourseDetail() { viewedCourse = null; }

  async function handleSaveCourse(event: CustomEvent<Course>) {
    const data = event.detail;
    try {
      if (editingCourse && editingCourse._id) {
        await courseStore.updateCourse(editingCourse._id, data);
      } else {
        await courseStore.createCourse(data);
      }
      closeCourseModal();
    } catch (e) { console.error(e); }
  }

  async function handleDeleteCourse(course: Course) {
    try { await courseStore.deleteCourse(course._id!); } catch (e) { console.error(e); }
  }

  async function handleToggleCourseFavorite(course: Course) {
    try {
      const updated = await courseStore.toggleFavorite(course._id!);
      if (viewedCourse && updated && updated._id === viewedCourse._id) {
        viewedCourse = updated;
      }
    } catch (e) { console.error(e); }
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'exercice "${exercise.title}" ?`)) {
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

  function handleEditExercise(event: CustomEvent<Exercise>) {
    openEditModal(event.detail);
  }

  $: favorites = $exerciseStore.exercises.filter((ex: Exercise) => ex.isFavorite);

  $: favoriteCoursesList = $courseStore.courses.filter((c: Course) => c.isFavorite);
</script>

<div class="page-container">
  <main class="main-content">

  <div class="content-area">
    {#if favoriteCoursesList.length > 0}
      <h3 class="section-title">Cours favoris</h3>
      <div class="courses-grid">
        {#each favoriteCoursesList as course (course._id)}
          <CourseCard
            {course}
            showActions={false}
            on:favorite={(e) => handleToggleCourseFavorite(e.detail)}
            on:view={(e) => openCourseDetail(e.detail)}
            on:edit={(e) => openCourseEditModal(e.detail)}
          />
        {/each}
      </div>
    {/if}

    {#if favorites.length > 0}
      <h3 class="section-title">Exercices favoris</h3>
      <div class="exercises-grid">
        {#each favorites as exercise (exercise._id)}
          <ExerciseCard
            {exercise}
            showActions={false}
            on:edit={handleEditExercise}
            on:delete={(e) => handleDelete(e.detail)}
            on:favorite={(e) => handleToggleFavorite(e.detail)}
            on:use={(e) => handleMarkAsUsed(e.detail)}
            on:view={(e) => openDetailModal(e.detail)}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>

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

<CourseModal
  isOpen={showCourseModal}
  course={editingCourse}
  isEditing={editingCourse !== null}
  on:save={handleSaveCourse}
  on:close={closeCourseModal}
/>

<CourseDetailModal
  course={viewedCourse}
  onClose={closeCourseDetail}
  on:favorite={(e) => handleToggleCourseFavorite(e.detail)}
  on:edit={(e) => { closeCourseDetail(); openCourseEditModal(e.detail); }}
  on:delete={(e) => { closeCourseDetail(); handleDeleteCourse(e.detail); }}
/>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .header {
    background: var(--color-white);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03);
    padding: 20px 24px;
  }

  .header-content {
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

  .app-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-gray-700);
  }

  .app-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: var(--color-gray-600);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .new-exercise-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03);
    cursor: pointer;
  }

  .controls-section {
    padding: 16px 24px;
    display: flex;
    gap: 12px;
  }

  .search-section { flex: 1; }

  .content-area {
    padding: 8px 24px 24px 24px;
    flex: 1;
    overflow: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 48px 16px;
    color: var(--color-gray-700);
  }

  .empty-icon {
    color: var(--color-gray-600);
  }

  .exercises-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-gray-800);
    margin: 0 0 12px 0;
  }
</style>