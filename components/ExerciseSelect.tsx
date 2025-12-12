import React, { useState, useRef, useEffect } from 'react';
import { ExerciseDef } from '../types';
import { useExerciseSearch } from '../hooks/useExerciseSearch';
import ExerciseFilterUI from './ExerciseFilterUI';
import { Search, Filter, ChevronDown } from 'lucide-react';

interface ExerciseSelectProps {
  exercises: ExerciseDef[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}

const ExerciseSelect: React.FC<ExerciseSelectProps> = ({ exercises, selectedId, onSelect, placeholder = "Select Exercise" }) => {
  const {
    searchQuery, setSearchQuery,
    filters,
    filteredExercises,
    availableMuscles,
    toggleTypeFilter,
    toggleMuscleFilter,
    clearFilters
  } = useExerciseSearch(exercises);

  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search with external selection initially or when selection changes
  useEffect(() => {
    const selected = exercises.find(e => e.id === selectedId);
    if (selected && !isOpen) {
      setSearchQuery(selected.name);
    } else if (!selectedId && !isOpen) {
        setSearchQuery('');
    }
  }, [selectedId, exercises, isOpen, setSearchQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFilters(false);
        // Reset search text to selected item on close if no new selection made
        const selected = exercises.find(e => e.id === selectedId);
        setSearchQuery(selected ? selected.name : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedId, exercises, setSearchQuery]);

  const handleInputFocus = () => {
    setIsOpen(true);
    // Select all text to allow easy replacement
    inputRef.current?.select();
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    const selected = exercises.find(e => e.id === id);
    if (selected) setSearchQuery(selected.name);
  };

  const hasActiveFilters = filters.types.length > 0 || filters.muscles.length > 0;

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
          }}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-10 pr-12 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        
        <div className="absolute right-2 flex items-center gap-1">
            <button 
                onClick={() => {
                    setIsOpen(true);
                    setShowFilters(!showFilters);
                }}
                className={`p-2 rounded-md transition-colors ${hasActiveFilters || showFilters ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title="Filter"
            >
                <Filter className="w-4 h-4" />
                {hasActiveFilters && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border border-white"></span>}
            </button>
        </div>
      </div>

      {showFilters && (
        <ExerciseFilterUI
          availableMuscles={availableMuscles}
          filters={filters}
          onToggleType={toggleTypeFilter}
          onToggleMuscle={toggleMuscleFilter}
          onClear={clearFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {isOpen && !showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-40">
            {filteredExercises.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">No exercises found</div>
            ) : (
                filteredExercises.map(e => (
                    <button
                        key={e.id}
                        onClick={() => handleSelect(e.id)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0"
                    >
                        <span className="font-medium text-slate-800">{e.name}</span>
                        <span className="text-xs text-slate-400 flex gap-2">
                             <span>{e.type}</span> • <span>{e.muscleGroups.join(', ')}</span>
                        </span>
                    </button>
                ))
            )}
        </div>
      )}
    </div>
  );
};

export default ExerciseSelect;