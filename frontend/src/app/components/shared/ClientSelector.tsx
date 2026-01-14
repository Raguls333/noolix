import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { listClients, type Client as ApiClient } from "../../../api/clients";

interface ClientSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  className?: string;
}

const DEFAULT_PAGE_SIZE = 200;

export function ClientSelector({ 
  value, 
  onChange, 
  multiSelect = false, 
  placeholder = 'Select client',
  className = '' 
}: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [clientsById, setClientsById] = useState<Record<string, ApiClient>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchClients = useCallback(async (query: string) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await listClients({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        q: query || undefined,
      });

      if (requestId !== requestIdRef.current) return;

      const nextClients = res.clients ?? [];
      setClients(nextClients);
      setClientsById((prev) => {
        const next = { ...prev };
        nextClients.forEach((client) => {
          next[client._id] = client;
        });
        return next;
      });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadError("Unable to load clients");
      setClients([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchClients("");
  }, [fetchClients]);

  useEffect(() => {
    if (!isOpen) return;
    const query = searchQuery.trim();
    const handle = setTimeout(() => {
      fetchClients(query);
    }, 250);
    return () => clearTimeout(handle);
  }, [isOpen, searchQuery, fetchClients]);

  const selectedClients = useMemo(
    () => value.map((id) => clientsById[id]).filter(Boolean),
    [value, clientsById]
  );
  const optionClients = useMemo(() => {
    const seen = new Set<string>();
    const merged: ApiClient[] = [];
    const add = (client: ApiClient) => {
      if (!seen.has(client._id)) {
        seen.add(client._id);
        merged.push(client);
      }
    };
    clients.forEach(add);
    selectedClients.forEach(add);
    return merged;
  }, [clients, selectedClients]);
  
  const displayText = value.length === 0
    ? placeholder
    : value.length === 1 && selectedClients.length === 1
    ? selectedClients[0].name
    : `${value.length} client${value.length === 1 ? "" : "s"} selected`;

  const handleToggle = (clientId: string) => {
    if (multiSelect) {
      if (value.includes(clientId)) {
        onChange(value.filter(id => id !== clientId));
      } else {
        onChange([...value, clientId]);
      }
    } else {
      onChange([clientId]);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 h-11 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F4F5F7] transition-colors text-left"
      >
        <span className={`text-[14px] ${value.length === 0 ? 'text-[#9CA3AF]' : 'text-[#0F172A]'}`}>
          {displayText}
        </span>
        <ChevronDown className={`w-[18px] h-[18px] text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 max-h-80 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-[#E5E7EB]">
            <div className="relative">
              <Search className="w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-[14px] bg-[#F4F5F7] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-60">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-[14px] text-[#9CA3AF]">
                Loading clients...
              </div>
            ) : loadError ? (
              <div className="px-4 py-6 text-center text-[14px] text-[#9CA3AF]">
                {loadError}
              </div>
            ) : optionClients.length === 0 ? (
              <div className="px-4 py-6 text-center text-[14px] text-[#9CA3AF]">
                No clients found
              </div>
            ) : (
              optionClients.map((client) => {
                const isSelected = value.includes(client._id);
                
                return (
                  <button
                    type="button"
                    key={client._id}
                    onClick={() => handleToggle(client._id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F4F5F7] transition-colors text-left"
                  >
                    <span className="text-[14px] text-[#0F172A]">{client.name}</span>
                    {isSelected && (
                      <Check className="w-[18px] h-[18px] text-[#4F46E5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Clear button for multi-select */}
          {multiSelect && value.length > 0 && (
            <div className="p-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[13px] text-[#6B7280] hover:text-[#0F172A] font-medium"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
