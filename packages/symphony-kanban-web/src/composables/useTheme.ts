import { ref, watch } from "vue";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "symphony-theme";
const theme = ref<ThemeMode>("light");
let initialized = false;

const applyTheme = (value: ThemeMode) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(`theme-${value}`);
};

const initTheme = () => {
  if (initialized) return;
  initialized = true;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      theme.value = stored;
    }
  }
  applyTheme(theme.value);
  watch(
    theme,
    (value) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, value);
      }
      applyTheme(value);
    },
    { immediate: false },
  );
};

export const useTheme = () => {
  initTheme();
  const setTheme = (value: ThemeMode) => {
    theme.value = value;
  };
  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };
  return {
    theme,
    setTheme,
    toggleTheme,
  };
};
