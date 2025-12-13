import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { Search, MapPin, Plane, Ship, ChevronDown, X, Loader2 } from 'lucide-react';

interface LocationResult {
  id: number;
  name: string;
  country: string;
  region?: string;
  code?: string;
  display_name?: string;
}

interface SmartLocationSelectorProps {
  type: 'port' | 'airport';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function SmartLocationSelector({
  type,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
}: SmartLocationSelectorProps) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LocationResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = type === 'port' 
        ? await api.searchPorts(searchQuery, 15)
        : await api.searchAirports(searchQuery, 15);
      
      const data = response.data?.results || response.data || [];
      setResults(data.map((item: any) => ({
        id: item.id,
        name: item.name || item.ciudad_exacta || item.display_name,
        country: item.country,
        region: item.region_name || item.region,
        code: item.un_locode || item.iata_code,
        display_name: item.display_name || `${item.name || item.ciudad_exacta}, ${item.country}`,
      })));
    } catch (error) {
      console.error('Error searching locations:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (query && !selectedItem) {
        searchLocations(query);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchLocations, selectedItem]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LocationResult) => {
    const displayValue = item.display_name || `${item.name}, ${item.country}`;
    setQuery(displayValue);
    setSelectedItem(item);
    onChange(item.name);
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedItem(null);
    onChange('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedItem(null);
    setIsOpen(true);
    if (newValue === '') {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    if (query.length >= 2 && !selectedItem) {
      setIsOpen(true);
    }
  };

  const Icon = type === 'port' ? Ship : Plane;
  const defaultPlaceholder = type === 'port' 
    ? 'Buscar puerto (ej: Shanghai, Rotterdam)...' 
    : 'Buscar aeropuerto (ej: Miami, Hong Kong)...';

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-[#00C9B7]" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder || defaultPlaceholder}
          disabled={disabled}
          required={required}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7] transition-colors bg-white disabled:bg-gray-100"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {loading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-[#00C9B7]/10 hover:to-[#A4FF00]/10 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#00C9B7] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{item.country}</span>
                    {item.code && (
                      <span className="px-1.5 py-0.5 bg-[#0A2540]/10 text-[#0A2540] text-xs rounded font-mono">
                        {item.code}
                      </span>
                    )}
                    {item.region && (
                      <span className="text-gray-400 text-xs">{item.region}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No se encontraron resultados para "{query}"</p>
          <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
        </div>
      )}
    </div>
  );
}
