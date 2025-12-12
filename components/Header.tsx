import React from 'react';
import { TabView } from '../types';
import { Download, CloudUpload, Dumbbell, LayoutDashboard, Search, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: TabView;
  setActiveTab: (tab: TabView) => void;
  onSync: () => void;
  onSave: () => void;
  isSyncing: boolean;
  isSaving: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  onSync, 
  onSave, 
  isSyncing, 
  isSaving 
}) => {
  
  const tabs = [
    { id: TabView.TRACKER, label: 'Tracker', icon: Dumbbell },
    { id: TabView.ANALYTICS, label: 'Analytics', icon: LayoutDashboard },
    { id: TabView.BROWSE, label: 'Browse', icon: Search },
    { id: TabView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      {/* Top Bar: Logo & Actions */}
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
          </div>
          <h1 className="font-bold text-lg tracking-tight text-slate-800 hidden sm:block">PWS Workouts</h1>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={onSync} 
              disabled={isSyncing || isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              title="Sync from Google Sheets"
            >
              <Download className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button 
              onClick={onSave} 
              disabled={isSyncing || isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSaving ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}
              title="Save to Google Sheets"
            >
              <CloudUpload className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
              <span className="sm:hidden">Save</span>
            </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-3xl mx-auto px-2 sm:px-4">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-1 sm:flex-none justify-center
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;