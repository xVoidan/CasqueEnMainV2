import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/src/services/examService';
import {
  Exam,
  ExamSession,
  ExamRanking,
  ExamStatistics,
} from '@/src/types/exam';
import { theme } from '@/src/styles/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function ExamResultsScreen() {
  const { sessionId, examId } = useLocalSearchParams<{ sessionId: string; examId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [rankings, setRankings] = useState<ExamRanking[]>([]);
  const [statistics, setStatistics] = useState<ExamStatistics | null>(null);
  const [userRank, setUserRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Charger les données en parallèle
      const [examData, sessionData, rankingData, statsData] = await Promise.all([
        examService.getExamById(examId),
        loadSession(),
        examService.getExamRankings(examId, 10),
        examService.getExamStatistics(examId),
      ]);

      setExam(examData);
      setSession(sessionData);
      setRankings(rankingData);
      setStatistics(statsData);

      // Trouver le rang de l'utilisateur
      const userRanking = rankingData.find(r => r.session_id === sessionId);
      setUserRank(userRanking?.rank || 0);

    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error);
      Alert.alert('Erreur', 'Impossible de charger les résultats');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (): Promise<ExamSession | null> => {
    // Simuler le chargement de la session depuis Supabase
    // Dans la vraie implémentation, récupérer depuis la base
    return {
      id: sessionId,
      user_id: 'user-id',
      exam_id: examId,
      status: 'completed',
      score: 14.5,
      max_score: 20,
      percentage: 72.5,
      duration_seconds: 2850,
      started_at: new Date(Date.now() - 2850000).toISOString(),
      completed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      app_blur_count: 0,
      integrity_score: 100,
      warnings: [],
    } as ExamSession;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 15) return '#4CAF50';
    if (score >= 10) return '#FF9800';
    return '#F44336';
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 18) return '🏆';
    if (score >= 15) return '🌟';
    if (score >= 12) return '👍';
    if (score >= 10) return '✅';
    return '📚';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const shareResults = async () => {
    if (!session || !exam) return;

    const message = `🎯 J'ai obtenu ${session.score}/20 à l'examen "${exam.title}" du concours de sapeur-pompier professionnel !\n\n` +
      `📊 Classement : ${userRank}/${statistics?.total_participants || 0}\n` +
      `⏱️ Temps : ${formatDuration(session.duration_seconds || 0)}\n\n` +
      '#SapeurPompier #Concours #CasqueEnMains';

    try {
      await Share.share({
        message,
        title: 'Mes résultats au concours',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const generateCertificate = async () => {
    if (!session || !exam) return;

    setGeneratingCertificate(true);

    try {
      const isPassed = (session.score || 0) >= (exam.passing_score || 10);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
            }
            .certificate {
              background: white;
              border-radius: 20px;
              padding: 60px;
              max-width: 800px;
              margin: 0 auto;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
            }
            .header {
              border-bottom: 3px solid #667eea;
              padding-bottom: 30px;
              margin-bottom: 40px;
            }
            h1 {
              color: #667eea;
              font-size: 48px;
              margin: 0 0 10px 0;
              font-weight: bold;
            }
            h2 {
              color: #666;
              font-size: 24px;
              margin: 0;
              font-weight: normal;
            }
            .content {
              margin: 40px 0;
            }
            .recipient {
              font-size: 32px;
              color: #333;
              margin: 20px 0;
              font-weight: bold;
            }
            .score {
              font-size: 72px;
              color: ${getScoreColor(session.score || 0)};
              font-weight: bold;
              margin: 30px 0;
            }
            .details {
              font-size: 18px;
              color: #666;
              line-height: 1.6;
              margin: 20px 0;
            }
            .badge {
              display: inline-block;
              background: ${isPassed ? '#4CAF50' : '#FF9800'};
              color: white;
              padding: 10px 30px;
              border-radius: 30px;
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 30px;
              border-top: 2px solid #eee;
              font-size: 14px;
              color: #999;
            }
            .signature {
              margin-top: 40px;
            }
            .date {
              margin-top: 20px;
              font-size: 16px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <h1>CERTIFICAT DE PARTICIPATION</h1>
              <h2>Concours de Sapeur-Pompier Professionnel</h2>
            </div>
            
            <div class="content">
              <p style="font-size: 20px; color: #666;">Ce certificat atteste que</p>
              <div class="recipient">CANDIDAT</div>
              <p style="font-size: 18px; color: #666;">a participé à l'examen</p>
              <p style="font-size: 24px; color: #333; font-weight: bold;">"${exam.title}"</p>
              
              <div class="score">${session.score}/20</div>
              
              <div class="badge">${isPassed ? '✅ ADMIS' : '📚 À POURSUIVRE'}</div>
              
              <div class="details">
                <p><strong>Classement :</strong> ${userRank}ème sur ${statistics?.total_participants || 0} participants</p>
                <p><strong>Temps :</strong> ${formatDuration(session.duration_seconds || 0)}</p>
                <p><strong>Score d'intégrité :</strong> ${session.integrity_score}%</p>
              </div>
              
              <div class="date">
                <p>Délivré le ${new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Certificat généré par Casque En Mains</p>
              <p>Application de préparation au concours de sapeur-pompier professionnel</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Votre certificat',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération du certificat:', error);
      Alert.alert('Erreur', 'Impossible de générer le certificat');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement des résultats...</Text>
      </View>
    );
  }

  const isPassed = (session?.score || 0) >= (exam?.passing_score || 10);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec score */}
        <LinearGradient
          colors={isPassed ? ['#4CAF50', '#45a049'] : ['#FF6B6B', '#FF8E53']}
          style={styles.header}
        >
          <Text style={styles.resultTitle}>
            {isPassed ? 'Félicitations !' : 'Continuez vos efforts !'}
          </Text>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreEmoji}>{getScoreEmoji(session?.score || 0)}</Text>
            <Text style={styles.scoreText}>{session?.score || 0}</Text>
            <Text style={styles.scoreMax}>/ 20</Text>
          </View>

          <Text style={styles.examTitle}>{exam?.title}</Text>
        </LinearGradient>

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={32} color="#FFD700" />
            <Text style={styles.statValue}>{userRank}</Text>
            <Text style={styles.statLabel}>Classement</Text>
            <Text style={styles.statDetail}>
              sur {statistics?.total_participants || 0}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color="#2196F3" />
            <Text style={styles.statValue}>
              {Math.floor((session?.duration_seconds || 0) / 60)}
            </Text>
            <Text style={styles.statLabel}>Minutes</Text>
            <Text style={styles.statDetail}>
              {formatDuration(session?.duration_seconds || 0)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{session?.integrity_score}%</Text>
            <Text style={styles.statLabel}>Intégrité</Text>
            <Text style={styles.statDetail}>
              {session?.app_blur_count === 0 ? 'Parfait' : `${session?.app_blur_count} alertes`}
            </Text>
          </View>
        </View>

        {/* Top 10 du classement */}
        <View style={styles.rankingSection}>
          <Text style={styles.sectionTitle}>🏆 Top 10 du classement</Text>

          <View style={styles.rankingList}>
            {rankings.map((ranking, index) => (
              <View
                key={ranking.id}
                style={[
                  styles.rankingItem,
                  ranking.session_id === sessionId && styles.userRankingItem,
                ]}
              >
                <View style={styles.rankBadge}>
                  {index < 3 ? (
                    <Text style={styles.medalEmoji}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Text>
                  ) : (
                    <Text style={styles.rankNumber}>{ranking.rank}</Text>
                  )}
                </View>

                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingName}>
                    {ranking.user?.name || 'Anonyme'}
                    {ranking.session_id === sessionId && ' (Vous)'}
                  </Text>
                  <Text style={styles.rankingDetails}>
                    {ranking.user?.department || 'France'}
                  </Text>
                </View>

                <View style={styles.rankingScore}>
                  <Text style={styles.rankingScoreText}>{ranking.score}/20</Text>
                  <Text style={styles.rankingTime}>
                    {formatDuration(ranking.duration_seconds)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Statistiques globales */}
        {statistics && (
          <View style={styles.globalStats}>
            <Text style={styles.sectionTitle}>📊 Statistiques globales</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Moyenne</Text>
                <Text style={styles.statItemValue}>
                  {statistics.average_score.toFixed(1)}/20
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Médiane</Text>
                <Text style={styles.statItemValue}>
                  {statistics.median_score.toFixed(1)}/20
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Taux de réussite</Text>
                <Text style={styles.statItemValue}>
                  {statistics.pass_rate.toFixed(0)}%
                </Text>
              </View>
            </View>

            {/* Distribution des scores */}
            <View style={styles.distribution}>
              <Text style={styles.distributionTitle}>Distribution des scores</Text>
              {statistics.score_distribution.map((range) => (
                <View key={range.range} style={styles.distributionBar}>
                  <Text style={styles.distributionLabel}>{range.range}</Text>
                  <View style={styles.distributionBarContainer}>
                    <View
                      style={[
                        styles.distributionBarFill,
                        { width: `${range.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionValue}>{range.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={shareResults}
          >
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.actionButtonText}>Partager</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.certificateButton]}
            onPress={generateCertificate}
            disabled={generatingCertificate}
          >
            {generatingCertificate ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="document-text" size={24} color="white" />
                <Text style={styles.actionButtonText}>Certificat</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.retryButton]}
            onPress={() => router.back()}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.actionButtonText}>Nouveau</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton retour */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 30,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreEmoji: {
    fontSize: 48,
    marginRight: 15,
  },
  scoreText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreMax: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 5,
  },
  examTitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rankingSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  rankingList: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userRankingItem: {
    backgroundColor: '#E3F2FD',
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  rankingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rankingDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rankingScore: {
    alignItems: 'flex-end',
  },
  rankingScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rankingTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  globalStats: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  distribution: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  distributionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  distributionLabel: {
    width: 50,
    fontSize: 12,
    color: '#666',
  },
  distributionBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
  },
  distributionValue: {
    width: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  certificateButton: {
    backgroundColor: '#9C27B0',
  },
  retryButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 15,
    borderRadius: 25,
  },
  homeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});
