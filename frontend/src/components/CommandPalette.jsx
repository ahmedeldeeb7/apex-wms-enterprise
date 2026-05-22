import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Move, Terminal, BarChart2, Package, Map, AlertCircle, FileText } from 'lucide-react';
import useStore from '../store/store';

const CommandPalette = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const navigationCommands = [
    { name: 'Admin Console Overview', path: '/', icon: BarChart2, cat: 'Navigation' },
    { name: 'Inbound Dock Station', path: '/inbound', icon: Package, cat: 'Navigation' },
    { name: 'Inventory Racks Heatmap', path: '/inventory', icon: Map, cat: 'Navigation' },
    { name: 'Outbound Picking Workstation', path: '/outbound', icon: Move, cat: 'Navigation' },
    { name: 'Network Dispatch Batches', path: '/network', icon: Map, cat: 'Navigation' },
    { name: 'Exportable Analytics Reports', path: '/reports', icon: FileText, cat: 'Navigation' }
  ];

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (!query) {
      setResults(navigationCommands);
      return;
    }

    const filtered = navigationCommands.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    // Simulate looking up specific mock product UID
    if (/^\d{8,12}$/.test(query)) {
      filtered.unshift({
        name: `Inspect Inventory UID: ${query}`,
        path: `/inventory?search=${query}`,
        icon: Terminal,
        cat: 'Inventory Lookup'
      });
    }

    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          triggerAction(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, results, selectedIndex]);

  const triggerAction = (command) => {
    setIsCommandPaletteOpen(false);
    navigate(command.path);
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60">
      <div className="w-full max-w-xl overflow-hidden border border-white/10 rounded-2xl bg-[#0b101d]/90 shadow-[0_0_50px_0_rgba(0,198,224,0.15)] glass">
        
        {/* Search input field */}
        <div className="relative flex items-center p-4 border-b border-white/10">
          <Search className="w-5 h-5 mr-3 text-cyan-400/70" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or inventory UID (Ctrl+K to close)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent outline-none text-white placeholder-white/40"
          />
        </div>

        {/* Actionable results */}
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => triggerAction(item)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    isSelected 
                      ? 'bg-cyan-500/20 border-l-4 border-cyan-400 text-white' 
                      : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-white/40'}`} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-xs uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">
                    {item.cat}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-white/40">
              <AlertCircle className="w-8 h-8 mb-2 text-white/20" />
              <p className="text-sm">No commands matched your query</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-4 py-2 text-xs border-t border-white/5 bg-[#070b14]/90 text-white/40">
          <span>Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">↑↓</kbd> keys to select</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">Enter</kbd> to execute</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
export { CommandPalette };
