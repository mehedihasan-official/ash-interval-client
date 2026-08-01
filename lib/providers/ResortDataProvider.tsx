"use client";

// Fetches the full resort dataset once, app-wide, and shares it via
// context. The country -> region -> resort browsing flow needs every
// resort available client-side to derive an accurate list of countries
// and regions (that can't come from a single paginated page of results),
// so this loads everything up front rather than re-fetching per page.
import { fetchAllResorts } from "@/lib/api/resorts";
import type { Resort } from "@/lib/types/resort";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface ResortDataContextType {
  resorts: Resort[];
  loading: boolean;
  error: string | null;
  // Re-runs the fetch (e.g. for a "try again" button after a failure).
  reload: () => void;
}

const ResortDataContext = createContext<ResortDataContextType | null>(null);

export const ResortDataProvider = ({ children }: { children: ReactNode }) => {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    let isCancelled = false;

    const loadResorts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllResorts();
        if (isCancelled) return;
        setResorts(data);
      } catch (err) {
        if (isCancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load resorts. Please try again.",
        );
        setResorts([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadResorts();

    return () => {
      isCancelled = true;
    };
  }, [reloadCount]);


  console.log(resorts)
  return (
    <ResortDataContext.Provider value={{ resorts, loading, error, reload }}>
      {children}
    </ResortDataContext.Provider>
  );
};

// Convenience hook so components can call useResortData() instead of
// useContext(ResortDataContext) + null-checking every time.
export const useResortData = () => {
  const context = useContext(ResortDataContext);
  if (!context) {
    throw new Error("useResortData must be used within a ResortDataProvider");
  }
  return context;
};
