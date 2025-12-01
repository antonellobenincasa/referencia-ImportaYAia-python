import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemePalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  darkBg: string;
  text: string;
  textLight: string;
}

export const themes: Record<string, ThemePalette> = {
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    primary: '#0A2540', // Deep Ocean
    secondary: '#00C9B7', // Aqua Flow
    accent: '#A4FF00', // Velocity Green
    bg: '#F8FAFB', // Cloud White
    darkBg: '#1F2937', // Dark Gray
    text: '#111827', // Almost Black
    textLight: '#6B7280', // Data Gray
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    primary: '#0369A1', // Sky Blue
    secondary: '#06B6D4', // Cyan
    accent: '#06B6D4', // Cyan
    bg: '#F0F9FF', // Light Blue
    darkBg: '#0C2D44', // Dark Blue
    text: '#0C2D44', // Dark Blue
    textLight: '#475569', // Slate
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    primary: '#15803D', // Green
    secondary: '#10B981', // Emerald
    accent: '#FBBF24', // Golden
    bg: '#F0FDF4', // Light Green
    darkBg: '#0F3725', // Very Dark Green
    text: '#1B4332', // Forest Green
    textLight: '#52B788', // Light Green
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    primary: '#DC2626', // Red
    secondary: '#EA580C', // Orange
    accent: '#FBBF24', // Golden
    bg: '#FEF3C7', // Light Golden
    darkBg: '#7C2D12', // Dark Orange
    text: '#7C2D12', // Dark Orange
    textLight: '#D97706', // Orange
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    primary: '#6D28D9', // Purple
    secondary: '#A78BFA', // Lavender
    accent: '#C084FC', // Light Purple
    bg: '#FAF5FF', // Very Light Purple
    darkBg: '#3E1F47', // Dark Purple
    text: '#4C1D95', // Dark Purple
    textLight: '#7C3AED', // Vivid Purple
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    primary: '#1E1B4B', // Indigo
    secondary: '#4C1D95', // Deep Purple
    accent: '#818CF8', // Indigo Light
    bg: '#F5F3FF', // Light Indigo
    darkBg: '#0F172A', // Very Dark
    text: '#1E1B4B', // Indigo
    textLight: '#6366F1', // Indigo Light
  },
};

interface ThemeContextType {
  currentTheme: ThemePalette;
  setTheme: (themeId: string) => void;
  themes: Record<string, ThemePalette>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentThemeState] = useState<ThemePalette>(themes.corporate);

  useEffect(() => {
    const saved = localStorage.getItem('selectedTheme');
    if (saved && themes[saved]) {
      const theme = themes[saved];
      setCurrentThemeState(theme);
      applyTheme(theme);
    } else {
      applyTheme(themes.corporate);
    }
  }, []);

  const setTheme = (themeId: string) => {
    if (themes[themeId]) {
      const theme = themes[themeId];
      setCurrentThemeState(theme);
      localStorage.setItem('selectedTheme', themeId);
      applyTheme(theme);
    }
  };

  const applyTheme = (theme: ThemePalette) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-bg', theme.bg);
    root.style.setProperty('--theme-dark-bg', theme.darkBg);
    root.style.setProperty('--theme-text', theme.text);
    root.style.setProperty('--theme-text-light', theme.textLight);
    root.style.setProperty('--color-deep-ocean', theme.primary);
    root.style.setProperty('--color-aqua-flow', theme.secondary);
    root.style.setProperty('--color-velocity-green', theme.accent);
    root.style.setProperty('--color-cloud-white', theme.bg);
    
    // Force body styles update
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
