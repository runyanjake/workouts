import React from 'react';
import { FilterState } from '../hooks/useExerciseSearch';
import { ExerciseType } from '../types';
import { X, Check } from 'lucide-react';

interface ExerciseFilterUIProps {
  availableMuscles: string[];
  filters: FilterState;
  onToggleType: (type: ExerciseType) => void;
  onToggleMuscle: (muscle: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const ExerciseFilterUI: React.FC<ExerciseFilterUIProps> = ({
  availableMuscles,
  filters,
  onToggleType,
  onToggleMuscle,
  onClear,
  onClose
}) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 text-sm">Filter Exercises</h3>
        <div className="flex gap-2">
            <button onClick={onClear} className="text-xs text-blue-600 hover:underline">Reset</button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Type</h4>
        <div className="flex gap-2">
          {(['WEIGHT', 'REPS', 'TIME'] as ExerciseType[]).map(type => (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filters.types.includes(type)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Muscle Group</h4>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {availableMuscles.map(muscle => {
            const isSelected = filters.muscles.includes(muscle);
            return (
              <button
                key={muscle}
                onClick={() => onToggleMuscle(muscle)}
                className={`px-2 py-1 text-xs rounded-md border flex items-center gap-1 transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                {muscle}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExerciseFilterUI;