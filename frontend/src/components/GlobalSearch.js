import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI, reportsAPI } from '../utils/api';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, results, selectedIndex, onClose]);

  useEffect(() => {
    if (query.length > 2) {
      searchItems();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchItems = async () => {
    setLoading(true);
    try {
      const [clientsRes, tasksRes] = await Promise.all([
        clientsAPI.getClients({ search: query }),
        reportsAPI.getActivityReport('all')
      ]);

      const searchResults = [];

      // Add clients
      if (clientsRes.data.success) {
        clientsRes.data.clients.forEach(client => {
          searchResults.push({
            id: client._id,
            type: 'client',
            title: client.name,
            subtitle: client.company,
            icon: '👥',
            url: `/clients/${client._id}`,
            category: 'Clients'
          });
        });
      }

      // Add tasks (simulated from activities)
      if (tasksRes.data.success && tasksRes.data.activityStats) {
        tasksRes.data.activityStats.forEach(activity => {
          if (activity.description?.toLowerCase().includes(query.toLowerCase())) {
            searchResults.push({
              id: activity._id,
              type: 'task',
              title: activity.description,
              subtitle: activity.type,
              icon: '✅',
              url: '/tasks',
              category: 'Tasks'
            });
          }
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    navigate(result.url);
    onClose();
    setQuery('');
  };

  const getResultIcon = (type) => {
    const icons = {
      client: '👥',
      task: '✅',
      invoice: '🧾',
      employee: '👨‍💼',
      report: '📊'
    };
    return icons[type] || '📄';
  };

  const getResultColor = (type) => {
    const colors = {
      client: 'text-blue-600',
      task: 'text-green-600',
      invoice: 'text-purple-600',
      employee: 'text-orange-600',
      report: 'text-indigo-600'
    };
    return colors[type] || 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-6 py-4">
            <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, tasks, invoices..."
              className="flex-1 text-lg border-none outline-none placeholder-gray-400"
            />
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ESC</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-150 ${
                      index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-xl">{getResultIcon(result.type)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{result.title}</div>
                        <div className="text-sm text-gray-600">{result.subtitle}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${getResultColor(result.type)}`}>
                          {result.category}
                        </span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">No results found for "{query}"</p>
                <p className="text-xs mt-1">Try searching for clients, tasks, or invoices</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">Start typing to search...</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">clients</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">tasks</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">invoices</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">reports</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className="px-1 py-0.5 bg-white rounded text-xs mr-1">↑↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center">
                  <kbd className="px-1 py-0.5 bg-white rounded text-xs mr-1">↵</kbd>
                  to select
                </span>
              </div>
              <span>Press <kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl+K</kbd> to open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
