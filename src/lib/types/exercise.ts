export type Difficulty = 'Débutant' | 'Intermédiaire' | 'Avancé';

export type Category = 
  | 'Échauffement'
  | 'Improvisation'
  | 'Expression corporelle'
  | 'Voix et diction'
  | 'Concentration'
  | 'Émotion'
  | 'Personnage'
  | 'Groupe'
  | 'Solo'
  | 'Relaxation';

export interface Exercise {
  _id?: string;
  title: string;
  description: string;
  instructions: string;
  duration: number; // en minutes
  difficulty: Difficulty;
  category: Category;
  tags: string[];
  materials?: string[];
  objectives: string[];
  variations?: string[];
  notes?: string;
  participants?: string; // Nombre ou description des participants
  createdAt?: Date;
  updatedAt?: Date;
  lastUsed?: Date;
  usageCount?: number;
  isFavorite?: boolean;
}

export interface ExerciseFilters {
  difficulty?: Difficulty;
  category?: Category;
  tags?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  isFavorite?: boolean;
}

export interface ExerciseStats {
  totalExercises: number;
  exercisesByDifficulty: Record<Difficulty, number>;
  exercisesByCategory: Record<Category, number>;
  mostUsedTags: Array<{ tag: string; count: number }>;
  averageDuration: number;
  favoriteCount: number;
  recentlyUsed: Exercise[];
}

export interface DatabaseAPI {
  // CRUD operations
  createExercise: (exercise: Omit<Exercise, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Exercise>;
  getExercise: (id: string) => Promise<Exercise | null>;
  updateExercise: (id: string, updates: Partial<Exercise>) => Promise<Exercise>;
  deleteExercise: (id: string) => Promise<boolean>;
  
  // Query operations
  getAllExercises: () => Promise<Exercise[]>;
  searchExercises: (query: string) => Promise<Exercise[]>;
  filterExercises: (filters: ExerciseFilters) => Promise<Exercise[]>;
  
  // Statistics
  getStats: () => Promise<ExerciseStats>;
  
  // Utility operations
  markAsUsed: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<Exercise>;
  getAllTags: () => Promise<string[]>;
  
  // Backup/Export
  exportData: () => Promise<Exercise[]>;
  importData: (exercises: Exercise[]) => Promise<void>;
}