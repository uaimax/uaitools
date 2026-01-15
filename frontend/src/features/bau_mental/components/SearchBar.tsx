/** Campo de busca textual nas notas. */

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBauMentalStore } from "../stores/bau-mental-store";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Buscar notas...",
  className = "",
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const onSearchRef = useRef(onSearch);
  const lastUpdatedRef = useRef<string>("");
  const isInitialMount = useRef(true);

  const {
    setSearchQuery,
    addToSearchHistory,
    searchHistory,
  } = useBauMentalStore();

  // Atualizar ref quando onSearch mudar
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounce para busca
  useEffect(() => {
    // No primeiro mount, se estiver vazio, não fazer nada
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (localQuery === "") {
        return;
      }
    }

    // Só atualizar se o valor realmente mudou
    if (lastUpdatedRef.current === localQuery) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const timeoutId = setTimeout(() => {
      // Verificar novamente antes de atualizar (pode ter mudado durante o debounce)
      if (lastUpdatedRef.current !== localQuery) {
        lastUpdatedRef.current = localQuery;
        setSearchQuery(localQuery);
        if (onSearchRef.current) {
          onSearchRef.current(localQuery);
        }
      }
    }, localQuery.length > 0 ? 300 : 0); // Sem delay se estiver vazio

    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQuery]); // setSearchQuery é estável do Zustand, não precisa estar nas dependências

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localQuery.trim();
    if (trimmed) {
      addToSearchHistory(trimmed);
      setSearchQuery(trimmed);
      if (onSearch) {
        onSearch(trimmed);
      }
    }
  };

  const handleClear = () => {
    setLocalQuery("");
    lastUpdatedRef.current = "";
    setSearchQuery("");
    if (onSearchRef.current) {
      onSearchRef.current("");
    }
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />

        {localQuery && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Histórico de buscas (opcional, quando focado) */}
      {isFocused && searchHistory.length > 0 && localQuery.length === 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-md shadow-lg z-[100] max-h-60 overflow-auto">
          {searchHistory.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
              onClick={() => {
                setLocalQuery(item);
                inputRef.current?.focus();
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
