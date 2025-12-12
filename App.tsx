import React, { useState, useEffect } from 'react';
import Tracker from './components/Tracker';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Browse from './components/Browse';
import Header from './components/Header';
import Footer from './components/Footer';
import { TabView, WorkoutLog, ExerciseDef } from './types';
import * as storageService from './services/storageService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.TRACKER);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<ExerciseDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const l = await storageService.getLogs();
    const e = await storageService.getExercises();
    setLogs(l);
    setExercises(e);
  };

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        // Load local data first
        await fetchData();
        
        // Attempt auto-sync if credentials exist
        const settings = storageService.getSettings();
        if (settings.spreadsheetId && settings.accessToken) {
            setSyncing(true);
            try {
                await storageService.pullDataFromSheets();
                await fetchData();
            } catch (error) {
                console.error("Auto-sync failed:", error);
            }
            setSyncing(false);
        }
        setLoading(false);
    };
    init();
  }, []);

  const handlePull = async () => {
    setSyncing(true);
    try {
        const result = await storageService.pullDataFromSheets();
        await fetchData();
        if (result.message) alert(result.message);
    } catch (error: any) {
        alert("Sync Failed: " + error.message);
    }
    setSyncing(false);
  };

  const handlePush = async () => {
    setSaving(true);
    try {
        const result = await storageService.pushDataToSheets();
        if (result.message) alert(result.message);
    } catch (error: any) {
        alert("Save Failed: " + error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSync={handlePull}
        onSave={handlePush}
        isSyncing={syncing}
        isSaving={saving}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {activeTab === TabView.TRACKER && (
          <Tracker 
            logs={logs} 
            exercises={exercises} 
            onUpdate={fetchData} 
          />
        )}
        {activeTab === TabView.ANALYTICS && (
          <Analytics 
            logs={logs} 
            exercises={exercises} 
          />
        )}
        {activeTab === TabView.BROWSE && (
            <Browse exercises={exercises} />
        )}
        {activeTab === TabView.SETTINGS && (
          <Settings onRefresh={fetchData} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;