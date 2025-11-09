<script lang="ts">
  import { onMount } from 'svelte';
  import SearchBar from '../../lib/components/SearchBar.svelte';
  import CourseCard from '../../lib/components/CourseCard.svelte';
  import CourseModal from '../../lib/components/CourseModal.svelte';
  import CourseDetailModal from '../../lib/components/CourseDetailModal.svelte';
  import { courseStore } from '../../lib/stores/courseStore.js';
  import { exerciseStore } from '../../lib/stores/exerciseStore.js';
  import type { Course } from '../../lib/types/course.js';

  let showModal = false;
  let editingCourse: Course | null = null;
  let viewedCourse: Course | null = null;
  let query = '';

  onMount(async () => {
    await courseStore.loadCourses();
    await exerciseStore.loadExercises();
  });

  function openCreateModal() { editingCourse = null; showModal = true; }
  function openEditModal(course: Course) { editingCourse = course; showModal = true; }
  function closeModal() { showModal = false; editingCourse = null; }
  function openDetailModal(course: Course) { viewedCourse = course; }
  function closeDetailModal() { viewedCourse = null; }

  async function handleSave(event: CustomEvent<Course>) {
    const data = event.detail;
    try {
      if (editingCourse && editingCourse._id) {
        await courseStore.updateCourse(editingCourse._id, data);
      } else {
        await courseStore.createCourse(data);
      }
      closeModal();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(course: Course) {
    try {
      await courseStore.deleteCourse(course._id!);
    } catch (e) { console.error(e); }
  }

  async function handleToggleFavorite(course: Course) {
    try {
      const updated = await courseStore.toggleFavorite(course._id!);
      if (viewedCourse && updated && updated._id === viewedCourse._id) {
        viewedCourse = updated;
      }
    } catch (e) { console.error(e); }
  }

  function handleSearch(e: CustomEvent<string>) { query = e.detail.toLowerCase(); }

  $: filteredCourses = $courseStore.courses.filter((c: Course) => {
    if (!query) return true;
    const q = query.trim();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.tags?.some((t: string) => t.toLowerCase().includes(q)) ?? false)
    );
  });
</script>

<div class="page-container">
  <header class="header">
    <div class="header-content">
      <div class="search-inline">
        <SearchBar on:search={handleSearch} />
      </div>
      <div class="actions-inline">
        <button class="btn-primary" type="button" on:click={openCreateModal}>+ Nouveau cours</button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="content-area">
      {#if filteredCourses.length > 0}
        <div class="courses-grid">
          {#each filteredCourses as course (course._id)}
            <CourseCard
              {course}
              showActions={false}
              on:edit={(e) => openEditModal(e.detail)}
              on:delete={(e) => handleDelete(e.detail)}
              on:favorite={(e) => handleToggleFavorite(e.detail)}
              on:view={(e) => openDetailModal(e.detail)}
            />
          {/each}
        </div>
      {:else}
        <p class="empty">Aucun cours pour l’instant. Créez votre premier cours.</p>
      {/if}
    </div>
  </main>
</div>

<CourseModal
  isOpen={showModal}
  course={editingCourse}
  isEditing={editingCourse !== null}
  on:save={handleSave}
  on:close={closeModal}
/>

<CourseDetailModal
  course={viewedCourse}
  onClose={closeDetailModal}
  on:favorite={(e) => handleToggleFavorite(e.detail)}
  on:edit={(e) => { closeDetailModal(); openEditModal(e.detail); }}
  on:delete={(e) => { closeDetailModal(); handleDelete(e.detail); }}
/>

<style>
  .page-container { display: flex; flex-direction: column; height: 100%; }
  .header { background: var(--color-bg-main); padding: 24px 0; position: static; }
  .header-content { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-md); }
  .search-inline { flex: 1; }
  .actions-inline { display: flex; gap: var(--spacing-sm); }
  .btn-primary { padding: var(--spacing-sm) var(--spacing-lg); border: none; border-radius: var(--radius-md); background-color: var(--color-blue); color: var(--color-white); font-weight: 500; box-shadow: var(--shadow-subtle); cursor: pointer; }
  .btn-primary:hover { background-color: var(--color-blue-hover); box-shadow: var(--shadow-md); }
  .main-content { flex: 1; overflow-y: auto; }
  .content-area { padding: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg); }
  .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-lg); }
  .empty { color: var(--color-gray-600); padding: var(--spacing-lg); }
  @media (max-width: 768px) { .header { padding: var(--spacing-md) 0; } .content-area { padding: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md); } }
</style>