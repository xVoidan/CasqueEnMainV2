import React, { useState, useCallback, useRef } from 'react';
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
  Dimensions,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

import { useAuth } from '@/src/store/AuthContext';
import { useUserData } from '@/src/hooks/useUserData';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { SkeletonLoader } from '@/src/components/loading/SkeletonLoader';
import { HapticButton } from '@/src/components/ui/HapticButton';
import { theme } from '@/src/styles/theme';
import { supabase } from '@/src/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

// Fonction pour obtenir l'image du grade
const getGradeImage = (gradeId: number) => {
  const gradeImages: Record<number, any> = {
    1: require('@/assets/images/1Aspirant.png'),
    2: require('@/assets/images/2Sapeur.png'),
    3: require('@/assets/images/3Caporal.png'),
    4: require('@/assets/images/4CaporalChef.png'),
    5: require('@/assets/images/5Sergent.png'),
    6: require('@/assets/images/6SergentChef.png'),
    7: require('@/assets/images/7Adjudant.png'),
    8: require('@/assets/images/8AdjudantChef.png'),
    9: require('@/assets/images/9Lieutenant.png'),
    10: require('@/assets/images/11Capitaine.png'), // Capitaine est maintenant à la position 10
    11: require('@/assets/images/10Commandant.png'), // Commandant est maintenant à la position 11
    12: require('@/assets/images/12LieutenantColonel.png'),
    13: require('@/assets/images/13Colonel.png'),
    14: require('@/assets/images/14ControleurGeneral.png'),
    15: require('@/assets/images/15ControleurGeneralEtat.png'),
  };
  return gradeImages[gradeId] || gradeImages[1];
};

interface ISessionHistory {
  id: string;
  created_at: string;
  score: number;
  total_points_earned: number;
  config: any;
  status: string;
}

