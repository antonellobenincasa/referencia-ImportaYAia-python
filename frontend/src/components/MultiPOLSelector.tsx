import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { Search, MapPin, Ship, X, Loader2, Plus, Check } from 'lucide-react';

interface LocationResult {
  id: number;
  name: string;
  country: string;
  region?: string;
  code?: string;
  display_name?: string;
}

interface SelectedPOL {
  name: string;
  country: string;
  code?: string;
  display_name: string;
}

interface MultiPOLSelectorProps {
  selectedPOLs: SelectedPOL[];
  onChange: (pols: SelectedPOL[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxSelections?: number;
}

export default function MultiPOLSelector({
  selectedPOLs,
  onChange,
  label = "POL Puertos de Origen",
  required = false,
  disabled = false,
  maxSelections = 10,
}: MultiPOLSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const response = await api.searchPorts(searchQuery, 15);
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
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (query) {
        searchLocations(query);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchLocations]);

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
    const alreadySelected = selectedPOLs.some(p => p.name === item.name && p.country === item.country);
    
    if (!alreadySelected && selectedPOLs.length < maxSelections) {
      const newPOL: SelectedPOL = {
        name: item.name,
        country: item.country,
        code: item.code,
        display_name: item.display_name || `${item.name}, ${item.country}`,
      };
      onChange([...selectedPOLs, newPOL]);
    }
    
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (index: number) => {
    const updated = selectedPOLs.filter((_, i) => i !== index);
    onChange(updated);
  };

  const isSelected = (item: LocationResult) => {
    return selectedPOLs.some(p => p.name === item.name && p.country === item.country);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
          <span className="text-xs text-gray-500 font-normal ml-2">
            (Seleccione uno o más puertos)
          </span>
        </label>
      )}
      
      {selectedPOLs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedPOLs.map((pol, index) => (
            <div 
              key={`${pol.name}-${index}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#00C9B7]/20 to-[#A4FF00]/20 border border-[#00C9B7]/40 rounded-full text-sm"
            >
              <Ship className="w-3.5 h-3.5 text-[#00C9B7]" />
              <span className="font-medium text-[#0A2540]">{pol.name}</span>
              {pol.code && (
                <span className="text-xs text-gray-500 font-mono">{pol.code}</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                disabled={disabled}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Plus className="h-5 w-5 text-[#00C9B7]" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={selectedPOLs.length === 0 ? "Buscar puerto origen (ej: Shanghai, Ningbo, Qingdao)..." : "Agregar otro puerto..."}
          disabled={disabled || selectedPOLs.length >= maxSelections}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C9B7] focus:border-[#00C9B7] transition-colors bg-white disabled:bg-gray-100"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {loading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((item) => {
            const alreadyAdded = isSelected(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                disabled={alreadyAdded}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                  alreadyAdded 
                    ? 'bg-gray-50 cursor-not-allowed' 
                    : 'hover:bg-gradient-to-r hover:from-[#00C9B7]/10 hover:to-[#A4FF00]/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alreadyAdded ? (
                    <Check className="h-4 w-4 text-[#00C9B7] mt-0.5 flex-shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${alreadyAdded ? 'text-gray-500' : 'text-gray-900'}`}>
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{item.country}</span>
                      {item.code && (
                        <span className="px-1.5 py-0.5 bg-[#0A2540]/10 text-[#0A2540] text-xs rounded font-mono">
                          {item.code}
                        </span>
                      )}
                    </div>
                  </div>
                  {alreadyAdded && (
                    <span className="text-xs text-[#00C9B7] font-medium">Agregado</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No se encontraron puertos para "{query}"</p>
        </div>
      )}

      {required && selectedPOLs.length === 0 && (
        <input 
          type="text" 
          required 
          value="" 
          onChange={() => {}} 
          className="absolute opacity-0 h-0 w-0" 
          tabIndex={-1}
        />
      )}
    </div>
  );
}
