import { Dexie, type Table } from 'dexie';
import type { Exercise, ExerciseFilters, ExerciseStats } from '../types/exercise.js';
import type { Course } from '../types/course.js';

// Type stocké en DB: ajoute une clé primaire numérique 'id' et garde '_id' pour compatibilité UI
export interface DBExercise extends Exercise {
  id?: number;
}

export const db = new Dexie('TabliExerciseDB');
db.version(1).stores({
  exercises:
    '++id, title, difficulty, category, isFavorite, lastUsed, usageCount, createdAt, updatedAt, *tags'
});
// Version 2: ajout de la table courses
db.version(2).stores({
  exercises:
    '++id, title, difficulty, category, isFavorite, lastUsed, usageCount, createdAt, updatedAt, *tags',
  courses:
    '++id, title, isFavorite, createdAt, updatedAt, *tags'
});

const exercisesTable: Table<DBExercise, number> = db.table('exercises');
// Courses
export interface DBCourse extends Course { id?: number; }
const coursesTable: Table<DBCourse, number> = db.table('courses');

function toExercise(dbe: DBExercise): Exercise {
  return {
    ...dbe,
    _id: dbe._id ?? (dbe.id !== undefined ? String(dbe.id) : undefined)
  };
}

function toDBExercise(ex: Exercise): DBExercise {
  return { ...ex } as DBExercise;
}

export async function getAllExercises(): Promise<Exercise[]> {
  const all = await exercisesTable.toArray();
  return all.map(toExercise);
}

