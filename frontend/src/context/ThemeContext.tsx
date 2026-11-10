import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppTheme = 'pastel' | 'playful' | 'cyber';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  tagline: string;
  primaryColor: string;
  lightPrimary: string;
  canvasBg: string;
  accentMint: string;
  accentPeach: string;
  accentGold: string;
  previewGradient: string;
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  pastel: {
    id: 'pastel',
    name: 'Modern Pastel Campus',
    tagline: 'Modern student hub with soft lavender, cream, mint & peach',
    primaryColor: '#7652C8',
    lightPrimary: '#A78BFA',
    canvasBg: '#FFF8EF',
    accentMint: '#E1F7EE',
    accentPeach: '#FFEBE2',
    accentGold: '#FFE38A',
    previewGradient: 'from-[#7652C8] via-[#A78BFA] to-[#F6B8D0]',
  },
  playful: {
    id: 'playful',
    name: 'Playful EdTech',
    tagline: 'Vibrant Duolingo-inspired electric indigo & sunshine gamification',
    primaryColor: '#4318FF',
    lightPrimary: '#6C5CE7',
    canvasBg: '#F4F7FE',
    accentMint: '#00B512',
    accentPeach: '#FF7043',
    accentGold: '#FFB547',
    previewGradient: 'from-[#4318FF] via-[#00B512] to-[#FFB547]',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Tech Academy',
    tagline: 'Futuristic coding bootcamp neon violet & sleek dark slate',
    primaryColor: '#6366F1',
    lightPrimary: '#818CF8',
    canvasBg: '#0B0F19',
    accentMint: '#06B6D4',
    accentPeach: '#F43F5E',
    accentGold: '#FBBF24',
    previewGradient: 'from-[#0B0F19] via-[#6366F1] to-[#06B6D4]',
  },
};

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yapwise_theme') as AppTheme;
      if (stored && THEMES[stored]) return stored;
    }
    return 'pastel';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yapwise_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.className = `theme-${newTheme}`;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.className = `theme-${theme}`;
    }
  }, [theme]);

  const config = THEMES[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
