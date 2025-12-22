export type sdf = 'ARMS' | 'CHEST' | 'BACK' | 'LEGS' | 'SHOULDERS' | 'ARMS' | 'CORE' | 'LOWER CORE' | 'UPPER CORE' | 'OBLIQUES';


// Lookup table for muscle groups and the encompassing categories.
export const MUSCLE_CATEGORY_MAPPINGS = {
  ARMS: ['BICEPS', 'TRICEPS'],
  CHEST: ['UPPER CHEST', 'LOWER CHEST'],
  BACK: ['LATS', 'RHOMBOIDS', 'LOWER BACK'],
  LEGS: ['GLUTES', 'QUADS', 'HAMSTRINGS', 'CALVES'],
  SHOULDERS: ['FRONT DELT', 'REAR DELT'],
  CORE: ['UPPER CORE', 'LOWER CORE', 'OBLIQUES']
} as const;

// Break mapping into a list of categories and muscle group types.
// Note that MuscleGroups includes the categories bc exercises may target certain subgroups or the category as a whole.
export type MuscleCategory = keyof typeof MUSCLE_CATEGORY_MAPPINGS;
type MuscleSubgroup = typeof MUSCLE_CATEGORY_MAPPINGS[MuscleCategory][number];
export type MuscleGroup = MuscleCategory | MuscleSubgroup;

// How we measure the exercise. Weight: weight + reps, Reps: reps only, Time: duration.
export type ExerciseType = 'WEIGHT' | 'REPS' | 'TIME';

export interface ExerciseDefinition {
  id: string;
  name: string;
  type: ExerciseType;
  muscleGroups: MuscleGroup[];
  description: string;
  formNotes: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight?: number;
  time?: number; // seconds
  completed: boolean;
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
  synced?: boolean; // Track if synced to sheet
}

export interface FlatLog {
  date: string;
  exerciseName: string;
  setIndex: number;
  reps: number;
  weight: number;
  notes: string;
}

export enum TabView {
  TRACKER = 'TRACKER',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  BROWSE = 'BROWSE'
}

export interface ChartDataPoint {
  date: string;
  // Weighted Metrics
  maxWeight?: number;
  minWeight?: number;
  avgWeight?: number;
  // Reps/Volume Metrics
  totalReps?: number;
  maxRepsSet?: number;
  avgRepsSet?: number;
  // Time Metrics
  totalTime?: number;
  maxTimeSet?: number;
}

export interface AppSettings {
  spreadsheetId: string;
  accessToken: string;
  tokenExpiry?: number; // Timestamp
}