export const ProfileScreenEnhanced: React.FC = React.memo(() => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, currentGrade, nextGrade, progressToNextGrade, stats, refreshData } = useUserData();

  // États
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<ISessionHistory[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // États pour l'édition
  const [editedUsername, setEditedUsername] = useState(profile?.username || '');
  const [editedDepartment, setEditedDepartment] = useState(profile?.department || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');

  // États pour le changement de mot de passe
  const [_currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Animation refs
  const _celebrationAnimation = useRef<LottieView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    if (profile) {
      setEditedUsername(profile.username);
      setEditedDepartment(profile.department || '');
    }
    if (user) {
      setEditedEmail(user.email || '');
    }
    loadSessionHistory();
    loadThemePreference();
  }, [profile, user]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      setIsDarkMode(savedTheme === 'dark');
    } catch (_error) {}
  };

  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('theme_mode', value ? 'dark' : 'light');
    // Ici, on pourrait déclencher un changement de thème global
  };

  const loadSessionHistory = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessionHistory(data || []);
    } catch (_error) {
      console.error('Erreur chargement historique:', _error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), loadSessionHistory()]);
    setRefreshing(false);
  }, [refreshData]);

  const pickImage = async (): Promise<void> => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Vous devez autoriser l\'accès à vos photos pour changer votre avatar.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0] && user) {
        setLoading(true);
        try {
          const localImageUri = result.assets[0].uri;
          await AsyncStorage.setItem(`avatar_${user.id}`, localImageUri);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: localImageUri })
            .eq('user_id', user.id);

          if (updateError) throw updateError;

          await refreshData();
          Alert.alert('Succès', 'Photo de profil mise à jour !');
        } catch (_error) {
          Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
        } finally {
          setLoading(false);
        }
      }
    } catch (_error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert('Succès', 'Mot de passe mis à jour !');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de changer le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `🎖️ Je suis ${currentGrade.name} avec ${profile?.total_points.toLocaleString()} points sur Casque En Mains ! 🚒`,
        title: 'Mon profil Casque En Mains',
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Logique de suppression du compte
              await signOut();
              router.replace('/auth/login');
            } catch (_error) {
              Alert.alert('Erreur', 'Impossible de supprimer le compte');
            }
          },
        },
      ],
    );
  };

  const saveProfile = async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    try {
      if (editedUsername !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editedUsername)
          .single();

        if (existingUser) {
          Alert.alert('Erreur', 'Ce nom d\'utilisateur est déjà pris');
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedUsername,
          department: editedDepartment,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      if (editedEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editedEmail,
        });
        if (emailError) throw emailError;
      }

      await refreshData();
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (_error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
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

  // Données pour les graphiques
  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? '#1E1E1E' : '#ffffff',
    backgroundGradientTo: isDarkMode ? '#1E1E1E' : '#ffffff',
    color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const progressData = {
    labels: ['Maths', 'Français', 'Métier'],
    data: stats.map(s => (s.correct_answers / Math.max(s.total_questions, 1))),
  };

  const weeklyData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [{
      data: [20, 45, 28, 80, 99, 43, 50],
      color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
    }],
  };

  if (!profile) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <SkeletonLoader count={5} height={100} />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Rendu des onglets
  const StatsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Progression par thème</Text>
        <ProgressChart
          data={progressData}
          width={screenWidth - 40}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={chartConfig}
          hideLegend={false}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Activité cette semaine</Text>
        <LineChart
          data={weeklyData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{profile.total_points.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Points totaux</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#EF4444" />
          <Text style={styles.statValue}>{profile.streak_days}</Text>
          <Text style={styles.statLabel}>Jours de série</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{formatDuration(profile.total_time_played)}</Text>
          <Text style={styles.statLabel}>Temps total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statValue}>{profile.best_score}%</Text>
          <Text style={styles.statLabel}>Meilleur score</Text>
        </View>
      </View>
    </ScrollView>
  );

  const BadgesTab = () => {
    // Obtenir tous les badges disponibles et marquer ceux obtenus
    const allBadges = [
      { id: '1', name: 'Première flamme', description: 'Première session complétée', icon: '🔥', unlocked: profile.sessions_completed > 0, progress: Math.min(100, profile.sessions_completed * 100) },
      { id: '2', name: 'Série de 7 jours', description: 'Connexion 7 jours consécutifs', icon: '🎯', unlocked: profile.streak_days >= 7, progress: Math.min(100, (profile.streak_days / 7) * 100) },
      { id: '3', name: 'Perfectionniste', description: 'Score parfait dans une session', icon: '💯', unlocked: profile.best_score === 100, progress: profile.best_score },
      { id: '4', name: 'Mathématicien', description: '100 questions de maths réussies', icon: '🧮', unlocked: stats.find(s => s.theme === 'Mathématiques')?.correct_answers >= 100, progress: Math.min(100, (stats.find(s => s.theme === 'Mathématiques')?.correct_answers || 0)) },
      { id: '5', name: 'Linguiste', description: '100 questions de français réussies', icon: '📖', unlocked: stats.find(s => s.theme === 'Français')?.correct_answers >= 100, progress: Math.min(100, (stats.find(s => s.theme === 'Français')?.correct_answers || 0)) },
      { id: '6', name: 'Expert métier', description: '100 questions métier réussies', icon: '👨‍🚒', unlocked: stats.find(s => s.theme === 'Métier')?.correct_answers >= 100, progress: Math.min(100, (stats.find(s => s.theme === 'Métier')?.correct_answers || 0)) },
      { id: '7', name: 'Marathonien', description: '10 heures de jeu total', icon: '⏱️', unlocked: profile.total_time_played >= 36000, progress: Math.min(100, (profile.total_time_played / 36000) * 100) },
      { id: '8', name: 'Champion', description: 'Atteindre 5000 points', icon: '🏆', unlocked: profile.total_points >= 5000, progress: Math.min(100, (profile.total_points / 5000) * 100) },
      { id: '9', name: 'Légende', description: 'Atteindre 10000 points', icon: '⭐', unlocked: profile.total_points >= 10000, progress: Math.min(100, (profile.total_points / 10000) * 100) },
    ];

    const unlockedBadges = allBadges.filter(b => b.unlocked);
    const lockedBadges = allBadges.filter(b => !b.unlocked);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.badgesContainer}>
          {unlockedBadges.length > 0 && (
            <>
              <Text style={styles.badgeSectionTitle}>Badges obtenus ({unlockedBadges.length})</Text>
              <View style={styles.badgeGrid}>
                {unlockedBadges.map((badge) => (
                  <TouchableOpacity key={badge.id} style={styles.badgeCard}>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      style={styles.badgeGradient}
                    >
                      <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    </LinearGradient>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    <Text style={styles.badgeDescription}>{badge.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {lockedBadges.length > 0 && (
            <>
              <Text style={[styles.badgeSectionTitle, { marginTop: 20 }]}>Badges à débloquer ({lockedBadges.length})</Text>
              <View style={styles.badgeGrid}>
                {lockedBadges.map((badge) => (
                  <TouchableOpacity key={badge.id} style={[styles.badgeCard, styles.lockedBadge]}>
                    <LinearGradient
                      colors={['#9CA3AF', '#6B7280']}
                      style={styles.badgeGradient}
                    >
                      <Text style={[styles.badgeIcon, { opacity: 0.5 }]}>{badge.icon}</Text>
                    </LinearGradient>
                    <Text style={[styles.badgeName, { opacity: 0.7 }]}>{badge.name}</Text>
                    <Text style={[styles.badgeDescription, { opacity: 0.6 }]}>{badge.description}</Text>
                    <View style={styles.badgeProgress}>
                      <View style={[styles.badgeProgressFill, { width: `${badge.progress}%` }]} />
                    </View>
                    <Text style={styles.badgeProgressText}>{Math.round(badge.progress)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {allBadges.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="medal-outline" size={64} color={theme.colors.gray[400]} />
              <Text style={styles.emptyText}>Aucun badge disponible</Text>
              <Text style={styles.emptySubtext}>Les badges arrivent bientôt !</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const HistoryTab = () => (
    <ScrollView style={styles.tabContent}>
      {sessionHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={theme.colors.gray[400]} />
          <Text style={styles.emptyText}>Aucune session récente</Text>
          <Text style={styles.emptySubtext}>Commencez un entraînement pour voir votre historique</Text>
        </View>
      ) : (
        sessionHistory.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={styles.historyCard}
            onPress={() => router.push(`/training/report?sessionId=${session.id}`)}
          >
            <LinearGradient
              colors={['#DC2626', '#B91C1C']}
              style={styles.historyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyTheme}>
                    {session.config?.themes?.join(', ') || 'Entraînement mixte'}
                  </Text>
                  <Text style={styles.historyDate}>{formatDate(session.created_at)}</Text>
                </View>
                <View style={styles.historyStats}>
                  <Text style={styles.historyScore}>{Math.round(session.score)}%</Text>
                  <Text style={styles.historyPoints}>+{session.total_points_earned} pts</Text>
                </View>
              </View>
              <View style={styles.historyStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: session.status === 'completed' ? '#10B981' : '#F59E0B' },
                ]}>
                  <Text style={styles.statusText}>
                    {session.status === 'completed' ? 'Terminé' : 'Abandonné'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header moderne */}
          <BlurView intensity={80} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon Profil</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShareProfile} style={styles.headerButton}>
                <Ionicons name="share-social" size={24} color={theme.colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.headerButton}>
                <Ionicons
                  name={isEditing ? 'checkmark' : 'create-outline'}
                  size={24}
                  color={theme.colors.white}
                />
              </TouchableOpacity>
            </View>
          </BlurView>

          <ScrollView
            ref={scrollViewRef}
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
            {/* Section Avatar et Grade */}
            <FadeInView duration={600} delay={0}>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={loading}
                  activeOpacity={0.7}
                  style={styles.avatarContainer}
                >
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                  ) : (
                    <LinearGradient
                      colors={['#DC2626', '#B91C1C']}
                      style={[styles.avatar, styles.defaultAvatar]}
                    >
                      <Ionicons name="person" size={50} color={theme.colors.white} />
                    </LinearGradient>
                  )}
                  {loading ? (
                    <View style={styles.editAvatarButton}>
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    </View>
                  ) : (
                    <View style={styles.editAvatarButton}>
                      <Ionicons name="camera" size={20} color={theme.colors.white} />
                    </View>
                  )}
                </TouchableOpacity>

                {isEditing ? (
                  <View style={styles.editSection}>
                    <TextInput
                      style={styles.usernameInput}
                      value={editedUsername}
                      onChangeText={setEditedUsername}
                      placeholder="Nom d'utilisateur"
                      placeholderTextColor={theme.colors.gray[400]}
                    />
                    <TextInput
                      style={styles.departmentInput}
                      value={editedDepartment}
                      onChangeText={setEditedDepartment}
                      placeholder="Département"
                      placeholderTextColor={theme.colors.gray[400]}
                    />
                  </View>
                ) : (
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{profile.username}</Text>
                    <Text style={styles.department}>{profile.department || 'Non renseigné'}</Text>
                  </View>
                )}

                {/* Carte de grade améliorée */}
                <View style={styles.gradeSection}>
                  <LinearGradient
                    colors={[currentGrade.color, `${currentGrade.color}CC`]}
                    style={styles.gradeCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.gradeContent}>
                      <Image
                        source={getGradeImage(currentGrade.id)}
                        style={styles.gradeImage}
                        resizeMode="contain"
                      />
                      <View style={styles.gradeInfo}>
                        <Text style={styles.gradeName}>{currentGrade.name}</Text>
                        <View style={styles.pointsContainer}>
                          <Ionicons name="star" size={18} color="#FFD700" />
                          <Text style={styles.pointsText}>
                            {profile.total_points.toLocaleString()} points
                          </Text>
                        </View>
                      </View>
                    </View>

                    {nextGrade && (
                      <View style={styles.progressSection}>
                        <Text style={styles.progressLabel}>
                          Prochain: {nextGrade.name}
                        </Text>
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBg}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${progressToNextGrade}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressPercentage}>
                            {Math.round(progressToNextGrade)}%
                          </Text>
                        </View>
                        <Text style={styles.pointsToNext}>
                          {(nextGrade.minPoints - profile.total_points).toLocaleString()} points restants
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              </View>
            </FadeInView>

            {/* Tabs pour organiser le contenu */}
            <FadeInView duration={600} delay={200}>
              <View style={styles.tabsContainer}>
                <TabView
                  navigationState={{
                    index: tabIndex,
                    routes: [
                      { key: 'stats', title: 'Statistiques' },
                      { key: 'badges', title: 'Badges' },
                      { key: 'history', title: 'Historique' },
                    ],
                  }}
                  renderScene={SceneMap({
                    stats: StatsTab,
                    badges: BadgesTab,
                    history: HistoryTab,
                  })}
                  onIndexChange={setTabIndex}
                  initialLayout={{ width: screenWidth }}
                  renderTabBar={(props) => (
                    <TabBar
                      {...props}
                      style={styles.tabBar}
                      indicatorStyle={styles.tabIndicator}
                      labelStyle={styles.tabLabel}
                      activeColor={theme.colors.primary}
                      inactiveColor={theme.colors.gray[400]}
                    />
                  )}
                />
              </View>
            </FadeInView>

            {/* Section Paramètres */}
            <FadeInView duration={600} delay={400}>
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Paramètres</Text>

                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowPasswordModal(true)}
                >
                  <Ionicons name="lock-closed-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.settingText}>Changer le mot de passe</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
                </TouchableOpacity>

                <View style={styles.settingItem}>
                  <Ionicons name="moon-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.settingText}>Mode sombre</Text>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor={isDarkMode ? theme.colors.white : '#f4f3f4'}
                  />
                </View>

                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={handleDeleteAccount}
                >
                  <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                  <Text style={[styles.settingText, { color: theme.colors.error }]}>
                    Supprimer le compte
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </FadeInView>

            {/* Bouton de déconnexion */}
            <HapticButton
              onPress={() => {
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
              }}
              style={styles.logoutButton}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-out-outline" size={20} color={theme.colors.white} />
                <Text style={styles.logoutText}>Déconnexion</Text>
              </LinearGradient>
            </HapticButton>

            {isEditing && (
              <HapticButton
                onPress={saveProfile}
                disabled={loading}
                style={styles.saveButton}
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
              </HapticButton>
            )}
          </ScrollView>

          {/* Modal de changement de mot de passe */}
          <Modal
            visible={showPasswordModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPasswordModal(false)}
          >
            <BlurView intensity={100} style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Changer le mot de passe</Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor={theme.colors.gray[400]}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={theme.colors.gray[400]}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowPasswordModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleChangePassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.colors.white} />
                    ) : (
                      <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                        Confirmer
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
});

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  editSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  usernameInput: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    minWidth: 200,
    textAlign: 'center',
  },
  department: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  departmentInput: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: 150,
    textAlign: 'center',
  },
  gradeSection: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  gradeCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  gradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  gradeImage: {
    width: 80,
    height: 80,
    marginRight: theme.spacing.md,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: theme.spacing.md,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.xs,
  },
  progressBarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressPercentage: {
    position: 'absolute',
    right: 0,
    top: -18,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  pointsToNext: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  tabsContainer: {
    height: 500,
    marginTop: theme.spacing.lg,
  },
  tabBar: {
    backgroundColor: 'transparent',
  },
  tabIndicator: {
    backgroundColor: theme.colors.primary,
  },
  tabLabel: {
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  chartContainer: {
    marginBottom: theme.spacing.xl,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  badgesContainer: {
    minHeight: 400,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  badgeCard: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  badgeGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.white,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: theme.spacing.xs,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  badgeSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  lockedBadge: {
    opacity: 0.8,
  },
  badgeProgressText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  historyGradient: {
    padding: theme.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyTheme: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  historyStats: {
    alignItems: 'flex-end',
  },
  historyScore: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  historyPoints: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFD700',
  },
  historyStatus: {
    marginTop: theme.spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  settingsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
  },
  logoutButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  logoutText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  saveButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  saveText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalButtonTextPrimary: {
    color: theme.colors.white,
  },
};

ProfileScreenEnhanced.displayName = 'ProfileScreenEnhanced';
