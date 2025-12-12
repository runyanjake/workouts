export type ExerciseType = 'WEIGHT' | 'REPS' | 'TIME';

export interface ExerciseDef {
  id: string;
  name: string;
  muscleGroups: string[];
  description: string;
  type: ExerciseType;
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