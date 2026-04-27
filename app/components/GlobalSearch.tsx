"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  status?: string;
  priority?: string;
  lowStock?: boolean;
}

interface SearchResults {
  machines: SearchResult[];
  workOrders: SearchResult[];
  parts: SearchResult[];
  maintenanceTasks: SearchResult[];
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation + Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K opens search from anywhere on the page
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        if (query.length >= 2) setIsOpen(true);
        return;
      }

      if (!isOpen || !results) return;

      const totalResults = getTotalResults();
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalResults);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
          break;
        case 'Enter':
          e.preventDefault();
          handleSelectResult(selectedIndex);
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setIsOpen(true);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return (
      (results.machines?.length || 0) +
      (results.workOrders?.length || 0) +
      (results.parts?.length || 0) +
      (results.maintenanceTasks?.length || 0)
    );
  };

  const getAllResultsFlat = (): SearchResult[] => {
    if (!results) return [];
    return [
      ...(results.machines || []),
      ...(results.workOrders || []),
      ...(results.parts || []),
      ...(results.maintenanceTasks || []),
    ];
  };

  const handleSelectResult = (index: number) => {
    const allResults = getAllResultsFlat();
    if (allResults[index]) {
      router.push(allResults[index].url);
      setIsOpen(false);
      setQuery('');
      setResults(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'machine':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        );
      case 'work-order':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'part':
        return (
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        );
      case 'maintenance-task':
        return (
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'machine': return 'Equipment';
      case 'work-order': return 'Work Order';
      case 'part': return 'Part';
      case 'maintenance-task': return 'Maintenance';
      default: return type;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search equipment, work orders, parts..."
          className="w-64 md:w-80 pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:outline-none transition-colors"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
        {/* Keyboard shortcut hint */}
        <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 gap-0.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-200 rounded">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-200 rounded">K</kbd>
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && results && getTotalResults() > 0 && (
        <div className="absolute top-full left-0 mt-2 w-96 max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-2">
            {results.machines && results.machines.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipment</div>
                {results.machines.map((machine, idx) => {
                  const globalIndex = idx;
                  return (
                    <button
                      key={machine.id}
                      onClick={() => handleSelectResult(globalIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {getTypeIcon(machine.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{machine.title}</p>
                        <p className="text-xs text-gray-500 truncate">{machine.subtitle}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        machine.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700' :
                        machine.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {machine.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {results.workOrders && results.workOrders.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Work Orders</div>
                {results.workOrders.map((wo, idx) => {
                  const globalIndex = (results.machines?.length || 0) + idx;
                  return (
                    <button
                      key={wo.id}
                      onClick={() => handleSelectResult(globalIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {getTypeIcon(wo.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{wo.title}</p>
                        <p className="text-xs text-gray-500 truncate">{wo.subtitle}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        wo.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        wo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {wo.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {results.parts && results.parts.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Parts</div>
                {results.parts.map((part, idx) => {
                  const globalIndex = (results.machines?.length || 0) + (results.workOrders?.length || 0) + idx;
                  return (
                    <button
                      key={part.id}
                      onClick={() => handleSelectResult(globalIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {getTypeIcon(part.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{part.title}</p>
                        <p className="text-xs text-gray-500 truncate">{part.subtitle}</p>
                      </div>
                      {part.lowStock && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Low Stock</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {results.maintenanceTasks && results.maintenanceTasks.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Maintenance</div>
                {results.maintenanceTasks.map((task, idx) => {
                  const globalIndex = (results.machines?.length || 0) + (results.workOrders?.length || 0) + (results.parts?.length || 0) + idx;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleSelectResult(globalIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {getTypeIcon(task.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 truncate">{task.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{getTotalResults()} results</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">↵</kbd> select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">esc</kbd> close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && results && getTotalResults() === 0 && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-8 text-center">
          <svg className="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}