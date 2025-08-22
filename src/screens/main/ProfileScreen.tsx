import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/store/AuthContext';
import { useUserData } from '@/src/hooks/useUserData';
import { GradeBadge } from '@/src/components/profile/GradeBadge';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';
import { supabase } from '@/src/lib/supabase';
import { styles } from './styles/ProfileScreenStyles';

interface ISessionHistory {
  id: string;
  created_at: string;
  score: number;
  points_earned: number;
  theme_name: string;
  questions_count: number;
  correct_answers: number;
}

export const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, currentGrade, badges, refreshData } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [_showPasswordModal, _setShowPasswordModal] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<ISessionHistory[]>([]);

  // État pour l'édition
  const [editedUsername, setEditedUsername] = useState(profile?.username || '');
  const [editedDepartment, setEditedDepartment] = useState(profile?.department || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setEditedUsername(profile.username);
      setEditedDepartment(profile.department || '');
    }
    if (user) {
      setEditedEmail(user.email || '');
    }
    loadSessionHistory();
  }, [profile, user]);

  const loadSessionHistory = async (): Promise<void> => {
    if (!user) {return;}

    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select(`
          id,
          created_at,
          score,
          points_earned,
          theme_name,
          questions_count,
          correct_answers
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {throw error;}
      setSessionHistory(data || []);
    } catch (error) {

    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), loadSessionHistory()]);
    setRefreshing(false);
  }, [refreshData]);

  const pickImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && user) {
      setLoading(true);
      try {
        // Upload de l'image vers Supabase Storage
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: fileName,
        } as any);

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData);

        if (uploadError) {throw uploadError;}

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Mettre à jour le profil
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ avatar_url: urlData.publicUrl })
          .eq('user_id', user.id);

        if (updateError) {throw updateError;}

        await refreshData();
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (error) {

        Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
      } finally {
        setLoading(false);
      }
    }
  };

  const saveProfile = async (): Promise<void> => {
    if (!user) {return;}

    setLoading(true);
    try {
      // Vérifier l'unicité du username
      if (editedUsername !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', editedUsername)
          .single();

        if (existingUser) {
          Alert.alert('Erreur', 'Ce nom d\'utilisateur est déjà pris');
          return;
        }
      }

      // Mettre à jour le profil
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: editedUsername,
          department: editedDepartment,
        })
        .eq('user_id', user.id);

      if (error) {throw error;}

      // Mettre à jour l'email si modifié
      if (editedEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editedEmail,
        });
        if (emailError) {throw emailError;}
      }

      await refreshData();
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (error) {

      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = (): void => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon Profil</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Ionicons
                name={isEditing ? 'checkmark' : 'create-outline'}
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Section Avatar */}
          <FadeInView duration={600} delay={0}>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickImage} disabled={loading}>
                <View style={styles.avatarContainer}>
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.defaultAvatar]}>
                      <Ionicons name="person" size={40} color={theme.colors.white} />
                    </View>
                  )}
                  <View style={styles.editAvatarButton}>
                    <Ionicons name="camera" size={16} color={theme.colors.white} />
                  </View>
                </View>
              </TouchableOpacity>

              {isEditing ? (
                <TextInput
                  style={styles.usernameInput}
                  value={editedUsername}
                  onChangeText={setEditedUsername}
                  placeholder="Nom d'utilisateur"
                />
              ) : (
                <Text style={styles.username}>{profile.username}</Text>
              )}

              {isEditing ? (
                <TextInput
                  style={styles.departmentInput}
                  value={editedDepartment}
                  onChangeText={setEditedDepartment}
                  placeholder="Département"
                />
              ) : (
                <Text style={styles.department}>{profile.department || 'Non renseigné'}</Text>
              )}

              <View style={styles.gradeContainer}>
                <GradeBadge grade={currentGrade} size="large" showPoints points={profile.total_points} />
              </View>
            </View>
          </FadeInView>

          {/* Section Informations */}
          <FadeInView duration={600} delay={100}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations</Text>

              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
                {isEditing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editedEmail}
                    onChangeText={setEditedEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.infoText}>{user?.email}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => setShowPasswordModal(true)}
              >
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>Changer le mot de passe</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>

              <View style={styles.infoRow}>
                <Ionicons name="moon-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>Mode sombre</Text>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#767577', true: theme.colors.primary }}
                />
              </View>
            </View>
          </FadeInView>

          {/* Section Statistiques */}
          <FadeInView duration={600} delay={200}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statistiques</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.total_points.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Points totaux</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.sessions_completed}</Text>
                  <Text style={styles.statLabel}>Sessions</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatDuration(profile.total_time_played)}</Text>
                  <Text style={styles.statLabel}>Temps total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.best_score}%</Text>
                  <Text style={styles.statLabel}>Meilleur score</Text>
                </View>
              </View>

              {/* Collection de badges */}
              <Text style={styles.subsectionTitle}>Badges obtenus ({badges.length})</Text>
              <View style={styles.badgeGrid}>
                {badges.map((badge) => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Section Historique */}
          <FadeInView duration={600} delay={300}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historique récent</Text>

              {sessionHistory.map((session) => (
                <View key={session.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyTheme}>{session.theme_name}</Text>
                    <Text style={styles.historyDate}>{formatDate(session.created_at)}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyScore}>
                      {session.correct_answers}/{session.questions_count}
                    </Text>
                    <Text style={styles.historyPoints}>+{session.points_earned} pts</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Bouton Déconnexion */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.white} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </LinearGradient>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={loading}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.saveGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color={theme.colors.white} />
                    <Text style={styles.saveText}>Enregistrer</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
