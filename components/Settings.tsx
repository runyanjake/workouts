import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import * as storageService from '../services/storageService';
import * as googleAuthService from '../services/googleAuthService';
import { Database, DownloadCloud, FileSpreadsheet, LogIn, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

// Environment Variables
// DIRECT ACCESS is required for Vite to replace these values at build time.
// Dynamic access (e.g. import.meta.env[key]) will not work.
// @ts-ignore
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
// @ts-ignore
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

interface SettingsProps {
  onRefresh: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onRefresh }) => {
  const [settings, setSettings] = useState<AppSettings>({ spreadsheetId: '', accessToken: '' });
  const [status, setStatus] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<'NONE' | 'AUTHORIZED'>('NONE');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Debug logging to help troubleshoot configuration
    console.log("PWS Configuration Status:", {
        hasClientId: !!GOOGLE_CLIENT_ID,
        clientIdSnippet: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 5)}...` : 'MISSING',
        hasApiKey: !!GOOGLE_API_KEY,
        envMode: 'Vite (Direct Access)'
    });

    const current = storageService.getSettings();
    setSettings(current);
    if (current.accessToken) {
        setAuthStatus('AUTHORIZED');
    }

    // Initialize scripts
    googleAuthService.initializeGoogleScripts().then(() => {
        if (GOOGLE_CLIENT_ID) {
            googleAuthService.initTokenClient(GOOGLE_CLIENT_ID, handleTokenResponse);
        }
        if (GOOGLE_API_KEY) {
            googleAuthService.initGapiClient(GOOGLE_API_KEY).catch(console.error);
        }
        setIsReady(true);
    });
  }, []);

  const handleTokenResponse = (response: any) => {
      if (response && response.access_token) {
          const newSettings = { 
              ...settings, 
              accessToken: response.access_token,
              tokenExpiry: Date.now() + (response.expires_in * 1000)
          };
          setSettings(newSettings);
          storageService.saveSettings(newSettings);
          setAuthStatus('AUTHORIZED');
          setStatus('Account connected successfully.');
          setTimeout(() => setStatus(''), 3000);
      }
  };

  const handleAuthorize = () => {
      if (!GOOGLE_CLIENT_ID) {
          alert("Missing Google Client ID. Please check environment configuration.");
          return;
      }
      try {
        googleAuthService.requestAccessToken();
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handlePicker = () => {
      if (!GOOGLE_API_KEY || !settings.accessToken || !GOOGLE_CLIENT_ID) {
          alert("API Key, Client ID and Authorization required for File Picker.");
          return;
      }
      
      googleAuthService.createPicker(
          GOOGLE_API_KEY, 
          settings.accessToken, 
          GOOGLE_CLIENT_ID,
          (fileId) => {
            const newSettings = { ...settings, spreadsheetId: fileId };
            setSettings(newSettings);
            storageService.saveSettings(newSettings);
            setStatus('Spreadsheet selected.');
            setTimeout(() => setStatus(''), 3000);
          }
      );
  };

  const handleSeed = async () => {
    if (confirm('This will load default exercises into memory. Continue?')) {
        await storageService.seedDefaults();
        onRefresh(); 
        setStatus('Default exercises loaded.');
        setTimeout(() => setStatus(''), 3000);
    }
  };

  const isConfigured = !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
             <div className="text-sm">
                 <p className="font-bold">Missing Configuration</p>
                 <p className="mb-2">
                    Environment variables <code>VITE_GOOGLE_CLIENT_ID</code> and <code>VITE_GOOGLE_API_KEY</code> are not detected.
                 </p>
                 <ul className="list-disc ml-4 space-y-1 text-xs text-amber-900">
                    <li>Check your <code>.env</code> file or Docker build args.</li>
                    <li>Ensure keys start with <code>VITE_</code>.</li>
                 </ul>
             </div>
        </div>
      )}

      {/* Data Source Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Data Source
        </h2>

        <div className="space-y-6">
            
            {/* Step 1: Authentication */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                    {authStatus === 'AUTHORIZED' ? (
                        <div className="bg-green-100 p-2 rounded-full">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                        </div>
                    ) : (
                        <div className="bg-slate-200 p-2 rounded-full">
                            <LogIn className="w-5 h-5 text-slate-500" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                            {authStatus === 'AUTHORIZED' ? 'Google Account Connected' : 'Connect Google Account'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {authStatus === 'AUTHORIZED' 
                                ? 'You have granted access to manage your workout sheets.' 
                                : 'Sign in to sync your workouts to the cloud.'}
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={handleAuthorize}
                    disabled={!isReady || !isConfigured}
                    className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all whitespace-nowrap ${
                        authStatus === 'AUTHORIZED'
                        ? 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {authStatus === 'AUTHORIZED' ? 'Reconnect Account' : 'Connect'}
                </button>
            </div>

            {/* Step 2: Spreadsheet Selection */}
            {authStatus === 'AUTHORIZED' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${settings.spreadsheetId ? 'bg-green-100' : 'bg-slate-200'}`}>
                            <FileSpreadsheet className={`w-5 h-5 ${settings.spreadsheetId ? 'text-green-600' : 'text-slate-500'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-800 text-sm">Target Spreadsheet</h3>
                            {settings.spreadsheetId ? (
                                <p className="text-xs text-slate-500 font-mono truncate max-w-[200px] sm:max-w-xs" title={settings.spreadsheetId}>
                                    ID: {settings.spreadsheetId}
                                </p>
                            ) : (
                                <p className="text-xs text-amber-600 font-medium">No spreadsheet selected.</p>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handlePicker}
                        disabled={!isReady || !isConfigured}
                        className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap disabled:opacity-50"
                    >
                        {settings.spreadsheetId ? 'Change File' : 'Select File'}
                    </button>
                </div>
            )}

            {status && (
                <div className="text-right text-sm font-medium text-green-600 animate-pulse">
                    {status}
                </div>
            )}

            <div className="text-xs text-slate-400 mt-2 px-1">
                <p>Note: The selected spreadsheet must contain tabs named <strong>Data</strong> and <strong>Exercises</strong>.</p>
            </div>
        </div>
      </div>

      {/* Developer Tools */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Developer Tools</h2>
        <div className="flex gap-4">
             <button 
                onClick={handleSeed}
                className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
                <DownloadCloud className="w-4 h-4" /> Load Demo Data
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;