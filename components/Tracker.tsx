import React, { useState, useMemo } from 'react';
import { ExerciseDefinition, WorkoutLog, WorkoutSet } from '../types';
import * as storageService from '../services/storageService';
import { Plus, Trash2, CheckCircle, Circle, Dumbbell, AlertCircle, Timer, Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import ExerciseSelect from './ExerciseSelect';

interface TrackerProps {
  logs: WorkoutLog[];
  exercises: ExerciseDefinition[];
  onUpdate: () => void;
}

const Tracker: React.FC<TrackerProps> = ({ logs, exercises, onUpdate }) => {
  // Use local date for initial state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  
  // Filter logs for selected date
  const dailyLogs = logs.filter(l => l.date === selectedDate);

  const handleDayChange = (offset: number) => {
    const date = new Date(selectedDate + 'T00:00:00'); // Force local time construction
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toLocaleDateString('en-CA'));
  };

  const handleToday = () => {
      setSelectedDate(new Date().toLocaleDateString('en-CA'));
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
          setSelectedDate(e.target.value);
      }
  };

  const handleAddExercise = async () => {
    if (!selectedExerciseId) return;
    
    const exerciseDef = exercises.find(e => e.id === selectedExerciseId);
    
    const newLog: WorkoutLog = {
      id: Date.now().toString(),
      date: selectedDate,
      exerciseId: selectedExerciseId,
      sets: [{ 
        id: Date.now().toString(), 
        reps: exerciseDef?.type === 'TIME' ? 0 : 0, 
        weight: exerciseDef?.type === 'WEIGHT' ? 0 : undefined,
        time: exerciseDef?.type === 'TIME' ? 0 : undefined,
        completed: false 
      }],
      notes: ''
    };

    await storageService.addLog(newLog);
    setSelectedExerciseId(''); // Clear selection after adding
    onUpdate();
  };

  const handleAddSet = async (log: WorkoutLog) => {
    const lastSet = log.sets[log.sets.length - 1];
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      reps: lastSet ? lastSet.reps : 0,
      weight: lastSet?.weight, 
      time: lastSet?.time,
      completed: false
    };
    const updatedLog = { ...log, sets: [...log.sets, newSet] };
    await storageService.updateLog(updatedLog);
    onUpdate();
  };

  const handleUpdateSet = async (log: WorkoutLog, setId: string, field: keyof WorkoutSet, value: any) => {
    const updatedSets = log.sets.map(s => s.id === setId ? { ...s, [field]: value } : s);
    const updatedLog = { ...log, sets: updatedSets };
    await storageService.updateLog(updatedLog);
    onUpdate();
  };

  const handleDeleteSet = async (log: WorkoutLog, setId: string) => {
    const updatedSets = log.sets.filter(s => s.id !== setId);
    if (updatedSets.length === 0) {
      await storageService.deleteLog(log.id);
    } else {
      const updatedLog = { ...log, sets: updatedSets };
      await storageService.updateLog(updatedLog);
    }
    onUpdate();
  };

  const handleDeleteLog = async (logId: string) => {
    if (confirm("Remove this exercise and all sets?")) {
        await storageService.deleteLog(logId);
        onUpdate();
    }
  };

  if (exercises.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-200 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Exercises Found</h3>
              <p className="text-slate-500 mb-4">Please configure Google Sheets in Settings or load demo data.</p>
          </div>
      );
  }

  // Helper to determine grid columns based on active fields
  const getGridCols = (type: string) => {
      if (type === 'WEIGHT') return 'grid-cols-10'; // Set(1) + Weight(3) + Reps(3) + Done(2) + Trash(1)
      if (type === 'TIME') return 'grid-cols-8';   // Set(1) + Time(4) + Done(2) + Trash(1)
      return 'grid-cols-7';                        // Set(1) + Reps(3) + Done(2) + Trash(1) (REPS type)
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <button 
            onClick={handleToday}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
        >
            Today
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => handleDayChange(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
                <h2 className="text-lg font-bold text-slate-800">
                    <span className="hidden sm:inline">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="sm:hidden">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                </h2>
                <p className="text-xs text-slate-500">{dailyLogs.length} Exercises</p>
            </div>
            <button onClick={() => handleDayChange(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>

        <div className="relative">
            <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
                <Calendar className="w-5 h-5" />
            </button>
            {/* Invisible Date Input covering the calendar icon */}
            <input 
                type="date" 
                value={selectedDate}
                onChange={handleDateSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Select Date"
            />
        </div>
      </div>

      {/* Add Exercise Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative z-30">
            <ExerciseSelect 
                exercises={exercises}
                selectedId={selectedExerciseId}
                onSelect={setSelectedExerciseId}
                placeholder="Find exercise to add..."
            />
        </div>
        <button 
            onClick={handleAddExercise}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Exercise</span>
            <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Workout List */}
      <div className="space-y-4">
        {dailyLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No workouts logged for this day.</p>
            <p className="text-sm text-slate-400">Select an exercise above to get started.</p>
          </div>
        ) : (
          dailyLogs.map(log => {
            const exercise = exercises.find(e => e.id === log.exerciseId);
            const type = exercise?.type || 'WEIGHT';
            const gridClass = getGridCols(type);
            
            return (
              <div key={log.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 group relative">
                         <h3 className="font-bold text-slate-800">{exercise?.name || 'Unknown Exercise'}</h3>
                         
                         {/* Description Tooltip */}
                         {exercise?.description && (
                             <>
                                <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-20 pointer-events-none">
                                    {exercise.description}
                                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                </div>
                             </>
                         )}

                         {log.synced && (
                           <div title="Synced to Sheet">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                           </div>
                         )}
                    </div>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                            {exercise?.muscleGroups.join(', ')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type === 'WEIGHT' ? 'bg-blue-50 text-blue-600' : (type === 'TIME' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600')}`}>
                            {type}
                        </span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteLog(log.id)} className="text-slate-400 hover:text-red-500 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4">
                  {/* Header Row */}
                  <div className={`grid ${gridClass} gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center`}>
                    <div className="col-span-1">Set</div>
                    {type === 'WEIGHT' && <div className="col-span-3">lbs</div>}
                    {type === 'WEIGHT' && <div className="col-span-3">Reps</div>}
                    {type === 'REPS' && <div className="col-span-3">Reps</div>}
                    {type === 'TIME' && <div className="col-span-4">Time (Sec)</div>}
                    <div className="col-span-2">Done</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {log.sets.map((set, idx) => (
                    <div key={set.id} className={`grid ${gridClass} gap-2 mb-3 items-center`}>
                      <div className="col-span-1 flex justify-center">
                        <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                      </div>
                      
                      {type === 'WEIGHT' && (
                        <>
                            <div className="col-span-3">
                                <input 
                                type="number" 
                                placeholder="0"
                                value={set.weight || ''}
                                onChange={(e) => handleUpdateSet(log, set.id, 'weight', Number(e.target.value))}
                                className="w-full text-center bg-slate-50 border border-slate-200 rounded p-1 focus:ring-2 focus:ring-blue-400 outline-none font-mono text-sm"
                                />
                            </div>
                            <div className="col-span-3">
                                <input 
                                type="number" 
                                placeholder="0"
                                value={set.reps}
                                onChange={(e) => handleUpdateSet(log, set.id, 'reps', Number(e.target.value))}
                                className="w-full text-center bg-slate-50 border border-slate-200 rounded p-1 focus:ring-2 focus:ring-blue-400 outline-none font-mono text-sm"
                                />
                            </div>
                        </>
                      )}

                      {type === 'REPS' && (
                        <div className="col-span-3">
                            <input 
                            type="number" 
                            placeholder="0"
                            value={set.reps}
                            onChange={(e) => handleUpdateSet(log, set.id, 'reps', Number(e.target.value))}
                            className="w-full text-center bg-slate-50 border border-slate-200 rounded p-1 focus:ring-2 focus:ring-blue-400 outline-none font-mono text-sm"
                            />
                        </div>
                      )}

                      {type === 'TIME' && (
                        <div className="col-span-4">
                            <div className="relative">
                                <input 
                                type="number" 
                                placeholder="0"
                                value={set.time || ''}
                                onChange={(e) => handleUpdateSet(log, set.id, 'time', Number(e.target.value))}
                                className="w-full text-center bg-slate-50 border border-slate-200 rounded p-1 focus:ring-2 focus:ring-blue-400 outline-none font-mono text-sm pl-6"
                                />
                                <Timer className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                            </div>
                        </div>
                      )}

                      <div className="col-span-2 flex justify-center">
                        <button 
                          onClick={() => handleUpdateSet(log, set.id, 'completed', !set.completed)}
                          className={`${set.completed ? 'text-green-500' : 'text-slate-300'} hover:scale-110 transition-transform`}
                        >
                          {set.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => handleDeleteSet(log, set.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={() => handleAddSet(log)}
                    className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg border border-dashed border-blue-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Set
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Tracker;