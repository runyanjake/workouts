import { ExerciseDef, WorkoutLog, AppSettings, WorkoutSet, ExerciseType } from '../types';

// Local Data
let WORKOUT_LOG: WorkoutLog[] = [];
let EXERCISE_DEFINITIONS: ExerciseDef[] = [];

const STORAGE_KEY_SETTINGS = 'pws_settings';

const getLocalISODate = (): string => {
    return new Date().toLocaleDateString('en-CA'); 
};

// Default Data
const SEED_EXERCISES: ExerciseDef[] = [
  { id: 'ex_1', name: 'Bench Press', muscleGroups: ['Chest', 'Triceps'], description: 'Barbell bench press', type: 'WEIGHT' },
  { id: 'ex_2', name: 'Squat', muscleGroups: ['Legs', 'Glutes'], description: 'Back squat', type: 'WEIGHT' },
  { id: 'ex_3', name: 'Plank', muscleGroups: ['Core'], description: 'Front plank', type: 'TIME' },
  { id: 'ex_4', name: 'Overhead Press', muscleGroups: ['Shoulders'], description: 'Standing barbell press', type: 'WEIGHT' },
  { id: 'ex_5', name: 'Pull Up', muscleGroups: ['Back', 'Biceps'], description: 'Bodyweight pull up', type: 'REPS' },
  { id: 'ex_6', name: 'Push Up', muscleGroups: ['Chest', 'Triceps'], description: 'Standard push up', type: 'REPS' },
];

const SEED_LOGS: WorkoutLog[] = [
    {
        id: 'seed_log_1',
        date: getLocalISODate(),
        exerciseId: 'ex_1',
        sets: [
            { id: 's1', reps: 10, weight: 135, completed: true },
            { id: 's2', reps: 8, weight: 155, completed: true },
            { id: 's3', reps: 5, weight: 185, completed: true }
        ],
        notes: 'Demo workout data',
        synced: true
    }
];

// --- Storage Helpers ---

export const getSettings = (): AppSettings => {
  const stored = sessionStorage.getItem(STORAGE_KEY_SETTINGS);
  return stored ? JSON.parse(stored) : { spreadsheetId: '', accessToken: '' };
};

export const saveSettings = (settings: AppSettings) => {
  sessionStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
};

export const getExercises = async (): Promise<ExerciseDef[]> => {
  return [...EXERCISE_DEFINITIONS];
};

export const getLogs = async (): Promise<WorkoutLog[]> => {
  return [...WORKOUT_LOG];
};

export const saveLogs = async (logs: WorkoutLog[]): Promise<void> => {
  WORKOUT_LOG = logs;
};

export const addLog = async (log: WorkoutLog): Promise<void> => {
  WORKOUT_LOG = [...WORKOUT_LOG, log];
};

export const updateLog = async (updatedLog: WorkoutLog): Promise<void> => {
  const index = WORKOUT_LOG.findIndex(l => l.id === updatedLog.id);
  if (index !== -1) {
    WORKOUT_LOG[index] = updatedLog;
  }
};

export const deleteLog = async (logId: string): Promise<void> => {
  WORKOUT_LOG = WORKOUT_LOG.filter(l => l.id !== logId);
};

export const seedDefaults = async (): Promise<void> => {
    // 1. Reset Exercises
    EXERCISE_DEFINITIONS = JSON.parse(JSON.stringify(SEED_EXERCISES));
    
    // 2. Reset Logs with correct dates
    const logsCopy: WorkoutLog[] = JSON.parse(JSON.stringify(SEED_LOGS));
    const today = getLocalISODate();
    logsCopy.forEach(log => {
        log.date = today;
    });

    WORKOUT_LOG = logsCopy;
};

// --- Google Sheets Integration Helpers ---

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const TAB_DATA = 'Data';
const TAB_EXERCISES = 'Exercises';

