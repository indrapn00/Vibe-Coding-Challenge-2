import React, { useState } from 'react';

interface LinkInputFormProps {
  onAddLink: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

const LinkInputForm: React.FC<LinkInputFormProps> = ({ onAddLink, isLoading, error }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAddLink(url);
      setUrl('');
    }
  };

  return (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Add a new link</h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full flex-grow bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                disabled={isLoading}
                required
            />
            <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed disabled:text-slate-400 transition-colors"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    'Add Link'
                )}
            </button>
        </form>
        {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
    </div>
  );
};

export default LinkInputForm;