export async function createExercise(
  exercise: Omit<Exercise, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Exercise> {
  const now = new Date();
  const dbe: DBExercise = {
    ...exercise,
    createdAt: now,
    updatedAt: now,
    usageCount: exercise.usageCount ?? 0,
    isFavorite: exercise.isFavorite ?? false
  };
  const id = await exercisesTable.add(dbe);
  const saved = await exercisesTable.get(id);
  return toExercise({ ...saved!, _id: String(id) });
}

export async function updateExercise(idStr: string, updates: Partial<Exercise>): Promise<Exercise> {
  const id = Number(idStr);
  const current = await exercisesTable.get(id);
  if (!current) throw new Error('Exercise not found');
  const merged: DBExercise = { ...current, ...updates, updatedAt: new Date() };
  await exercisesTable.put(merged);
  return toExercise(merged);
}

export async function deleteExercise(idStr: string): Promise<boolean> {
  const id = Number(idStr);
  await exercisesTable.delete(id);
  return true;
}

export async function toggleFavorite(idStr: string): Promise<Exercise> {
  const id = Number(idStr);
  const current = await exercisesTable.get(id);
  if (!current) throw new Error('Exercise not found');
  current.isFavorite = !current.isFavorite;
  current.updatedAt = new Date();
  await exercisesTable.put(current);
  return toExercise(current);
}

export async function markAsUsed(idStr: string): Promise<void> {
  const id = Number(idStr);
  const current = await exercisesTable.get(id);
  if (!current) return;
  current.lastUsed = new Date();
  current.usageCount = (current.usageCount ?? 0) + 1;
  current.updatedAt = new Date();
  await exercisesTable.put(current);
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const q = query.trim().toLowerCase();
  if (!q) return getAllExercises();
  const results = await exercisesTable
    .filter(
      (ex) =>
        ex.title.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q) ||
        (ex.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
    .toArray();
  return results.map(toExercise);
}

export async function filterExercises(filters: ExerciseFilters): Promise<Exercise[]> {
  let items = await exercisesTable.toArray();
  if (filters.difficulty) items = items.filter((e) => e.difficulty === filters.difficulty);
  if (filters.category) items = items.filter((e) => e.category === filters.category);
  if (filters.tags && filters.tags.length > 0)
    items = items.filter((e) => filters.tags!.every((t) => (e.tags ?? []).includes(t)));
  if (filters.duration) {
    const { min, max } = filters.duration;
    items = items.filter((e) => {
      const d = e.duration ?? 0;
      if (min !== undefined && min !== null && d < min) return false;
      if (max !== undefined && max !== null && d > max) return false;
      return true;
    });
  }
  if (filters.isFavorite !== undefined)
    items = items.filter((e) => (e.isFavorite ?? false) === filters.isFavorite);
  return items.map(toExercise);
}

export async function getAllTags(): Promise<string[]> {
  const exs: DBExercise[] = await exercisesTable.toArray();
  const tags = new Set<string>();
  exs.forEach((e: DBExercise) => (e.tags ?? []).forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export async function getStats(): Promise<ExerciseStats> {
  const exs: DBExercise[] = await exercisesTable.toArray();
  const total = exs.length;
  const difficulties = ['Débutant', 'Intermédiaire', 'Avancé'] as const;
  const categories = [
    'Échauffement',
    'Improvisation',
    'Expression corporelle',
    'Voix et diction',
    'Concentration',
    'Émotion',
    'Personnage',
    'Groupe',
    'Solo',
    'Relaxation'
  ] as const;
  const exercisesByDifficulty = difficulties.reduce((acc, d) => ({ ...acc, [d]: 0 }), {} as any);
  const exercisesByCategory = categories.reduce((acc, c) => ({ ...acc, [c]: 0 }), {} as any);
  let durationSum = 0;
  exs.forEach((e: DBExercise) => {
    if (e.difficulty && exercisesByDifficulty[e.difficulty] !== undefined)
      exercisesByDifficulty[e.difficulty]++;
    if (e.category && exercisesByCategory[e.category] !== undefined) exercisesByCategory[e.category]++;
    durationSum += e.duration ?? 0;
  });
  const averageDuration = total > 0 ? durationSum / total : 0;
  const favoriteCount = exs.filter((e: DBExercise) => e.isFavorite).length;
  const recentlyUsed = exs
    .filter((e: DBExercise) => e.lastUsed)
    .sort((a: DBExercise, b: DBExercise) => (new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime()))
    .slice(0, 10)
    .map(toExercise);
  const tagCounts: Record<string, number> = {};
  exs.forEach((e) => (e.tags ?? []).forEach((t) => (tagCounts[t] = (tagCounts[t] ?? 0) + 1)));
  const mostUsedTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return {
    totalExercises: total,
    exercisesByDifficulty,
    exercisesByCategory,
    mostUsedTags,
    averageDuration,
    favoriteCount,
    recentlyUsed
  };
}

export async function exportData(): Promise<Exercise[]> {
  return (await exercisesTable.toArray()).map(toExercise);
}

export async function importData(exercises: Exercise[]): Promise<void> {
  await exercisesTable.clear();
  // On insère en laissant Dexie générer les ids
  await exercisesTable.bulkAdd(exercises.map((e) => {
    const { _id, ...rest } = e;
    return rest as DBExercise;
  }));
}

// =========================
// Courses API (CRUD)
// =========================

function toCourse(dbc: DBCourse): Course {
  return {
    ...dbc,
    _id: dbc._id ?? (dbc.id !== undefined ? String(dbc.id) : undefined)
  };
}

function toDBCourse(c: Course): DBCourse {
  return { ...c } as DBCourse;
}

// Helper: compute total duration for a set of exercise ids
async function computeTotalDurationForCourse(exerciseIds: string[] | undefined): Promise<number> {
  if (!exerciseIds || exerciseIds.length === 0) return 0;
  const ids = exerciseIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  const exercises = await Promise.all(ids.map((id) => exercisesTable.get(id)));
  return exercises.reduce((sum, ex) => sum + (ex?.duration ?? 0), 0);
}

export async function getAllCourses(): Promise<Course[]> {
  const all = await coursesTable.toArray();
  return all.map(toCourse);
}

export async function createCourse(course: Omit<Course, '_id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
  const now = new Date();
  const dbc: DBCourse = {
    ...course,
    createdAt: now,
    updatedAt: now,
    isFavorite: course.isFavorite ?? false,
    exerciseIds: course.exerciseIds ?? [],
    totalDuration: await computeTotalDurationForCourse(course.exerciseIds ?? [])
  };
  const id = await coursesTable.add(dbc);
  const saved = await coursesTable.get(id);
  return toCourse({ ...saved!, _id: String(id) });
}

export async function updateCourse(idStr: string, updates: Partial<Course>): Promise<Course> {
  const id = Number(idStr);
  const current = await coursesTable.get(id);
  if (!current) throw new Error('Course not found');
  const merged: DBCourse = { ...current, ...updates, updatedAt: new Date() };
  // Recalculate total duration if exerciseIds changed
  if (updates.exerciseIds) {
    merged.totalDuration = await computeTotalDurationForCourse(updates.exerciseIds);
  }
  await coursesTable.put(merged);
  return toCourse(merged);
}

export async function deleteCourse(idStr: string): Promise<boolean> {
  const id = Number(idStr);
  await coursesTable.delete(id);
  return true;
}

export async function toggleCourseFavorite(idStr: string): Promise<Course> {
  const id = Number(idStr);
  const current = await coursesTable.get(id);
  if (!current) throw new Error('Course not found');
  current.isFavorite = !current.isFavorite;
  current.updatedAt = new Date();
  await coursesTable.put(current);
  return toCourse(current);
}

export async function addExerciseToCourse(courseIdStr: string, exerciseIdStr: string): Promise<Course> {
  const courseId = Number(courseIdStr);
  const current = await coursesTable.get(courseId);
  if (!current) throw new Error('Course not found');
  const eid = exerciseIdStr;
  const set = new Set(current.exerciseIds ?? []);
  set.add(eid);
  current.exerciseIds = Array.from(set);
  current.updatedAt = new Date();
  current.totalDuration = await computeTotalDurationForCourse(current.exerciseIds);
  await coursesTable.put(current);
  return toCourse(current);
}

export async function removeExerciseFromCourse(courseIdStr: string, exerciseIdStr: string): Promise<Course> {
  const courseId = Number(courseIdStr);
  const current = await coursesTable.get(courseId);
  if (!current) throw new Error('Course not found');
  current.exerciseIds = (current.exerciseIds ?? []).filter((id) => id !== exerciseIdStr);
  current.updatedAt = new Date();
  current.totalDuration = await computeTotalDurationForCourse(current.exerciseIds);
  await coursesTable.put(current);
  return toCourse(current);
}

export async function reorderExercisesInCourse(courseIdStr: string, newOrder: string[]): Promise<Course> {
  const courseId = Number(courseIdStr);
  const current = await coursesTable.get(courseId);
  if (!current) throw new Error('Course not found');
  current.exerciseIds = newOrder.slice();
  current.updatedAt = new Date();
  current.totalDuration = await computeTotalDurationForCourse(current.exerciseIds);
  await coursesTable.put(current);
  return toCourse(current);
}