const fetchSheetsApi = async (url: string, method: string, token: string, body?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Google Sheets API Error');
  }
  return response.json();
};

// Helper: Generates a unique signature for a specific set to allow Diff/Union
const generateSignature = (date: string, exName: string, setIdx: number, reps: number, weight: number, time: number, notes: string) => {
    return `${date}|${exName}|${setIdx}|${reps}|${weight}|${time}|${notes}`.trim();
};

// Helper: Group flat rows into structured WorkoutLogs
const groupParsedRows = (rows: any[], exercises: ExerciseDef[]): WorkoutLog[] => {
    const grouped: WorkoutLog[] = [];
    const setCounters = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Columns: Date(0), Exercise(1), Reps(2), Weight(3), Time(4), Notes(5)
        const date = row[0];
        const exName = row[1];
        const reps = Number(row[2]) || 0;
        const weight = Number(row[3]) || 0;
        const time = Number(row[4]) || 0;
        const notes = row[5] || '';

        const exercise = exercises.find(e => e.name === exName);
        if (!exercise) continue; 

        // Determine implicit set index
        const key = `${date}|${exName}`;
        const currentCount = (setCounters.get(key) || 0) + 1;
        setCounters.set(key, currentCount);

        // Check if we already have a Log group for this Date+Exercise
        let log = grouped.find(l => l.date === date && l.exerciseId === exercise.id);
        
        const newSet: WorkoutSet = {
            id: `set_${date}_${exercise.id}_${currentCount}`,
            reps: reps,
            weight: weight > 0 ? weight : undefined,
            time: time > 0 ? time : undefined,
            completed: true
        };

        if (log) {
            log.sets.push(newSet);
            // Append notes if they differ? 
            if (notes && !log.notes) log.notes = notes; 
        } else {
            grouped.push({
                id: `log_${date}_${exercise.id}`,
                date: date,
                exerciseId: exercise.id,
                sets: [newSet],
                notes: notes,
                synced: true
            });
        }
    }
    return grouped;
};

// --- Sync Operations ---

