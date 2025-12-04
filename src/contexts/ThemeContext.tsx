/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useSyncExternalStore,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "quizzer-theme";

// External store for theme state
let themeState = {
  theme: (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || "system",
  resolvedTheme: "light" as ResolvedTheme,
};

const listeners = new Set<() => void>();

const themeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return themeState;
  },
  setState(newState: Partial<typeof themeState>) {
    themeState = { ...themeState, ...newState };
    listeners.forEach((listener) => listener());
  },
};

// Function to get system theme preference
const getSystemTheme = (): ResolvedTheme => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Resolve the actual theme based on mode
const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
};

// Apply theme to document
const applyTheme = (resolved: ResolvedTheme) => {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

// Initialize theme on load
const initialResolved = resolveTheme(themeState.theme);
themeStore.setState({ resolvedTheme: initialResolved });
applyTheme(initialResolved);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const state = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getSnapshot,
  );

  const mediaQueryRef = useRef<MediaQueryList | null>(null);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    const resolved = resolveTheme(newTheme);
    themeStore.setState({ theme: newTheme, resolvedTheme: resolved });
    applyTheme(resolved);
  }, []);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (state.theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryRef.current = mediaQuery;

    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      themeStore.setState({ resolvedTheme: resolved });
      applyTheme(resolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      if (mediaQueryRef.current) {
        mediaQueryRef.current.removeEventListener("change", handleChange);
      }
    };
  }, [state.theme]);

  const value = useMemo(
    () => ({
      theme: state.theme,
      resolvedTheme: state.resolvedTheme,
      setTheme,
    }),
    [state.theme, state.resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
