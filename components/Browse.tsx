import React, { useState } from 'react';
import { ExerciseDefinition } from '../types';
import { useExerciseSearch } from '../hooks/useExerciseSearch';
import ExerciseFilterUI from './ExerciseFilterUI';
import { Search, Filter, Image as ImageIcon, Dumbbell, Info } from 'lucide-react';

interface BrowseProps {
  exercises: ExerciseDefinition[];
}

const Browse: React.FC<BrowseProps> = ({ exercises }) => {
  const {
    searchQuery, setSearchQuery,
    filters,
    filteredExercises,
    availableMuscles,
    toggleTypeFilter,
    toggleMuscleFilter,
    clearFilters
  } = useExerciseSearch(exercises);

  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filters.types.length > 0 || filters.muscles.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Browse Exercises</h2>
        
        <div className="relative">
            <div className="relative flex items-center">
                <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises by name..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-10 pr-12 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                
                <div className="absolute right-2">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${hasActiveFilters || showFilters ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filter</span>
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="relative"> 
                    <ExerciseFilterUI
                        availableMuscles={availableMuscles}
                        filters={filters}
                        onToggleType={toggleTypeFilter}
                        onToggleMuscle={toggleMuscleFilter}
                        onClear={clearFilters}
                        onClose={() => setShowFilters(false)}
                    />
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredExercises.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No exercises match your search.</p>
            </div>
        ) : (
            filteredExercises.map(exercise => (
                <div key={exercise.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="h-32 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{exercise.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${exercise.type === 'WEIGHT' ? 'bg-blue-50 text-blue-600' : (exercise.type === 'TIME' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600')}`}>
                                {exercise.type}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                            {exercise.muscleGroups.map(m => (
                                <span key={m} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                                    {m}
                                </span>
                            ))}
                        </div>

                        <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                            {exercise.description || 'No description available.'}
                        </p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Browse;