import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

export const OfflineNotice: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable);
      setIsOffline(offline);

      Animated.timing(slideAnim, {
        toValue: offline ? 0 : -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color={theme.colors.white} />
        <Text style={styles.text}>Mode hors ligne</Text>
        <Text style={styles.subtext}>Certaines fonctionnalités sont limitées</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.warning,
    zIndex: 9999,
    paddingTop: 40, // Pour la safe area
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  text: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.sm,
  },
});