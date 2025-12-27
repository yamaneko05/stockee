"use client";

import { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";

type GroupContextType = {
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

const STORAGE_KEY = "stockee-selected-group";

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      startTransition(() => {
        setSelectedGroupIdState(stored);
      })
    }
    startTransition(() => {
      setIsLoaded(true);
    })
  }, []);

  const setSelectedGroupId = useCallback((id: string | null) => {
    setSelectedGroupIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (!isLoaded) {
    return null;
  }

  return (
    <GroupContext.Provider value={{ selectedGroupId, setSelectedGroupId }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
}
