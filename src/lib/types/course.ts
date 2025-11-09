export interface Course {
  _id?: string;
  title: string;
  description: string;
  tags: string[];
  exerciseIds: string[]; // Références vers les exercices
  isFavorite?: boolean;
  totalDuration?: number; // en minutes, calculé
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseFilters {
  tags?: string[];
  isFavorite?: boolean;
}