import React, { useState, useEffect } from 'react';
import { X, Key, Check } from 'lucide-react';

const SettingsModal = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chess_gemini_key');
    if (saved) setApiKey(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem('chess_gemini_key', apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('chess_gemini_key');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* API Key Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Key size={16} />
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Get a free API key at{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                aistudio.google.com
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Used for AI-powered game analysis and move explanations.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={!apiKey}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <Check size={18} /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-400 text-center">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;