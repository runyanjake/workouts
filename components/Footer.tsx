import React from 'react';
import { Github, Globe, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-6">
          <a 
            href="https://github.com/runyanjake/workouts" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="text-sm font-medium">GitHub</span>
          </a>
          <a 
            href="https://whitney.rip" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-medium">PWS Home</span>
          </a>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <span>Built with</span>
          <Heart className="w-3 h-3 text-red-400 fill-red-400" />
          <span>for the PWS Community</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;