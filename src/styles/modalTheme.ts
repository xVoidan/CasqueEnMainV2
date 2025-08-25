// Thème unifié pour tous les modaux - Style Pompier
export const modalTheme = {
  colors: {
    // Couleurs principales pompier
    primary: '#DC2626',        // Rouge pompier
    primaryDark: '#991B1B',    // Rouge foncé
    secondary: '#EA580C',      // Orange urgence
    secondaryDark: '#C2410C',  // Orange foncé

    // Couleurs de statut
    success: '#10B981',        // Vert validation
    warning: '#F59E0B',        // Jaune attention
    danger: '#EF4444',         // Rouge danger
    info: '#3B82F6',          // Bleu information

    // Fond et surfaces
    background: '#0F0F1A',     // Fond très sombre
    surface: '#1A1A2E',        // Surface des cartes
    surfaceLight: 'rgba(255, 255, 255, 0.05)',

    // Textes
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    textTertiary: 'rgba(255, 255, 255, 0.6)',

    // Bordures
    border: 'rgba(220, 38, 38, 0.3)',      // Bordure rouge subtile
    borderLight: 'rgba(255, 255, 255, 0.1)',
  },

  gradients: {
    primary: ['#DC2626', '#991B1B'],       // Gradient rouge pompier
    secondary: ['#EA580C', '#C2410C'],     // Gradient orange
    success: ['#10B981', '#059669'],       // Gradient vert
    danger: ['#EF4444', '#DC2626'],        // Gradient danger
    dark: ['#1A1A2E', '#0F0F1A'],         // Gradient sombre
  },

  typography: {
    title: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
    },
    subtitle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    button: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    label: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    value: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  shadows: {
    modal: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.5,
      shadowRadius: 30,
      elevation: 20,
    },
  },
};