export const pullDataFromSheets = async (): Promise<{ success: boolean, message: string }> => {
    const settings = getSettings();
    if (!settings.spreadsheetId || !settings.accessToken) {
        throw new Error('Settings not configured');
    }

    // 1. Fetch Exercises
    // Structure: Name(A), Type(B), Muscle Groups(C), Description(D), Notes(E)
    const exUrl = `${SHEETS_BASE_URL}/${settings.spreadsheetId}/values/${TAB_EXERCISES}!A2:E`;
    const exData = await fetchSheetsApi(exUrl, 'GET', settings.accessToken);
    let remoteExercises: ExerciseDef[] = [];
    
    if (exData.values && exData.values.length > 0) {
        remoteExercises = exData.values.map((row: string[], idx: number) => {
            const name = row[0] || 'Unknown';
            const rawType = (row[1] || '').toUpperCase();
            const muscles = row[2] ? row[2].split(',').map(s => s.trim()) : [];
            const desc = row[3] || '';
            
            let type: ExerciseType = 'WEIGHT';
            if (rawType.includes('REP')) type = 'REPS';
            else if (rawType.includes('TIME')) type = 'TIME';
            else type = 'WEIGHT';

            return {
                id: `ex_remote_${idx}`,
                name: name,
                muscleGroups: muscles,
                description: desc,
                type: type
            };
        });
        EXERCISE_DEFINITIONS = remoteExercises;
    } else {
        if (EXERCISE_DEFINITIONS.length === 0) {
             EXERCISE_DEFINITIONS = JSON.parse(JSON.stringify(SEED_EXERCISES));
        }
    }

    // 2. Fetch Workout Data
    // Expects: Date(A), Exercise(B), Reps(C), Weight(D), Time(E), Notes(F)
    const logUrl = `${SHEETS_BASE_URL}/${settings.spreadsheetId}/values/${TAB_DATA}!A:F`;
    const logData = await fetchSheetsApi(logUrl, 'GET', settings.accessToken);
    const remoteRows: string[][] = logData.values || [];
    
    const startRow = (remoteRows.length > 0 && remoteRows[0][0] === 'Date') ? 1 : 0;

    // Build Remote Signatures
    const remoteSignatures = new Set<string>();
    const remoteSetCounters = new Map<string, number>();

    for (let i = startRow; i < remoteRows.length; i++) {
        const row = remoteRows[i];
        const date = row[0];
        const exName = row[1];
        const reps = Number(row[2]) || 0;
        const weight = Number(row[3]) || 0;
        const time = Number(row[4]) || 0;
        const notes = row[5] || '';

        const key = `${date}|${exName}`;
        const currentCount = (remoteSetCounters.get(key) || 0) + 1;
        remoteSetCounters.set(key, currentCount);

        const sig = generateSignature(date, exName, currentCount, reps, weight, time, notes);
        remoteSignatures.add(sig);
    }

    // 3. Identify Local Unique
    const localUniqueRows: string[][] = [];
    
    for (const log of WORKOUT_LOG) {
        const exercise = EXERCISE_DEFINITIONS.find(e => e.id === log.exerciseId);
        const exName = exercise ? exercise.name : 'Unknown';
        
        log.sets.forEach((set, idx) => {
            const setIdx = idx + 1;
            const reps = set.reps || 0;
            const weight = set.weight || 0;
            const time = set.time || 0;
            const notes = log.notes || '';
            const sig = generateSignature(log.date, exName, setIdx, reps, weight, time, notes);

            if (!remoteSignatures.has(sig)) {
                localUniqueRows.push([
                    log.date,
                    exName,
                    reps.toString(),
                    weight.toString(),
                    time.toString(),
                    notes
                ]);
            }
        });
    }

    // 4. Update Memory
    const combinedRows = [...remoteRows.slice(startRow), ...localUniqueRows];
    WORKOUT_LOG = groupParsedRows(combinedRows, EXERCISE_DEFINITIONS);

    return { 
        success: true, 
        message: `Synced. Loaded ${remoteRows.length - startRow} rows from cloud. Found ${localUniqueRows.length} unsaved local sets.` 
    };
};

export const pushDataToSheets = async (): Promise<{ success: boolean, message: string }> => {
    const settings = getSettings();
    if (!settings.spreadsheetId || !settings.accessToken) {
        throw new Error('Settings not configured');
    }

    // 1. Prepare Data
    const header = ['Date', 'Exercise', 'Reps', 'Weight', 'Time', 'Notes'];
    const rows = [header];

    // Sort logs by date to keep sheet organized
    const sortedLogs = [...WORKOUT_LOG].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const log of sortedLogs) {
        const exercise = EXERCISE_DEFINITIONS.find(e => e.id === log.exerciseId);
        const exName = exercise ? exercise.name : 'Unknown';
        
        log.sets.forEach((set) => {
             rows.push([
                 log.date,
                 exName,
                 (set.reps || 0).toString(),
                 (set.weight || 0).toString(),
                 (set.time || 0).toString(),
                 log.notes || ''
             ]);
        });
    }

    // 2. Clear existing data to prevent duplication
    const clearUrl = `${SHEETS_BASE_URL}/${settings.spreadsheetId}/values/${TAB_DATA}!A:F:clear`;
    await fetchSheetsApi(clearUrl, 'POST', settings.accessToken, {});

    // 3. Write new data (Overwrite starting at A1)
    const updateUrl = `${SHEETS_BASE_URL}/${settings.spreadsheetId}/values/${TAB_DATA}!A1?valueInputOption=USER_ENTERED`;
    await fetchSheetsApi(updateUrl, 'PUT', settings.accessToken, { values: rows });
    
    return { success: true, message: `Successfully saved. Overwrote sheet with ${rows.length - 1} sets.` };
};