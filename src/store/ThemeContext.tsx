import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface IThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
  white: string;
  black: string;
}

interface ITheme {
  colors: IThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
}

const lightColors: IThemeColors = {
  primary: '#DC2626',
  secondary: '#B91C1C',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
  },
  border: '#E5E7EB',
  white: '#FFFFFF',
  black: '#000000',
};

const darkColors: IThemeColors = {
  primary: '#EF4444',
  secondary: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F87171',
  info: '#60A5FA',
  background: '#111827',
  surface: '#1F2937',
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    disabled: '#6B7280',
  },
  border: '#374151',
  white: '#FFFFFF',
  black: '#000000',
};

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
  },
};

interface IThemeContextType {
  theme: ITheme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<IThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@CasqueEnMain:theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    void loadTheme();
  }, []);

  const loadTheme = async (): Promise<void> => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeModeState(savedTheme);
      }
    } catch (error) {

    }
  };

  const saveTheme = async (mode: ThemeMode): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {

    }
  };

  const setThemeMode = (mode: ThemeMode): void => {
    setThemeModeState(mode);
    void saveTheme(mode);
  };

  const toggleTheme = (): void => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const theme: ITheme = {
    ...baseTheme,
    colors: themeMode === 'light' ? lightColors : darkColors,
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): IThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export du thème par défaut pour compatibilité
export const theme: ITheme = {
  ...baseTheme,
  colors: lightColors,
};
