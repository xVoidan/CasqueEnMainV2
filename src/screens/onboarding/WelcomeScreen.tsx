import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/common/Button';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase';
import { theme } from '../../styles/theme';

const AVATAR_SIZE = 120;
const ICON_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.xxxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  infoIcon: {
    marginRight: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  featuresContainer: {
    marginVertical: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  actionContainer: {
    marginTop: 'auto',
    paddingVertical: theme.spacing.xl,
  },
  skipButton: {
    marginTop: theme.spacing.md,
  },
});

const features = [
  {
    icon: 'school',
    title: 'Quiz personnalisés',
    description: 'Entraînez-vous selon votre niveau',
  },
  {
    icon: 'trophy',
    title: 'Classements',
    description: 'Comparez-vous aux autres candidats',
  },
  {
    icon: 'trending-up',
    title: 'Progression',
    description: 'Suivez vos performances jour après jour',
  },
];

export function WelcomeScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<void> => {
    if (!user) {return;}

    try {
      setUploading(true);

      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true });

      if (uploadError) {throw uploadError;}

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {throw updateError;}
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = (): void => {
    router.push('/onboarding/notifications');
  };

  const handleSkip = (): void => {
    router.replace('/(tabs)');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView duration={600} delay={0}>
            <View style={styles.header}>
              <Text style={styles.title}>Bienvenue ! 🎉</Text>
              <Text style={styles.subtitle}>
                Personnalisons votre expérience
              </Text>
            </View>
          </FadeInView>

          <FadeInView duration={600} delay={200}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons
                        name="person"
                        size={60}
                        color={theme.colors.gray[400]}
                      />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={pickImage}
                  disabled={uploading}
                >
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarText}>
                Ajoutez une photo de profil
              </Text>
            </View>
          </FadeInView>

          <FadeInView duration={600} delay={400}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-circle"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
                  <Text style={styles.infoValue}>{user?.user_metadata?.username || 'Pompier'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="location"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>Département</Text>
                  <Text style={styles.infoValue}>{user?.user_metadata?.department || 'Non défini'}</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          <FadeInView duration={600} delay={600}>
            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name={feature.icon as any}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          <FadeInView duration={600} delay={800}>
            <View style={styles.actionContainer}>
              <Button
                title="Configurer les notifications"
                size="large"
                onPress={handleContinue}
                fullWidth
              />
              <Button
                title="Passer cette étape"
                variant="ghost"
                size="medium"
                onPress={handleSkip}
                fullWidth
                style={styles.skipButton}
              />
            </View>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
