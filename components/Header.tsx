import React from 'react';
import { User } from '../types';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="relative text-center mb-10">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
        Link Summarizer
      </h1>
      <p className="text-slate-400 mt-2">Your personal AI-powered link aggregator.</p>
      {user && (
        <div className="absolute top-0 right-0 flex items-center gap-4">
            <div className="flex items-center text-slate-300">
                <span className="text-sm font-medium hidden sm:inline">{user.email}</span>
            </div>
            <button
                onClick={onLogout}
                className="bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-lg hover:bg-slate-600 hover:text-white transition-colors"
                aria-label="Sign out"
            >
                <span className="text-sm">Sign Out</span>
            </button>
        </div>
      )}
    </header>
  );
};

export default Header;