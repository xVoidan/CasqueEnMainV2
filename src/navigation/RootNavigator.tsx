import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { theme } from '../styles/theme';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import { HomeScreen } from '../screens/main/HomeScreen';

// Types de navigation
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Training: undefined;
  Progress: undefined;
  Ranking: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Constants
const ICON_SIZE = 48;
const TAB_BAR_HEIGHT = 60;
const TAB_BAR_PADDING = 5;
const PLACEHOLDER_TITLE_WIDTH = 120;
const PLACEHOLDER_TITLE_HEIGHT = 20;
const PLACEHOLDER_SUBTITLE_WIDTH = 180;
const PLACEHOLDER_SUBTITLE_HEIGHT = 16;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  placeholderText: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  placeholderTitle: {
    marginBottom: theme.spacing.sm,
  },
  placeholderTitleText: {
    width: PLACEHOLDER_TITLE_WIDTH,
    height: PLACEHOLDER_TITLE_HEIGHT,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
  },
  placeholderSubtitle: {
    width: PLACEHOLDER_SUBTITLE_WIDTH,
    height: PLACEHOLDER_SUBTITLE_HEIGHT,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.sm,
  },
});

// Écrans temporaires pour les tabs
function PlaceholderScreen({ title: _title }: { title: string }): React.ReactElement {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="construct" size={ICON_SIZE} color={theme.colors.gray[400]} />
      <View style={styles.placeholderText}>
        <View style={styles.placeholderTitle}>
          <View style={styles.placeholderTitleText} />
        </View>
        <View style={styles.placeholderSubtitle} />
      </View>
    </View>
  );
}

function AuthNavigator(): React.ReactElement {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator(): React.ReactElement {
  const { isGuest } = useAuth();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Training':
              iconName = focused ? 'school' : 'school-outline';
              break;
            case 'Progress':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Ranking':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray[400],
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray[200],
          paddingBottom: TAB_BAR_PADDING,
          paddingTop: TAB_BAR_PADDING,
          height: TAB_BAR_HEIGHT,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <MainTab.Screen name="Training" options={{ title: 'Entraînement' }}>
        {() => <PlaceholderScreen title="Entraînement" />}
      </MainTab.Screen>
      <MainTab.Screen name="Progress" options={{ title: 'Progrès' }}>
        {() => <PlaceholderScreen title="Progrès" />}
      </MainTab.Screen>
      {!isGuest && (
        <MainTab.Screen name="Ranking" options={{ title: 'Classement' }}>
          {() => <PlaceholderScreen title="Classement" />}
        </MainTab.Screen>
      )}
      <MainTab.Screen name="Profile" options={{ title: 'Profil' }}>
        {() => <PlaceholderScreen title="Profil" />}
      </MainTab.Screen>
    </MainTab.Navigator>
  );
}

export function RootNavigator(): React.ReactElement {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user || isGuest ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
