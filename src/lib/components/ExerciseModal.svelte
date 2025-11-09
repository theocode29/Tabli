<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Exercise, Difficulty, Category } from "../types/exercise.js";

  export let isOpen = false;
  export let exercise: Exercise | null = null;
  export let isEditing = false;

  const dispatch = createEventDispatcher<{
    save: Exercise;
    close: void;
  }>();

  const difficulties: Difficulty[] = ["Débutant", "Intermédiaire", "Avancé"];
  const categories: Category[] = [
    "Échauffement",
    "Improvisation",
    "Expression corporelle",
    "Voix et diction",
    "Concentration",
    "Émotion",
    "Personnage",
    "Groupe",
    "Solo",
    "Relaxation",
  ];

  // Form data
  let formData = {
    title: "",
    description: "",
    category: "Improvisation" as Category,
    difficulty: "Débutant" as Difficulty,
    duration: 15,
    participants: "",
    objectives: [""],
    instructions: "",
    materials: [""],
    tags: [""],
  };

  // Reactive statement to populate form when editing
  $: if (exercise && isEditing) {
    formData = {
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      participants: exercise.participants || "",
      objectives: exercise.objectives?.length ? [...exercise.objectives] : [""],
      instructions: exercise.instructions || "",
      materials: exercise.materials?.length ? [...exercise.materials] : [""],
      tags: exercise.tags?.length ? [...exercise.tags] : [""],
    };
  }

  // Reset form when modal closes
  $: if (!isOpen) {
    resetForm();
  }

  function resetForm() {
    formData = {
      title: "",
      description: "",
      category: "Improvisation",
      difficulty: "Débutant",
      duration: 15,
      participants: "",
      objectives: [""],
      instructions: "",
      materials: [""],
      tags: [""],
    };
  }

  function addObjective() {
    formData.objectives = [...formData.objectives, ""];
  }

  function removeObjective(index: number) {
    if (formData.objectives.length > 1) {
      formData.objectives = formData.objectives.filter((_, i) => i !== index);
    }
  }

  function addMaterial() {
    formData.materials = [...formData.materials, ""];
  }

  function removeMaterial(index: number) {
    if (formData.materials.length > 1) {
      formData.materials = formData.materials.filter((_, i) => i !== index);
    }
  }

  function addTag() {
    formData.tags = [...formData.tags, ""];
  }

  function removeTag(index: number) {
    if (formData.tags.length > 1) {
      formData.tags = formData.tags.filter((_, i) => i !== index);
    }
  }

  function handleSubmit() {
    // Validation
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Le titre et la description sont obligatoires.");
      return;
    }

    // Clean up arrays (remove empty strings)
    const cleanObjectives = formData.objectives.filter((obj) => obj.trim());
    const cleanMaterials = formData.materials.filter((mat) => mat.trim());
    const cleanTags = formData.tags.filter((tag) => tag.trim());

    const exerciseData: Exercise = {
      _id: exercise?._id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      difficulty: formData.difficulty,
      duration: formData.duration,
      participants: formData.participants.trim() || undefined,
      objectives: cleanObjectives.length > 0 ? cleanObjectives : [],
      instructions: formData.instructions.trim() || "",
      materials: cleanMaterials.length > 0 ? cleanMaterials : [],
      tags: cleanTags.length > 0 ? cleanTags : [],
      isFavorite: exercise?.isFavorite || false,
      usageCount: exercise?.usageCount || 0,
      lastUsed: exercise?.lastUsed,
      createdAt: exercise?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    dispatch("save", exerciseData);
  }

  function handleClose() {
    dispatch("close");
  }

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
        <h2>{isEditing ? "Modifier l'exercice" : "Nouvel exercice"}</h2>
        <button class="close-btn" on:click={handleClose} type="button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
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
            <input
              id="title"
              type="text"
              bind:value={formData.title}
              placeholder="Nom de l'exercice"
              required
            />
          </div>

          <!-- Description -->
          <div class="form-group full-width">
            <label for="description">Description *</label>
            <textarea
              id="description"
              bind:value={formData.description}
              placeholder="Description de l'exercice"
              rows="3"
              required
            ></textarea>
          </div>

          <!-- Catégorie et Difficulté -->
          <div class="form-group">
            <label for="category">Catégorie</label>
            <select id="category" bind:value={formData.category}>
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="difficulty">Difficulté</label>
            <select id="difficulty" bind:value={formData.difficulty}>
              {#each difficulties as difficulty}
                <option value={difficulty}>{difficulty}</option>
              {/each}
            </select>
          </div>

          <!-- Durée et Participants -->
          <div class="form-group">
            <label for="duration">Durée (minutes)</label>
            <input
              id="duration"
              type="number"
              min="1"
              max="300"
              bind:value={formData.duration}
            />
          </div>

          <div class="form-group">
            <label for="participants">Participants</label>
            <input
              id="participants"
              type="text"
              bind:value={formData.participants}
              placeholder="ex: 5-10 personnes"
            />
          </div>

          <!-- Objectifs -->
          <div class="form-group full-width">
            <div class="array-field-header">
              <label>Objectifs</label>
              <button type="button" class="add-btn" on:click={addObjective}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter
              </button>
            </div>
            <div class="array-field">
              {#each formData.objectives as objective, index}
                <div class="array-item">
                  <input
                    type="text"
                    bind:value={formData.objectives[index]}
                    placeholder="Objectif de l'exercice"
                  />
                  {#if formData.objectives.length > 1}
                    <button
                      type="button"
                      class="remove-btn"
                      on:click={() => removeObjective(index)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Instructions -->
          <div class="form-group full-width">
            <label for="instructions">Instructions</label>
            <textarea
              id="instructions"
              bind:value={formData.instructions}
              placeholder="Instructions détaillées pour l'exercice"
              rows="4"
            ></textarea>
          </div>

          <!-- Matériel -->
          <div class="form-group full-width">
            <div class="array-field-header">
              <label>Matériel</label>
              <button type="button" class="add-btn" on:click={addMaterial}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter
              </button>
            </div>
            <div class="array-field">
              {#each formData.materials as material, index}
                <div class="array-item">
                  <input
                    type="text"
                    bind:value={formData.materials[index]}
                    placeholder="Matériel nécessaire"
                  />
                  {#if formData.materials.length > 1}
                    <button
                      type="button"
                      class="remove-btn"
                      on:click={() => removeMaterial(index)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Tags -->
          <div class="form-group full-width">
            <div class="array-field-header">
              <label>Tags</label>
              <button type="button" class="add-btn" on:click={addTag}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter
              </button>
            </div>
            <div class="array-field">
              {#each formData.tags as tag, index}
                <div class="array-item">
                  <input
                    type="text"
                    bind:value={formData.tags[index]}
                    placeholder="Tag"
                  />
                  {#if formData.tags.length > 1}
                    <button
                      type="button"
                      class="remove-btn"
                      on:click={() => removeTag(index)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" on:click={handleClose}>
            Annuler
          </button>
          <button type="submit" class="btn-primary">
            {isEditing ? "Modifier" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-lg);
  }

  .modal {
    background-color: var(--color-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: none;
  }

  .modal-header h2 {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-gray-800);
    margin: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: var(--color-gray-500);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    color: var(--color-gray-700);
    background-color: var(--color-gray-100);
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .form-group label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-gray-700);
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    transition: box-shadow 0.2s ease;
    box-shadow: var(--shadow-subtle);
    background-color: var(--color-white);
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    box-shadow: var(--shadow-md);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 80px;
  }

  .array-field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }

  .array-field-header label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-gray-700);
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: none;
    border-radius: var(--radius-sm);
    background-color: var(--color-white);
    color: var(--color-blue);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-subtle);
  }

  .add-btn:hover {
    background-color: var(--color-gray-50);
    color: var(--color-blue);
  }

  .array-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .array-item {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .array-item input {
    flex: 1;
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-sm);
    background-color: var(--color-white);
    color: var(--color-red);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-subtle);
  }

  .remove-btn:hover {
    background-color: var(--color-gray-50);
    color: var(--color-red);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border-top: none;
  }

  .btn-secondary,
  .btn-primary {
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary {
    border: none;
    background-color: var(--color-white);
    color: var(--color-gray-700);
    box-shadow: var(--shadow-subtle);
  }

  .btn-secondary:hover {
    background-color: var(--color-gray-50);
  }

  .btn-primary {
    border: none;
    background-color: var(--color-blue);
    color: var(--color-white);
    box-shadow: var(--shadow-subtle);
  }

  .btn-primary:hover {
    background-color: var(--color-blue-hover);
    box-shadow: var(--shadow-md);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: var(--spacing-md);
    }

    .form-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .modal-header,
    .modal-content,
    .modal-footer {
      padding: var(--spacing-md);
    }
  }
</style>
