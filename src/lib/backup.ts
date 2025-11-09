import type { Exercise } from './types/exercise.js';
import type { Course } from './types/course.js';
import { db, getAllExercises, getAllCourses } from './db/database.js';

const LAST_BACKUP_KEY = 'last_backup_date';

interface BackupData {
  version: string;
  exportDate: string;
  appVersion: string;
  data: {
    exercises: Exercise[];
    courses: Course[];
  };
  metadata: {
    exerciseCount: number;
    courseCount: number;
    totalDuration: number;
  };
}

export async function exportDataToJSON(): Promise<BackupData> {
  const exercises = await getAllExercises();
  const courses = await getAllCourses();

  const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration ?? 0), 0);

  const backup: BackupData = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    appVersion: '2.0.0',
    data: { exercises, courses },
    metadata: {
      exerciseCount: exercises.length,
      courseCount: courses.length,
      totalDuration
    }
  };

  try {
    localStorage.setItem(LAST_BACKUP_KEY, backup.exportDate);
  } catch {}

  return backup;
}

export async function downloadBackup(): Promise<void> {
  try {
    const backupData = await exportDataToJSON();
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const date = new Date();
    const filename = `tabli_backup_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Backup téléchargé avec succès:', filename);
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement du backup:', error);
    throw new Error('Impossible de télécharger la sauvegarde');
  }
}

export async function importBackup(file: File): Promise<void> {
  try {
    const text = await file.text();
    const backupData: BackupData = JSON.parse(text);

    if (!backupData.version || !backupData.data) {
      throw new Error('Format de fichier invalide');
    }

    const confirmOverwrite = confirm(
      `⚠️ Attention : Cette action va remplacer toutes vos données actuelles.\n\n` +
      `Données à importer :\n` +
      `- ${backupData.metadata.exerciseCount} exercices\n` +
      `- ${backupData.metadata.courseCount} cours\n` +
      `- Sauvegarde du ${new Date(backupData.exportDate).toLocaleString()}\n\n` +
      `Voulez-vous continuer ?`
    );
    if (!confirmOverwrite) {
      throw new Error("Import annulé par l'utilisateur");
    }

    // Préparer mapping des IDs des exercices
    const oldExercises = backupData.data.exercises;
    const exercisesTable = db.table('exercises');
    const coursesTable = db.table('courses');

    await exercisesTable.clear();
    await coursesTable.clear();

    const idMap = new Map<string, string>();

    // Réinsérer les exercices un par un pour récupérer les nouveaux IDs
    for (const ex of oldExercises) {
      const { _id, ...rest } = ex as any;
      const newId = await exercisesTable.add({ ...rest });
      idMap.set(String(_id ?? ''), String(newId));
    }

    // Réinsérer les cours en remappant les exerciseIds
    for (const course of backupData.data.courses) {
      const { _id, exerciseIds, totalDuration, ...rest } = course as any;
      const mappedIds = (exerciseIds ?? []).map((eid: string) => idMap.get(String(eid))).filter(Boolean) as string[];

      // Recalculer la durée totale à partir des exercices importés
      let durationSum = 0;
      for (const oldId of exerciseIds ?? []) {
        const mapped = idMap.get(String(oldId));
        if (mapped) {
          const exRow = await exercisesTable.get(Number(mapped));
          durationSum += exRow?.duration ?? 0;
        }
      }

      await coursesTable.add({
        ...rest,
        exerciseIds: mappedIds,
        totalDuration: durationSum
      });
    }

    try { localStorage.setItem('last_restore_date', new Date().toISOString()); } catch {}
    console.log('✅ Données importées avec succès');
    window.location.reload();
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
    throw new Error('Impossible d\'importer la sauvegarde: ' + (error as Error).message);
  }
}

export function getLastBackupDate(): Date | null {
  try {
    const dateString = localStorage.getItem(LAST_BACKUP_KEY);
    return dateString ? new Date(dateString) : null;
  } catch {
    return null;
  }
}

export async function validateBackup(backupData: BackupData): Promise<boolean> {
  try {
    if (!backupData.version || backupData.version !== '2.0') {
      console.warn('⚠️ Version de backup incompatible');
      return false;
    }
    if (!backupData.data || !Array.isArray(backupData.data.exercises) || !Array.isArray(backupData.data.courses)) {
      console.warn('⚠️ Structure de données invalide');
      return false;
    }

    const exerciseIds = new Set(backupData.data.exercises.map((ex) => String(ex._id ?? '')));
    for (const course of backupData.data.courses) {
      for (const exerciseId of course.exerciseIds ?? []) {
        if (!exerciseIds.has(String(exerciseId))) {
          console.warn(`⚠️ Cours "${course.title ?? ''}" référence un exercice inexistant: ${exerciseId}`);
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur de validation:', error);
    return false;
  }
}

let backupTimeout: number | null = null;
export function triggerDebouncedBackup(): void {
  if (backupTimeout) {
    clearTimeout(backupTimeout);
  }
  backupTimeout = window.setTimeout(async () => {
    try {
      await exportDataToJSON();
      console.log('📦 Auto-backup effectué (debounced)');
    } catch (error) {
      console.error('⚠️ Erreur auto-backup:', error);
    }
  }, 2000);
}