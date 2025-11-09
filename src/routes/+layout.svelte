<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { downloadBackup, importBackup, getLastBackupDate } from '../lib/backup.js';

  let showBackupPanel = false;
  let lastBackupDate = getLastBackupDate();
  let fileInput: HTMLInputElement;

  async function handleExport() {
    try {
      await downloadBackup();
      lastBackupDate = new Date();
      alert('✅ Sauvegarde téléchargée avec succès !');
    } catch (error) {
      alert('❌ Erreur lors de l\'export : ' + (error as Error).message);
    }
  }

  function handleImportClick() {
    fileInput?.click();
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
    } catch (error) {
      alert('❌ Erreur lors de l\'import : ' + (error as Error).message);
    }
    input.value = '';
  }

  function formatLastBackup(): string {
    if (!lastBackupDate) return 'Jamais';
    const now = new Date();
    const diff = now.getTime() - lastBackupDate.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }

  onMount(async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const persisted = await navigator.storage.persist();
        console.log(`Stockage persistant activé: ${persisted}`);
      } catch (e) {
        console.warn('Impossible d’activer le stockage persistant', e);
      }
    }
  });
</script>

<div class="app-container">
  <aside class="sidebar">
    <!-- Zone draggable pour les feux tricolores -->
    <div class="titlebar-drag-region"></div>

    <div class="sidebar-content">
      <div class="sidebar-header">
        <h2>Tabli</h2>
      </div>
      <nav class="sidebar-nav">
        <a href="/" class="nav-item" class:active={$page.url.pathname === '/'}>
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="6" height="6" rx="1"></rect>
              <rect x="14" y="4" width="6" height="6" rx="1"></rect>
              <rect x="4" y="14" width="6" height="6" rx="1"></rect>
              <rect x="14" y="14" width="6" height="6" rx="1"></rect>
            </svg>
          </span>
          <span>Tous</span>
        </a>
        <a href="/favorites" class="nav-item" class:active={$page.url.pathname.startsWith('/favorites')}>
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </span>
          <span>Favoris</span>
        </a>
        <a href="/courses" class="nav-item" class:active={$page.url.pathname.startsWith('/courses')}>
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2z"></path>
            </svg>
          </span>
          <span>Cours</span>
        </a>
      </nav>
    </div>
    <div class="sidebar-bottom">
      <button 
        class="profile-button"
        on:click={() => showBackupPanel = !showBackupPanel}
        aria-label="Paramètres et sauvegarde"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="8" r="4" stroke-width="2"/>
          <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke-width="2"/>
        </svg>
        {#if lastBackupDate && (new Date().getTime() - lastBackupDate.getTime() > 86400000)}
          <span class="notification-badge"></span>
        {/if}
      </button>
    </div>
  </aside>

  <main class="main-content">
    <slot />
  </main>
</div>

{#if showBackupPanel}
  <div class="backup-overlay" on:click={() => showBackupPanel = false}>
    <div class="backup-panel" on:click|stopPropagation>
      <div class="panel-header">
        <h3>Sauvegarde & Restauration</h3>
        <button class="close-btn" on:click={() => showBackupPanel = false}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M15 5L5 15M5 5l10 10" stroke-width="2"/>
          </svg>
        </button>
      </div>

      <div class="panel-content">
        <div class="backup-info">
          <p class="info-label">Dernière sauvegarde automatique</p>
          <p class="info-value">{formatLastBackup()}</p>
        </div>

        <button class="backup-action-btn export-btn" on:click={handleExport}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M10 3v10M10 3l-3 3M10 3l3 3M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke-width="2"/>
          </svg>
          <span>Exporter mes données</span>
        </button>

        <button class="backup-action-btn import-btn" on:click={handleImportClick}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M10 13V3M10 13l-3-3M10 13l3-3M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke-width="2"/>
          </svg>
          <span>Importer des données</span>
        </button>

        <input
          type="file"
          accept=".json"
          bind:this={fileInput}
          on:change={handleFileSelect}
          style="display: none;"
        />

        <div class="backup-help">
          <p>💡 <strong>Export :</strong> Télécharge toutes vos données dans un fichier JSON</p>
          <p>💡 <strong>Import :</strong> Restaure vos données depuis un fichier de sauvegarde</p>
          <p>⚠️ L'import remplacera toutes vos données actuelles</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden;
    background: #FFFFFF;
    color: var(--color-text-primary, #1D1D1F);
  }

  .app-container {
    display: grid;
    grid-template-columns: 260px 1fr;
    height: 100vh;
    background: var(--color-bg-main, #FFFFFF);
    padding: 20px; /* Padding pour effet volant */
    gap: 20px; /* Espace entre sidebar et contenu */
  }

  /* Sidebar minimaliste OPAQUE et VOLANTE */
  .sidebar {
    position: relative;
    background: var(--color-bg-sidebar, #FAFAFA); /* Opaque */
    border-radius: 12px; /* Effet volant */
    box-shadow: var(--shadow-light, 0 2px 8px rgba(0,0,0,0.04));
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Zone draggable */
  .titlebar-drag-region {
    -webkit-app-region: drag;
    height: 60px;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .sidebar-content {
    -webkit-app-region: no-drag;
    padding: 80px 20px 20px 20px;
    flex: 1;
    overflow-y: auto;
  }

  .sidebar-bottom {
    -webkit-app-region: no-drag;
    padding: 16px 16px 20px 16px;
    /* Pas de bordure de séparation, séparation par espacement */
  }

  .profile-button {
    width: 100%;
    padding: 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profile-button:hover { background: #F5F5F7; }
  .notification-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: #FF3B30;
    border-radius: 50%;
  }

  .backup-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: transparent;
    /* Pas de blur pour overlay selon guide */
    display: flex;
    align-items: flex-end;
    z-index: 1000;
  }

  .backup-panel {
    background: #FFFFFF;
    border-radius: 16px 16px 0 0;
    padding: 24px;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    box-shadow: var(--shadow-light);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .panel-header h3 { font-size: 1.25rem; font-weight: 600; margin: 0; }
  .close-btn {
    background: #F5F5F7;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .panel-content { display: flex; flex-direction: column; gap: 16px; }
  .backup-info { padding: 12px; background: #FAFAFA; border-radius: 8px; }
  .info-label { font-size: 0.875rem; color: #86868B; margin: 0 0 4px 0; }
  .info-value { font-size: 1rem; font-weight: 600; color: #1D1D1F; margin: 0; }

  .backup-action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .export-btn { background: var(--color-blue); color: #FFFFFF; }
  .export-btn:hover { background: var(--color-blue-hover); }
  .import-btn { background: var(--color-bg-card); color: var(--color-text-primary); }
  .import-btn:hover { background: var(--color-bg-hover); }

  .backup-help {
    padding: 16px;
    background: var(--color-bg-card);
    border-radius: 8px;
    font-size: 0.875rem;
    line-height: 1.6;
  }
  .backup-help p { margin: 0 0 8px 0; }
  .backup-help p:last-child { margin-bottom: 0; }

  .sidebar-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary, #1D1D1F);
    margin: 0 0 24px 0;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    text-decoration: none;
    color: var(--color-text-primary, #1D1D1F);
    font-size: 13px;
    font-weight: 400;
    transition: background-color 0.15s ease;
    border: none; /* Pas de bordure */
  }

  .nav-item:hover {
    background: var(--color-bg-hover, #F0F0F2);
  }

  .nav-item.active {
    background: #E8E8EA;
    font-weight: 500;
  }

  .nav-icon { font-size: 16px; }

  /* Zone de contenu principal */
  .main-content {
    background: var(--color-bg-main, #FFFFFF);
    overflow-y: auto;
    padding: 20px 40px;
    border-radius: 12px; /* Optionnel : contenu volant */
  }

  /* Scrollbar minimaliste */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.15);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
</style>