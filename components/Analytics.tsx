import React, { useState, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { WorkoutLog, ExerciseDef, ChartDataPoint } from '../types';
import { TrendingUp, BarChart2, Calendar, Clock, ArrowUpRight, Minus, Timer, Activity, Hash, Layers } from 'lucide-react';
import ExerciseSelect from './ExerciseSelect';

interface AnalyticsProps {
  logs: WorkoutLog[];
  exercises: ExerciseDef[];
}

type TimeRange = 'ALL' | '1Y' | '3M';
type GraphMode = 'WEIGHT' | 'REPS';

const Analytics: React.FC<AnalyticsProps> = ({ logs, exercises }) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [graphMode, setGraphMode] = useState<GraphMode>('WEIGHT');
  
  // Init selection
  React.useEffect(() => {
    if (!selectedExerciseId && exercises.length > 0) {
        // Find alphabetically first exercise
        const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name));
        setSelectedExerciseId(sorted[0].id);
    }
  }, [exercises, selectedExerciseId]);

  const currentExercise = exercises.find(e => e.id === selectedExerciseId);
  const type = currentExercise?.type || 'WEIGHT';

  // Prepare comprehensive chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    let relevantLogs = logs.filter(l => l.exerciseId === selectedExerciseId);
    
    // Filter by Time Range
    const now = new Date();
    let minDate = new Date(0);
    if (timeRange === '1Y') {
        minDate = new Date();
        minDate.setFullYear(now.getFullYear() - 1);
    } else if (timeRange === '3M') {
        minDate = new Date();
        minDate.setMonth(now.getMonth() - 3);
    }

    relevantLogs = relevantLogs.filter(l => new Date(l.date) >= minDate);

    // Sort logs by date ascending
    relevantLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Aggregate by date
    const groupedByDate = new Map<string, WorkoutLog[]>();
    relevantLogs.forEach(l => {
        const existing = groupedByDate.get(l.date) || [];
        existing.push(l);
        groupedByDate.set(l.date, existing);
    });

    const points: ChartDataPoint[] = [];
    groupedByDate.forEach((dayLogs, date) => {
        const allSets = dayLogs.flatMap(l => l.sets);
        
        // Calculate Weighted Metrics
        const weights = allSets.map(s => s.weight || 0).filter(w => w > 0);
        let maxWeight = 0, minWeight = 0, avgWeight = 0;
        if (weights.length > 0) {
            maxWeight = Math.max(...weights);
            minWeight = Math.min(...weights);
            avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
        }

        // Calculate Reps Metrics
        const repsList = allSets.map(s => s.reps);
        const totalReps = repsList.reduce((a, b) => a + b, 0);
        const maxRepsSet = repsList.length > 0 ? Math.max(...repsList) : 0;
        const avgRepsSet = repsList.length > 0 ? totalReps / repsList.length : 0;

        // Calculate Time Metrics
        const timesList = allSets.map(s => s.time || 0);
        const totalTime = timesList.reduce((a, b) => a + b, 0);
        const maxTimeSet = timesList.length > 0 ? Math.max(...timesList) : 0;

        points.push({
            date,
            maxWeight: maxWeight || undefined,
            minWeight: minWeight || undefined,
            avgWeight: avgWeight || undefined,
            totalReps,
            maxRepsSet,
            avgRepsSet,
            totalTime,
            maxTimeSet
        });
    });

    return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [logs, selectedExerciseId, timeRange]);

  // Stat Calculations based on filtered chart data
  const stats = useMemo(() => {
      const count = chartData.length;
      if (count === 0) return null;

      const lastPoint = chartData[count - 1];
      
      // WEIGHT stats
      const allMaxWeights = chartData.map(d => d.maxWeight || 0);
      const bestLift = Math.max(...allMaxWeights);
      const latestAvgWeight = lastPoint.avgWeight || 0;

      // REPS stats
      const allMaxReps = chartData.map(d => d.maxRepsSet || 0);
      const bestRepsInSet = Math.max(...allMaxReps);
      const lastWorkoutAvgReps = lastPoint.avgRepsSet || 0;

      // TIME stats
      const allMaxTimes = chartData.map(d => d.maxTimeSet || 0);
      const longestSet = Math.max(...allMaxTimes);
      const allTotalTimes = chartData.map(d => d.totalTime || 0);
      const longestWorkout = Math.max(...allTotalTimes);
      const totalDuration = allTotalTimes.reduce((a, b) => a + b, 0);

      return {
          count,
          bestLift,
          latestAvgWeight,
          bestRepsInSet,
          lastWorkoutAvgReps,
          longestSet,
          longestWorkout,
          totalDuration
      };
  }, [chartData]);

  const renderChart = () => {
      if (chartData.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <BarChart2 className="w-8 h-8 mb-2" />
                <p>No data available for this period</p>
            </div>
        );
      }

      // Weighted Graph
      if (type === 'WEIGHT') {
          if (graphMode === 'WEIGHT') {
              return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => new Date(str + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                            tick={{fontSize: 12, fill: '#64748b'}}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(val: number) => [`${Math.round(val)} lbs`, '']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}
                        />
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        <Line type="monotone" name="Max Weight" dataKey="maxWeight" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                        <Line type="monotone" name="Avg Weight" dataKey="avgWeight" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" name="Min Weight" dataKey="minWeight" stroke="#cbd5e1" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
              );
          } else {
              // Weighted -> Reps Graph
               return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => new Date(str + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                            tick={{fontSize: 12, fill: '#64748b'}}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(val: number) => [val, 'Total Reps']}
                        />
                         <Area 
                            type="monotone" 
                            dataKey="totalReps" 
                            name="Total Reps"
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorReps)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
              );
          }
      }

      // Reps Graph
      if (type === 'REPS') {
          return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                        tick={{fontSize: 12, fill: '#64748b'}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(val: number) => [val, 'Total Reps']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="totalReps" 
                        name="Total Reps"
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorReps)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
          );
      }

      // Time Graph
      if (type === 'TIME') {
          return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => new Date(str + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                        tick={{fontSize: 12, fill: '#64748b'}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(val: number) => [`${val}s`, 'Total Duration']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="totalTime" 
                        name="Duration"
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorTime)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
          );
      }

      return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${type === 'WEIGHT' ? 'bg-blue-50 text-blue-600' : (type === 'TIME' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600')}`}>
                            {type} Type
                        </div>
                    </div>
                </div>
                
                {/* Time Range Filter */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['ALL', '1Y', '3M'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${timeRange === range ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {range === 'ALL' ? 'All Time' : range === '1Y' ? '1 Year' : '3 Months'}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="mb-6 relative z-30">
                <ExerciseSelect 
                    exercises={exercises}
                    selectedId={selectedExerciseId}
                    onSelect={setSelectedExerciseId}
                    placeholder="Select exercise to view..."
                />
            </div>

            {/* Weighted Only: Toggle Graph Type */}
            {type === 'WEIGHT' && (
                <div className="flex justify-end mb-4">
                     <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setGraphMode('WEIGHT')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${graphMode === 'WEIGHT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Activity className="w-3 h-3" /> Weight
                        </button>
                        <button
                            onClick={() => setGraphMode('REPS')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${graphMode === 'REPS' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers className="w-3 h-3" /> Reps
                        </button>
                    </div>
                </div>
            )}

            <div className="h-72 w-full">
                {renderChart()}
            </div>
        </div>

        {/* Stats Cards */}
        {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Sessions</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
                </div>

                {type === 'WEIGHT' && (
                    <>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <ArrowUpRight className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-semibold uppercase">Best Lift</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {stats.bestLift} <span className="text-sm font-normal text-slate-400">lbs</span>
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Minus className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-semibold uppercase">Latest Avg</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {Math.round(stats.latestAvgWeight)} <span className="text-sm font-normal text-slate-400">lbs</span>
                            </p>
                        </div>
                    </>
                )}

                {type === 'REPS' && (
                    <>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-semibold uppercase">Max Reps (Set)</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{stats.bestRepsInSet}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                             <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Hash className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-semibold uppercase">Last Avg (Set)</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{Math.round(stats.lastWorkoutAvgReps)}</p>
                        </div>
                    </>
                )}

                {type === 'TIME' && (
                    <>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Timer className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-semibold uppercase">Longest Set</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {stats.longestSet} <span className="text-sm font-normal text-slate-400">s</span>
                            </p>
                        </div>
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-semibold uppercase">Longest Workout</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {Math.floor(stats.longestWorkout / 60)}<span className="text-sm font-normal text-slate-400">m</span> {stats.longestWorkout % 60}<span className="text-sm font-normal text-slate-400">s</span>
                            </p>
                        </div>
                    </>
                )}
            </div>
        )}
    </div>
  );
};

export default Analytics;