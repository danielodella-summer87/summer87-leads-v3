"use client";

import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  requestConstructorMockAI,
  type ConstructorMockAISuggestion,
  type RequestConstructorMockAIInput,
} from "./client";

type UseConstructorMockAIResult = {
  suggestions: ConstructorMockAISuggestion[];
  loading: boolean;
  error: string | null;
  request: (
    input: RequestConstructorMockAIInput
  ) => Promise<ConstructorMockAISuggestion[]>;
  clear: () => void;
  setSuggestions: Dispatch<SetStateAction<ConstructorMockAISuggestion[]>>;
};

export function useConstructorMockAI(): UseConstructorMockAIResult {
  const [suggestions, setSuggestions] = useState<ConstructorMockAISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  const request = useCallback(async (input: RequestConstructorMockAIInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestConstructorMockAI(input);

      if (!response.ok) {
        setSuggestions([]);
        setError(response.error ?? "No se pudo obtener sugerencia IA mock.");
        return [];
      }

      const nextSuggestions = response.suggestions ?? [];
      setSuggestions(nextSuggestions);
      return nextSuggestions;
    } catch {
      setSuggestions([]);
      setError("Error de red al consultar sugerencia IA mock.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    request,
    clear,
    setSuggestions,
  };
}
