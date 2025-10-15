import { useEffect, useRef, useState } from 'react';

export function usePersistedDraft<T = any>(key: string, initial: T) {
  const [draft, setDraft] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(draft));
      } catch (error) {
        console.error('Failed to persist draft:', error);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [key, draft]);

  const clearDraft = () => {
    localStorage.removeItem(key);
    setDraft(initial);
  };

  return { draft, setDraft, clearDraft, draftId: key };
}
