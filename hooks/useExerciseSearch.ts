import { useState, useMemo } from 'react';
import { ExerciseDefinition, ExerciseType } from '../types';

export interface FilterState {
  types: ExerciseType[];
  muscles: string[];
}

export const useExerciseSearch = (exercises: ExerciseDefinition[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ types: [], muscles: [] });

  // Extract all available muscle groups for the filter UI
  const availableMuscles = useMemo(() => {
    const muscles = new Set<string>();
    exercises.forEach(e => e.muscleGroups.forEach(m => muscles.add(m)));
    return Array.from(muscles).sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(e => {
      // 1. Text Search
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Type Filter
      const matchesType = filters.types.length === 0 || filters.types.includes(e.type);

      // 3. Muscle Filter
      const matchesMuscle = filters.muscles.length === 0 || 
                            e.muscleGroups.some(m => filters.muscles.includes(m));

      return matchesSearch && matchesType && matchesMuscle;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, searchQuery, filters]);

  const toggleTypeFilter = (type: ExerciseType) => {
    setFilters(prev => {
      const exists = prev.types.includes(type);
      return {
        ...prev,
        types: exists ? prev.types.filter(t => t !== type) : [...prev.types, type]
      };
    });
  };

  const toggleMuscleFilter = (muscle: string) => {
    setFilters(prev => {
      const exists = prev.muscles.includes(muscle);
      return {
        ...prev,
        muscles: exists ? prev.muscles.filter(m => m !== muscle) : [...prev.muscles, muscle]
      };
    });
  };

  const clearFilters = () => setFilters({ types: [], muscles: [] });

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredExercises,
    availableMuscles,
    toggleTypeFilter,
    toggleMuscleFilter,
    clearFilters
  };
};